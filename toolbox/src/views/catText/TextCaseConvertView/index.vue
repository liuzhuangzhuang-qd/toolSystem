<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'toggle'

const inputText = ref('')
const mode = ref<CaseMode>('upper')

const modeLabel: Record<CaseMode, string> = {
  upper: '全大写',
  lower: '全小写',
  title: '标题格式',
  sentence: '句首大写',
  camel: 'camelCase',
  pascal: 'PascalCase',
  snake: 'snake_case',
  kebab: 'kebab-case',
  toggle: '大小写互换',
}

function wordsOf(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function toTitleCase(s: string): string {
  return s
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : capitalize(part)))
    .join('')
}

function toSentenceCase(s: string): string {
  const lower = s.toLowerCase()
  return lower.replace(/(^|[.!?]\s+)([a-z\u00c0-\u024f])/g, (_m, p1, p2) => `${p1}${p2.toUpperCase()}`)
}

function toggleCase(s: string): string {
  let out = ''
  for (const ch of s) {
    const up = ch.toUpperCase()
    const low = ch.toLowerCase()
    if (ch === up && ch !== low) out += low
    else if (ch === low && ch !== up) out += up
    else out += ch
  }
  return out
}

function convertByMode(s: string, m: CaseMode): string {
  if (!s) return ''
  switch (m) {
    case 'upper':
      return s.toUpperCase()
    case 'lower':
      return s.toLowerCase()
    case 'title':
      return toTitleCase(s)
    case 'sentence':
      return toSentenceCase(s)
    case 'toggle':
      return toggleCase(s)
    case 'camel': {
      const w = wordsOf(s).map((x) => x.toLowerCase())
      if (!w.length) return ''
      return w[0] + w.slice(1).map(capitalize).join('')
    }
    case 'pascal':
      return wordsOf(s).map((x) => capitalize(x.toLowerCase())).join('')
    case 'snake':
      return wordsOf(s).map((x) => x.toLowerCase()).join('_')
    case 'kebab':
      return wordsOf(s).map((x) => x.toLowerCase()).join('-')
  }
}

const outputText = computed(() => convertByMode(inputText.value, mode.value))

function clearAll() {
  inputText.value = ''
}

async function copyOutput() {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('已复制转换结果。')
  } catch {
    ElMessage.error('复制失败，请手动复制。')
  }
}

function downloadOutput() {
  if (!outputText.value) return
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `case-convert-${mode.value}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="case-view">
    <header class="case-view__head">
      <el-breadcrumb class="case-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-text' } }">文本工具</el-breadcrumb-item>
        <el-breadcrumb-item>大小写转换</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="case-view__intro-card">
        <p class="case-view__intro-desc">支持常见大小写与命名风格互转，输入后实时转换。</p>
      </div>
    </header>

    <section class="case-view__panel">
      <div class="case-view__toolbar">
        <span class="case-view__label">转换模式</span>
        <el-radio-group v-model="mode" class="case-view__modes">
          <el-radio-button label="upper">全大写</el-radio-button>
          <el-radio-button label="lower">全小写</el-radio-button>
          <el-radio-button label="title">标题格式</el-radio-button>
          <el-radio-button label="sentence">句首大写</el-radio-button>
          <el-radio-button label="camel">camelCase</el-radio-button>
          <el-radio-button label="pascal">PascalCase</el-radio-button>
          <el-radio-button label="snake">snake_case</el-radio-button>
          <el-radio-button label="kebab">kebab-case</el-radio-button>
          <el-radio-button label="toggle">大小写互换</el-radio-button>
        </el-radio-group>
      </div>

      <div class="case-view__split">
        <div class="case-view__pane">
          <p class="case-view__title">输入文本</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="14"
            resize="vertical"
            placeholder="请输入要转换的文本..."
          />
        </div>
        <div class="case-view__pane">
          <p class="case-view__title">输出结果（{{ modeLabel[mode] }}）</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="14"
            resize="vertical"
            readonly
            placeholder="转换结果会显示在这里"
          />
        </div>
      </div>

      <div class="case-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyOutput">复制结果</el-button>
        <el-button type="success" plain :disabled="!outputText" @click="downloadOutput">下载 TXT</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.case-view { display: flex; flex-direction: column; gap: 16px; }
.case-view__head { margin-bottom: 4px; }
.case-view__crumb { font-size: 13px; }
.case-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.case-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.case-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.case-view__toolbar { display: flex; flex-direction: column; gap: 8px; }
.case-view__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.case-view__modes { flex-wrap: wrap; }
.case-view__split { display: flex; gap: 14px; }
.case-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.case-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.case-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
</style>
