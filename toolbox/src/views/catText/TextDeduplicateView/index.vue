<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputText = ref('')
const ignoreCase = ref(false)
const trimLine = ref(true)
const removeEmpty = ref(true)

const lineStats = computed(() => {
  const lines = inputText.value.split(/\r?\n/)
  const nonEmpty = lines.filter((line) => line.trim().length > 0)
  return {
    total: inputText.value ? lines.length : 0,
    nonEmpty: nonEmpty.length,
  }
})

function normalizedForKey(line: string): string {
  const base = trimLine.value ? line.trim() : line
  return ignoreCase.value ? base.toLocaleLowerCase() : base
}

const dedupedLines = computed(() => {
  if (!inputText.value) return [] as string[]
  const seen = new Set<string>()
  const out: string[] = []
  const lines = inputText.value.split(/\r?\n/)
  for (const rawLine of lines) {
    const displayLine = trimLine.value ? rawLine.trim() : rawLine
    if (removeEmpty.value && displayLine.length === 0) continue
    const key = normalizedForKey(rawLine)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(displayLine)
  }
  return out
})

const outputText = computed(() => dedupedLines.value.join('\n'))

const removedCount = computed(() => {
  if (!inputText.value) return 0
  const lines = inputText.value.split(/\r?\n/)
  let effectiveInput = lines.length
  if (removeEmpty.value) {
    effectiveInput = lines.filter((line) => (trimLine.value ? line.trim() : line).length > 0).length
  }
  return Math.max(0, effectiveInput - dedupedLines.value.length)
})

function clearAll() {
  inputText.value = ''
}

async function copyOutput() {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('已复制去重结果。')
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
  a.download = 'text-deduplicate.txt'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="dedup-view">
    <header class="dedup-view__head">
      <el-breadcrumb class="dedup-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-text' } }">文本工具</el-breadcrumb-item>
        <el-breadcrumb-item>文本去重</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="dedup-view__intro-card">
        <p class="dedup-view__intro-desc">按行去重，支持保留原顺序、忽略大小写、去除空行和自动裁剪首尾空格。</p>
      </div>
    </header>

    <section class="dedup-view__panel">
      <div class="dedup-view__toolbar">
        <el-checkbox v-model="trimLine">裁剪每行首尾空格</el-checkbox>
        <el-checkbox v-model="removeEmpty">去除空行</el-checkbox>
        <el-checkbox v-model="ignoreCase">忽略大小写</el-checkbox>
      </div>

      <div class="dedup-view__stats">
        <el-tag type="info" effect="plain">输入行数：{{ lineStats.total }}</el-tag>
        <el-tag type="success" effect="plain">去重后：{{ dedupedLines.length }}</el-tag>
        <el-tag type="warning" effect="plain">移除重复：{{ removedCount }}</el-tag>
      </div>

      <div class="dedup-view__split">
        <div class="dedup-view__pane">
          <p class="dedup-view__title">输入文本（每行一条）</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="14"
            resize="vertical"
            placeholder="例如：&#10;苹果&#10;香蕉&#10;苹果&#10;  香蕉"
          />
        </div>
        <div class="dedup-view__pane">
          <p class="dedup-view__title">输出结果</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="14"
            resize="vertical"
            readonly
            placeholder="去重结果会显示在这里"
          />
        </div>
      </div>

      <div class="dedup-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyOutput">复制结果</el-button>
        <el-button type="success" plain :disabled="!outputText" @click="downloadOutput">下载 TXT</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dedup-view { display: flex; flex-direction: column; gap: 16px; }
.dedup-view__head { margin-bottom: 4px; }
.dedup-view__crumb { font-size: 13px; }
.dedup-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.dedup-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.dedup-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.dedup-view__toolbar { display: flex; flex-wrap: wrap; gap: 14px; }
.dedup-view__stats { display: flex; flex-wrap: wrap; gap: 8px; }
.dedup-view__split { display: flex; gap: 14px; }
.dedup-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.dedup-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.dedup-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

@media (max-width: 980px) {
  .dedup-view__split { flex-direction: column; }
}
</style>
