<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputText = ref('')
const removeEmptyRows = ref(true)
const trimCell = ref(true)

function parseRows(raw: string): string[][] {
  if (!raw) return []
  const lines = raw.split(/\r?\n/)
  const rows: string[][] = []
  for (const line of lines) {
    if (!line && removeEmptyRows.value) continue
    const cols = line.includes('\t')
      ? line.split('\t')
      : line.split(/\s{2,}/)
    const normalized = cols.map((c) => (trimCell.value ? c.trim() : c))
    if (removeEmptyRows.value && normalized.every((c) => c.length === 0)) continue
    rows.push(normalized)
  }
  return rows
}

function toCsvField(v: string): string {
  const escaped = v.replace(/"/g, '""')
  if (/[",\r\n]/.test(escaped)) return `"${escaped}"`
  return escaped
}

const parsedRows = computed(() => parseRows(inputText.value))
const outputText = computed(() =>
  parsedRows.value
    .map((row) => row.map((cell) => toCsvField(cell)).join(','))
    .join('\n'),
)

function clearAll() {
  inputText.value = ''
}

async function copyOutput() {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('已复制 CSV 结果。')
  } catch {
    ElMessage.error('复制失败，请手动复制。')
  }
}

function downloadCsv() {
  if (!outputText.value) return
  const blob = new Blob([`\uFEFF${outputText.value}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'table-to-csv.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="table-csv-view">
    <header class="table-csv-view__head">
      <el-breadcrumb class="table-csv-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-office' } }">办公工具</el-breadcrumb-item>
        <el-breadcrumb-item>表格转 CSV</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="table-csv-view__intro-card">
        <p class="table-csv-view__intro-desc">从 Excel/WPS 复制表格后直接粘贴，自动转为标准 CSV（含引号转义）。</p>
      </div>
    </header>

    <section class="table-csv-view__panel">
      <div class="table-csv-view__toolbar">
        <el-checkbox v-model="trimCell">清理单元格首尾空格</el-checkbox>
        <el-checkbox v-model="removeEmptyRows">去除空行</el-checkbox>
        <el-tag type="info" effect="plain">识别行数：{{ parsedRows.length }}</el-tag>
      </div>

      <div class="table-csv-view__split">
        <div class="table-csv-view__pane">
          <p class="table-csv-view__title">输入表格文本</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="14"
            resize="vertical"
            placeholder="从 Excel/WPS 复制后粘贴到这里"
          />
        </div>
        <div class="table-csv-view__pane">
          <p class="table-csv-view__title">CSV 输出</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="14"
            resize="vertical"
            readonly
            placeholder="CSV 结果会显示在这里"
          />
        </div>
      </div>

      <div class="table-csv-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
        <el-button type="primary" plain :disabled="!outputText" @click="copyOutput">复制 CSV</el-button>
        <el-button type="success" plain :disabled="!outputText" @click="downloadCsv">下载 CSV</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.table-csv-view { display: flex; flex-direction: column; gap: 16px; }
.table-csv-view__head { margin-bottom: 4px; }
.table-csv-view__crumb { font-size: 13px; }
.table-csv-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.table-csv-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.table-csv-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.table-csv-view__toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.table-csv-view__split { display: flex; gap: 14px; }
.table-csv-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.table-csv-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.table-csv-view__actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

@media (max-width: 980px) {
  .table-csv-view__split { flex-direction: column; }
}
</style>
