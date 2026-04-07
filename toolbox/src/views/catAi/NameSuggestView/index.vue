<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAiTool } from '../../../composables/useAiTool'
import { AI_MODEL_OPTIONS } from '../../../constants/aiModels'

type NameKind = 'variable' | 'function' | 'class' | 'constant'

const inputText = ref('')
const kind = ref<NameKind>('variable')
const keepPrefix = ref('')
const {
  model,
  generating,
  outputText,
  healthOk,
  runPrompt,
  clearOutput,
  copyOutput,
} = useAiTool('你是资深软件工程师，擅长根据需求给出高质量命名。严格按用户格式要求输出。')

const kindLabel: Record<NameKind, string> = {
  variable: '变量',
  function: '函数',
  class: '类',
  constant: '常量',
}

const parsedSuggestions = computed(() =>
  outputText.value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*\d.、]+\s*/, '').trim())
    .filter(Boolean),
)

function buildPrompt(): string {
  const prefix = keepPrefix.value.trim()
  return [
    `请为以下需求生成 ${kindLabel[kind.value]} 命名建议。`,
    '要求：',
    `1) 命名类型：${kind.value}`,
    `2) 前缀：${prefix || '无'}`,
    '3) 输出 12 条建议，每行 1 条，不要编号、不要解释、不要代码块',
    '4) 命名需简洁、语义清晰，尽量符合常见编程规范',
    '',
    `需求描述：${inputText.value.trim()}`,
  ].join('\n')
}

async function generate() {
  const text = inputText.value.trim()
  if (!text || generating.value) return
  await runPrompt(buildPrompt(), '模型未返回可用内容，请重试。')
}

function clearAll() {
  inputText.value = ''
  keepPrefix.value = ''
  clearOutput()
}

async function copyResult() {
  await copyOutput('已复制命名建议。')
}
</script>

<template>
  <div class="name-view">
    <header class="name-view__head">
      <el-breadcrumb class="name-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-ai' } }">AI 工具</el-breadcrumb-item>
        <el-breadcrumb-item>命名建议</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="name-view__intro-card">
        <p class="name-view__intro-desc">输入需求描述后调用大模型生成命名建议，支持变量、函数、类和常量场景。</p>
      </div>
    </header>

    <section class="name-view__panel">
      <div class="name-view__toolbar">
        <span class="name-view__label">命名类型</span>
        <el-radio-group v-model="kind">
          <el-radio-button label="variable">变量</el-radio-button>
          <el-radio-button label="function">函数</el-radio-button>
          <el-radio-button label="class">类</el-radio-button>
          <el-radio-button label="constant">常量</el-radio-button>
        </el-radio-group>
        <el-input v-model="keepPrefix" class="name-view__prefix" placeholder="可选前缀，如 app / user / _" />
        <el-select v-model="model" clearable filterable class="name-view__model" placeholder="默认模型（服务端）">
          <el-option v-for="item in AI_MODEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-tag
          effect="plain"
          :type="healthOk === false ? 'danger' : 'success'"
        >
          {{ healthOk === false ? '服务离线' : '服务在线' }}
        </el-tag>
      </div>

      <div class="name-view__split">
        <div class="name-view__pane">
          <p class="name-view__title">需求描述</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="10"
            resize="vertical"
            placeholder="例如：用户登录失败次数限制"
          />
        </div>
        <div class="name-view__pane">
          <p class="name-view__title">建议列表（{{ parsedSuggestions.length }}）</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="10"
            resize="vertical"
            readonly
            placeholder="命名建议会显示在这里"
          />
        </div>
      </div>

      <div class="name-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" :loading="generating" :disabled="!inputText.trim()" @click="generate">生成建议</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyResult">复制建议</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.name-view { display: flex; flex-direction: column; gap: 16px; }
.name-view__head { margin-bottom: 4px; }
.name-view__crumb { font-size: 13px; }
.name-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.name-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.name-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.name-view__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.name-view__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.name-view__prefix { width: 260px; max-width: 100%; }
.name-view__model { width: 180px; max-width: 100%; }
.name-view__split { display: flex; gap: 14px; }
.name-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.name-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.name-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

@media (max-width: 980px) {
  .name-view__split { flex-direction: column; }
}
</style>
