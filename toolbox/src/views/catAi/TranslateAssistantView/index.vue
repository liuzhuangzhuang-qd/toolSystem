<script setup lang="ts">
import { ref } from 'vue'
import { useAiTool } from '../../../composables/useAiTool'
import { AI_MODEL_OPTIONS } from '../../../constants/aiModels'

type Lang = 'auto' | 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru'
type Tone = 'natural' | 'formal' | 'casual' | 'business'

const inputText = ref('')
const fromLang = ref<Lang>('auto')
const toLang = ref<Lang>('en')
const tone = ref<Tone>('natural')
const keepFormat = ref(true)
const extraPrompt = ref('')

const {
  model,
  generating,
  outputText,
  healthOk,
  runPrompt,
  clearOutput,
  copyOutput,
} = useAiTool('你是专业翻译助手，擅长准确、自然地进行多语言互译。')

const langLabel: Record<Lang, string> = {
  auto: '自动检测',
  zh: '中文',
  en: '英文',
  ja: '日文',
  ko: '韩文',
  fr: '法文',
  de: '德文',
  es: '西班牙文',
  ru: '俄文',
}

const toneLabel: Record<Tone, string> = {
  natural: '自然',
  formal: '正式',
  casual: '口语',
  business: '商务',
}

function buildPrompt(): string {
  return [
    '请将下列文本翻译为目标语言。',
    `源语言：${langLabel[fromLang.value]}`,
    `目标语言：${langLabel[toLang.value]}`,
    `语气风格：${toneLabel[tone.value]}`,
    keepFormat.value ? '尽量保留原文段落、项目符号和换行格式。' : '可重排为更自然的目标语言表达。',
    '只输出译文，不要额外解释。',
    extraPrompt.value.trim() ? `补充要求：${extraPrompt.value.trim()}` : '',
    '',
    '原文：',
    inputText.value.trim(),
  ]
    .filter(Boolean)
    .join('\n')
}

async function translateNow() {
  if (!inputText.value.trim() || generating.value) return
  await runPrompt(buildPrompt(), '模型未返回可用译文，请重试。')
}

function clearAll() {
  inputText.value = ''
  extraPrompt.value = ''
  clearOutput()
}

async function copyResult() {
  await copyOutput('已复制译文。')
}
</script>

<template>
  <div class="translate-view">
    <header class="translate-view__head">
      <el-breadcrumb class="translate-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-ai' } }">AI 工具</el-breadcrumb-item>
        <el-breadcrumb-item>翻译助手</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="translate-view__intro-card">
        <p class="translate-view__intro-desc">调用大模型进行多语言翻译，支持语气风格与格式保留控制。</p>
      </div>
    </header>

    <section class="translate-view__panel">
      <div class="translate-view__toolbar">
        <el-select v-model="fromLang" class="translate-view__lang" placeholder="源语言">
          <el-option v-for="(label, key) in langLabel" :key="`from-${key}`" :label="label" :value="key" />
        </el-select>
        <span class="translate-view__arrow">→</span>
        <el-select v-model="toLang" class="translate-view__lang" placeholder="目标语言">
          <el-option v-for="(label, key) in langLabel" :key="`to-${key}`" :label="label" :value="key" />
        </el-select>
        <el-select v-model="tone" class="translate-view__tone" placeholder="语气风格">
          <el-option v-for="(label, key) in toneLabel" :key="`tone-${key}`" :label="label" :value="key" />
        </el-select>
        <el-checkbox v-model="keepFormat">保留原格式</el-checkbox>
        <el-select v-model="model" clearable filterable class="translate-view__model" placeholder="默认模型（服务端）">
          <el-option v-for="item in AI_MODEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-tag effect="plain" :type="healthOk === false ? 'danger' : 'success'">
          {{ healthOk === false ? '服务离线' : '服务在线' }}
        </el-tag>
      </div>

      <el-input
        v-model="extraPrompt"
        placeholder="可选：术语偏好或补充要求（如“将 AI 统一翻译为人工智能”）"
      />

      <div class="translate-view__split">
        <div class="translate-view__pane">
          <p class="translate-view__title">原文</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="12"
            resize="vertical"
            placeholder="请输入待翻译文本..."
          />
        </div>
        <div class="translate-view__pane">
          <p class="translate-view__title">译文</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="12"
            resize="vertical"
            readonly
            placeholder="译文会显示在这里"
          />
        </div>
      </div>

      <div class="translate-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" :loading="generating" :disabled="!inputText.trim()" @click="translateNow">开始翻译</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyResult">复制译文</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.translate-view { display: flex; flex-direction: column; gap: 16px; }
.translate-view__head { margin-bottom: 4px; }
.translate-view__crumb { font-size: 13px; }
.translate-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.translate-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.translate-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.translate-view__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.translate-view__lang { width: 140px; }
.translate-view__tone { width: 120px; }
.translate-view__model { width: 180px; max-width: 100%; }
.translate-view__arrow { color: var(--uu-text-secondary); }
.translate-view__split { display: flex; gap: 14px; }
.translate-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.translate-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.translate-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

@media (max-width: 980px) {
  .translate-view__split { flex-direction: column; }
}
</style>
