<script setup lang="ts">
import { ref } from 'vue'
import { useAiTool } from '../../../composables/useAiTool'
import { AI_MODEL_OPTIONS } from '../../../constants/aiModels'

type ExpandStyle = 'natural' | 'professional' | 'marketing' | 'social'
type ExpandLength = 'short' | 'medium' | 'long'

const inputText = ref('')
const extraPrompt = ref('')
const style = ref<ExpandStyle>('natural')
const length = ref<ExpandLength>('medium')
const {
  model,
  generating,
  outputText,
  healthOk,
  runPrompt,
  clearOutput,
  copyOutput,
} = useAiTool('你是资深中文写作助手，擅长在保留原意的前提下进行文案扩写。')

function buildPrompt(): string {
  const styleRule: Record<ExpandStyle, string> = {
    natural: '语言自然流畅，适合日常说明。',
    professional: '语气专业严谨，适合工作汇报或方案文档。',
    marketing: '更有感染力和号召力，适合营销文案。',
    social: '轻松口语化，适合社媒发布。',
  }
  const lenRule: Record<ExpandLength, string> = {
    short: '扩写到约 80-120 字。',
    medium: '扩写到约 180-260 字。',
    long: '扩写到约 320-500 字。',
  }
  return [
    '请将下面这段文案进行扩写。',
    `风格：${styleRule[style.value]}`,
    `长度：${lenRule[length.value]}`,
    '要求：语义忠于原文，不杜撰事实，结构清晰，避免空话套话。',
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
  await runPrompt(buildPrompt(), '模型未返回可用内容，请重试。')
}

function clearAll() {
  inputText.value = ''
  extraPrompt.value = ''
  clearOutput()
}

async function copyResult() {
  await copyOutput('已复制扩写结果。')
}
</script>

<template>
  <div class="expand-view">
    <header class="expand-view__head">
      <el-breadcrumb class="expand-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-ai' } }">AI 工具</el-breadcrumb-item>
        <el-breadcrumb-item>文案扩写</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="expand-view__intro-card">
        <p class="expand-view__intro-desc">调用大模型对短文案进行扩写，支持风格与长度控制。</p>
      </div>
    </header>

    <section class="expand-view__panel">
      <div class="expand-view__toolbar">
        <span class="expand-view__label">扩写风格</span>
        <el-radio-group v-model="style">
          <el-radio-button label="natural">自然</el-radio-button>
          <el-radio-button label="professional">专业</el-radio-button>
          <el-radio-button label="marketing">营销</el-radio-button>
          <el-radio-button label="social">社媒</el-radio-button>
        </el-radio-group>
        <span class="expand-view__label">长度</span>
        <el-radio-group v-model="length">
          <el-radio-button label="short">短</el-radio-button>
          <el-radio-button label="medium">中</el-radio-button>
          <el-radio-button label="long">长</el-radio-button>
        </el-radio-group>
        <el-select v-model="model" clearable filterable class="expand-view__model" placeholder="默认模型（服务端）">
          <el-option v-for="item in AI_MODEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-tag effect="plain" :type="healthOk === false ? 'danger' : 'success'">
          {{ healthOk === false ? '服务离线' : '服务在线' }}
        </el-tag>
      </div>

      <el-input
        v-model="extraPrompt"
        placeholder="可选：补充要求（如“面向大学生，语气活泼”）"
      />

      <div class="expand-view__split">
        <div class="expand-view__pane">
          <p class="expand-view__title">原文案</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="11"
            resize="vertical"
            placeholder="例如：我们新上线了会员功能，欢迎体验。"
          />
        </div>
        <div class="expand-view__pane">
          <p class="expand-view__title">扩写结果</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="11"
            resize="vertical"
            readonly
            placeholder="扩写结果会显示在这里"
          />
        </div>
      </div>

      <div class="expand-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" :loading="generating" :disabled="!inputText.trim()" @click="generate">生成扩写</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyResult">复制结果</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.expand-view { display: flex; flex-direction: column; gap: 16px; }
.expand-view__head { margin-bottom: 4px; }
.expand-view__crumb { font-size: 13px; }
.expand-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.expand-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.expand-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.expand-view__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.expand-view__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.expand-view__model { width: 180px; max-width: 100%; }
.expand-view__split { display: flex; gap: 14px; }
.expand-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.expand-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.expand-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

@media (max-width: 980px) {
  .expand-view__split { flex-direction: column; }
}
</style>
