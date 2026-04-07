<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAiTool } from '../../../composables/useAiTool'
import { AI_MODEL_OPTIONS } from '../../../constants/aiModels'

type SummaryMode = 'concise' | 'balanced' | 'detailed'

const inputText = ref('')
const extraPrompt = ref('')
const mode = ref<SummaryMode>('balanced')
const {
  model,
  generating,
  outputText,
  healthOk,
  runPrompt,
  clearOutput,
  copyOutput,
} = useAiTool('你是专业摘要助手，擅长在不丢失关键信息的前提下生成准确、清晰的中文摘要。')

const modeLabel: Record<SummaryMode, string> = {
  concise: '精简',
  balanced: '标准',
  detailed: '详细',
}

const inputCount = computed(() => inputText.value.trim().length)
const outputCount = computed(() => outputText.value.trim().length)

function buildPrompt(): string {
  const modeRule: Record<SummaryMode, string> = {
    concise: '输出 3-5 条要点，尽量简短。',
    balanced: '输出 5-8 条要点，覆盖核心信息。',
    detailed: '输出结构化摘要，分“核心结论 / 关键信息 / 风险与待确认项”。',
  }
  return [
    '请对以下文本做高质量中文摘要。',
    `摘要粒度：${modeLabel[mode.value]}。`,
    `要求：${modeRule[mode.value]}`,
    '不要编造原文没有的信息。',
    extraPrompt.value.trim() ? `补充要求：${extraPrompt.value.trim()}` : '',
    '',
    '原文：',
    inputText.value.trim(),
  ]
    .filter(Boolean)
    .join('\n')
}

async function generate() {
  if (!inputText.value.trim() || generating.value) return
  await runPrompt(buildPrompt(), '模型未返回可用摘要，请重试。')
}

function clearAll() {
  inputText.value = ''
  extraPrompt.value = ''
  clearOutput()
}

async function copyResult() {
  await copyOutput('已复制摘要结果。')
}
</script>

<template>
  <div class="summary-view">
    <header class="summary-view__head">
      <el-breadcrumb class="summary-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-ai' } }">AI 工具</el-breadcrumb-item>
        <el-breadcrumb-item>摘要生成</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="summary-view__intro-card">
        <p class="summary-view__intro-desc">调用大模型对长文本自动生成摘要，支持精简/标准/详细三种模式。</p>
      </div>
    </header>

    <section class="summary-view__panel">
      <div class="summary-view__toolbar">
        <span class="summary-view__label">摘要模式</span>
        <el-radio-group v-model="mode">
          <el-radio-button label="concise">精简</el-radio-button>
          <el-radio-button label="balanced">标准</el-radio-button>
          <el-radio-button label="detailed">详细</el-radio-button>
        </el-radio-group>
        <el-select v-model="model" clearable filterable class="summary-view__model" placeholder="默认模型（服务端）">
          <el-option v-for="item in AI_MODEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-tag effect="plain" :type="healthOk === false ? 'danger' : 'success'">
          {{ healthOk === false ? '服务离线' : '服务在线' }}
        </el-tag>
      </div>

      <el-input
        v-model="extraPrompt"
        placeholder="可选：补充要求（如“面向产品经理、突出风险点”）"
      />

      <div class="summary-view__split">
        <div class="summary-view__pane">
          <p class="summary-view__title">原文（{{ inputCount }} 字）</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="12"
            resize="vertical"
            placeholder="请输入要摘要的内容..."
          />
        </div>
        <div class="summary-view__pane">
          <p class="summary-view__title">摘要结果（{{ outputCount }} 字）</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="12"
            resize="vertical"
            readonly
            placeholder="摘要结果会显示在这里"
          />
        </div>
      </div>

      <div class="summary-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" :loading="generating" :disabled="!inputText.trim()" @click="generate">生成摘要</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyResult">复制摘要</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.summary-view { display: flex; flex-direction: column; gap: 16px; }
.summary-view__head { margin-bottom: 4px; }
.summary-view__crumb { font-size: 13px; }
.summary-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.summary-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.summary-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.summary-view__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.summary-view__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.summary-view__model { width: 180px; max-width: 100%; }
.summary-view__split { display: flex; gap: 14px; }
.summary-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.summary-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.summary-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

@media (max-width: 980px) {
  .summary-view__split { flex-direction: column; }
}
</style>
