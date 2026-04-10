<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as OpenCC from 'opencc-js'

type ZhMode = 's2t' | 't2s'

const inputText = ref('')
const mode = ref<ZhMode>('s2t')

const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' })
const t2sConverter = OpenCC.Converter({ from: 'tw', to: 'cn' })

const modeLabel: Record<ZhMode, string> = {
  s2t: '简体 -> 繁体',
  t2s: '繁体 -> 简体',
}

const outputText = computed(() => {
  if (!inputText.value) return ''
  return mode.value === 's2t' ? s2tConverter(inputText.value) : t2sConverter(inputText.value)
})

function clearAll() {
  inputText.value = ''
}

function swapMode() {
  mode.value = mode.value === 's2t' ? 't2s' : 's2t'
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
  a.download = `zh-convert-${mode.value}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="zh-view">
    <header class="zh-view__head">
      <el-breadcrumb class="zh-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-text' } }">文本工具</el-breadcrumb-item>
        <el-breadcrumb-item>简繁转换</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="zh-view__intro-card">
        <p class="zh-view__intro-desc">支持简体与繁体中文实时互转，适用于文案整理、网页内容校对与多地区文本发布。</p>
      </div>
    </header>

    <section class="zh-view__panel">
      <div class="zh-view__toolbar">
        <span class="zh-view__label">转换方向</span>
        <el-radio-group v-model="mode" class="zh-view__modes">
          <el-radio-button label="s2t">简体 -> 繁体</el-radio-button>
          <el-radio-button label="t2s">繁体 -> 简体</el-radio-button>
        </el-radio-group>
        <el-button plain @click="swapMode">切换方向</el-button>
      </div>

      <div class="zh-view__split">
        <div class="zh-view__pane">
          <p class="zh-view__title">输入文本</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="14"
            resize="vertical"
            placeholder="请输入需要转换的中文文本..."
          />
        </div>
        <div class="zh-view__pane">
          <p class="zh-view__title">输出结果（{{ modeLabel[mode] }}）</p>
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

      <div class="zh-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyOutput">复制结果</el-button>
        <el-button type="success" plain :disabled="!outputText" @click="downloadOutput">下载 TXT</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.zh-view { display: flex; flex-direction: column; gap: 16px; }
.zh-view__head { margin-bottom: 4px; }
.zh-view__crumb { font-size: 13px; }
.zh-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.zh-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.zh-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.zh-view__toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.zh-view__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.zh-view__modes { flex-wrap: wrap; }
.zh-view__split { display: flex; gap: 14px; }
.zh-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.zh-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.zh-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

@media (max-width: 980px) {
  .zh-view__split { flex-direction: column; }
}
</style>
