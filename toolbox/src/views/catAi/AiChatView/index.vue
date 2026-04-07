<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { Loading, Promotion, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  postChat,
  getHealth,
  ChatApiError,
  type ChatMessageDto,
  type ChatRequestDto,
  type ChatUsage,
} from '../../../api/chat'
import { AI_MODEL_OPTIONS } from '../../../constants/aiModels'

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

const input = ref('')
const messages = ref<Msg[]>([])
const scrollInnerRef = ref<HTMLElement | null>(null)
const sending = ref(false)
const model = ref<string>('')
const lastUsage = ref<ChatUsage | null>(null)
const lastModel = ref<string | null>(null)
const healthOk = ref<boolean | null>(null)
const healthService = ref<string | undefined>(undefined)

function scrollToBottom() {
  nextTick(() => {
    const el = scrollInnerRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

watch(
  () => messages.value.length,
  () => scrollToBottom(),
)

watch(sending, (v) => {
  if (v) scrollToBottom()
})

function toRequestMessages(): ChatMessageDto[] {
  return messages.value.map((m) => ({
    role: m.role,
    content: m.content,
  }))
}

onMounted(async () => {
  try {
    const h = await getHealth()
    if (h?.success) {
      healthOk.value = true
      healthService.value = h.service
    } else {
      healthOk.value = false
    }
  } catch {
    healthOk.value = false
  }
})

async function send() {
  const t = input.value.trim()
  if (!t || sending.value) return
  sending.value = true
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: t,
  })
  input.value = ''
  scrollToBottom()

  try {
    const body: ChatRequestDto = {
      messages: toRequestMessages(),
    }
    if (model.value.trim()) {
      body.model = model.value.trim()
    }
    const data = await postChat(body)
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.reply,
    })
    lastUsage.value = data.usage ?? null
    lastModel.value = data.model ?? null
  } catch (e) {
    if (e instanceof ChatApiError) {
      ElMessage.error(e.message)
    } else {
      ElMessage.error('网络异常，请检查连接或稍后重试。')
    }
    messages.value.pop()
    input.value = t
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function clearChat() {
  messages.value = []
  lastUsage.value = null
  lastModel.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="ai-chat">
    <div class="ai-chat__top">
      <header class="ai-chat__head">
        <div class="ai-chat__head-row">
          <el-breadcrumb class="ai-chat__crumb" separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-ai' } }">
              AI 工具
            </el-breadcrumb-item>
            <el-breadcrumb-item>AI对话</el-breadcrumb-item>
          </el-breadcrumb>
          <div class="ai-chat__meta">
            <span
              class="ai-chat__health"
              :class="{
                'ai-chat__health--ok': healthOk === true,
                'ai-chat__health--bad': healthOk === false,
                'ai-chat__health--unk': healthOk === null,
              }"
              :title="healthService ? `服务：${healthService}` : undefined"
            >
              {{
                healthOk === null
                  ? '检测中…'
                  : healthOk
                    ? '服务在线'
                    : '健康检查失败'
              }}
            </span>
            <el-button
              v-if="messages.length"
              text
              type="primary"
              class="ai-chat__clear"
              :disabled="sending"
              @click="clearChat"
            >
              清空对话
            </el-button>
          </div>
        </div>
      </header>

      <div class="ai-chat__toolbar">
        <span class="ai-chat__toolbar-label">模型</span>
        <el-select
          v-model="model"
          placeholder="默认（服务端）"
          clearable
          filterable
          class="ai-chat__model"
          :disabled="sending"
        >
          <el-option v-for="item in AI_MODEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <p v-if="lastModel || lastUsage" class="ai-chat__usage">
          <template v-if="lastModel">当前：{{ lastModel }}</template>
          <template v-if="lastUsage">
            · token：{{ lastUsage.total_tokens }}（输入 {{ lastUsage.prompt_tokens }} / 输出
            {{ lastUsage.completion_tokens }}）
          </template>
        </p>
      </div>
    </div>

    <div class="ai-chat__shell">
      <div ref="scrollInnerRef" class="ai-chat__scroll">
        <div v-if="!messages.length" class="ai-chat__empty">
          <div class="ai-chat__empty-icon">💬</div>
          <p class="ai-chat__empty-title">开始对话</p>
          <p class="ai-chat__empty-desc">
            通过后端 <code class="ai-chat__code">POST /api/chat</code> 调用通义千问（OpenAI
            兼容）。Enter 发送，Shift+Enter 换行；刷新页面会清空本会话。
          </p>
        </div>

        <ul v-else class="ai-chat__list" role="list">
          <li
            v-for="m in messages"
            :key="m.id"
            class="ai-chat__msg"
            :class="m.role === 'user' ? 'ai-chat__msg--user' : 'ai-chat__msg--bot'"
          >
            <div
              class="ai-chat__avatar"
              :class="m.role === 'user' ? 'ai-chat__avatar--user' : 'ai-chat__avatar--bot'"
            >
              <el-icon v-if="m.role === 'user'" :size="18"><User /></el-icon>
              <span v-else class="ai-chat__avatar-emoji">✨</span>
            </div>
            <div class="ai-chat__bubble">
              <p class="ai-chat__text">{{ m.content }}</p>
            </div>
          </li>
          <li
            v-if="sending"
            class="ai-chat__msg ai-chat__msg--bot ai-chat__msg--typing"
            aria-live="polite"
            aria-busy="true"
          >
            <div class="ai-chat__avatar ai-chat__avatar--bot">
              <span class="ai-chat__avatar-emoji">✨</span>
            </div>
            <div class="ai-chat__bubble ai-chat__bubble--typing">
              <el-icon class="ai-chat__typing-icon is-loading" :size="18">
                <Loading />
              </el-icon>
              <span class="ai-chat__typing-text">正在生成回复…</span>
            </div>
          </li>
        </ul>
      </div>

      <footer class="ai-chat__footer">
        <el-input
          v-model="input"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 5 }"
          placeholder="输入消息，Enter 发送…"
          resize="none"
          class="ai-chat__input"
          @keydown="onKeydown"
        />
        <el-button
          type="primary"
          class="ai-chat__send"
          :loading="sending"
          :disabled="!input.trim()"
          @click="send"
        >
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
}

.ai-chat__top {
  flex-shrink: 0;
}

.ai-chat__head {
  margin-bottom: 10px;
}

.ai-chat__head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ai-chat__crumb {
  font-size: 13px;
}

.ai-chat__crumb :deep(.el-breadcrumb__separator) {
  margin: 0 6px;
  color: var(--el-border-color);
}

.ai-chat__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.ai-chat__health {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  color: var(--uu-text-secondary);
}

.ai-chat__health--ok {
  color: var(--el-color-success);
  border-color: rgba(103, 194, 58, 0.35);
  background: rgba(103, 194, 58, 0.06);
}

.ai-chat__health--bad {
  color: var(--el-color-warning);
  border-color: rgba(230, 162, 60, 0.4);
  background: rgba(230, 162, 60, 0.08);
}

.ai-chat__health--unk {
  opacity: 0.85;
}

.ai-chat__clear {
  padding: 4px 8px;
}

.ai-chat__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--uu-text-secondary);
}

.ai-chat__toolbar-label {
  flex-shrink: 0;
  color: var(--uu-text);
  font-weight: 500;
}

.ai-chat__model {
  width: 200px;
  max-width: 100%;
}

.ai-chat__usage {
  margin: 0;
  flex: 1;
  min-width: 200px;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.ai-chat__shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.ai-chat__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 0 16px;
  background: transparent;
  -webkit-overflow-scrolling: touch;
}

.ai-chat__empty {
  padding: 48px 24px;
  text-align: center;
  max-width: 440px;
  margin: 0 auto;
}

.ai-chat__empty-icon {
  font-size: 44px;
  line-height: 1;
  margin-bottom: 12px;
  opacity: 0.9;
}

.ai-chat__empty-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: var(--uu-text);
}

.ai-chat__empty-desc {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}

.ai-chat__code {
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--uu-text);
}

.ai-chat__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-chat__msg {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  max-width: 100%;
}

.ai-chat__msg--user {
  flex-direction: row-reverse;
}

.ai-chat__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.ai-chat__avatar--user {
  background: linear-gradient(145deg, #6366f1, #8b5cf6);
  color: #fff;
}

.ai-chat__avatar--bot {
  background: var(--el-fill-color-light);
  color: var(--uu-text-secondary);
}

.ai-chat__avatar-emoji {
  font-size: 13px;
  line-height: 1;
}

.ai-chat__bubble {
  max-width: min(720px, 85%);
  padding: 12px 14px;
  border-radius: 12px;
  line-height: 1.55;
  font-size: 14px;
  color: var(--uu-text);
}

.ai-chat__msg--user .ai-chat__bubble {
  background: linear-gradient(
    135deg,
    rgba(92, 103, 242, 0.14) 0%,
    rgba(139, 92, 246, 0.12) 100%
  );
  border: 1px solid rgba(92, 103, 242, 0.2);
  border-bottom-right-radius: 4px;
}

.ai-chat__msg--bot .ai-chat__bubble {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-bottom-left-radius: 4px;
}

.ai-chat__bubble--typing {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--uu-text-secondary);
}

.ai-chat__typing-text {
  font-size: 14px;
  user-select: none;
}

.ai-chat__typing-icon {
  color: var(--el-color-primary);
}

.ai-chat__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-chat__footer {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 0 0;
  margin-top: 0;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--uu-bg);
}

.ai-chat__input {
  flex: 1;
  min-width: 0;
}

.ai-chat__input :deep(.el-textarea__inner) {
  border-radius: 10px;
  box-shadow: none;
}
.ai-chat__input :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px rgba(92, 103, 242, 0.35);
}

.ai-chat__send {
  flex-shrink: 0;
  border-radius: 10px;
  padding-left: 18px;
  padding-right: 18px;
}
</style>
