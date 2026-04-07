<script setup lang="ts">
import { computed, ref } from 'vue'

type DiffRow = {
  type: 'same' | 'add' | 'remove'
  leftNo: number | null
  rightNo: number | null
  text: string
}

const leftText = ref('')
const rightText = ref('')
const hideSame = ref(false)

const leftLines = computed(() => leftText.value.split(/\r?\n/))
const rightLines = computed(() => rightText.value.split(/\r?\n/))

function buildDiffRows(a: string[], b: string[]): DiffRow[] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0))

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const rows: DiffRow[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: 'same', leftNo: i + 1, rightNo: j + 1, text: a[i] })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'remove', leftNo: i + 1, rightNo: null, text: a[i] })
      i += 1
    } else {
      rows.push({ type: 'add', leftNo: null, rightNo: j + 1, text: b[j] })
      j += 1
    }
  }
  while (i < n) {
    rows.push({ type: 'remove', leftNo: i + 1, rightNo: null, text: a[i] })
    i += 1
  }
  while (j < m) {
    rows.push({ type: 'add', leftNo: null, rightNo: j + 1, text: b[j] })
    j += 1
  }
  return rows
}

const allRows = computed(() => buildDiffRows(leftLines.value, rightLines.value))
const rows = computed(() => (hideSame.value ? allRows.value.filter((r) => r.type !== 'same') : allRows.value))

const stats = computed(() => {
  let same = 0
  let add = 0
  let remove = 0
  for (const row of allRows.value) {
    if (row.type === 'same') same += 1
    else if (row.type === 'add') add += 1
    else remove += 1
  }
  return { same, add, remove }
})

function clearAll() {
  leftText.value = ''
  rightText.value = ''
}
</script>

<template>
  <div class="compare-view">
    <header class="compare-view__head">
      <el-breadcrumb class="compare-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-text' } }">文本工具</el-breadcrumb-item>
        <el-breadcrumb-item>文本对比</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="compare-view__intro-card">
        <p class="compare-view__intro-desc">按行对比两段文本，标记新增行与删除行，帮助快速定位改动。</p>
      </div>
    </header>

    <section class="compare-view__panel">
      <div class="compare-view__split">
        <div class="compare-view__pane">
          <p class="compare-view__title">原文本</p>
          <el-input v-model="leftText" type="textarea" :rows="11" resize="vertical" placeholder="粘贴原文本..." />
        </div>
        <div class="compare-view__pane">
          <p class="compare-view__title">新文本</p>
          <el-input v-model="rightText" type="textarea" :rows="11" resize="vertical" placeholder="粘贴新文本..." />
        </div>
      </div>

      <div class="compare-view__toolbar">
        <el-checkbox v-model="hideSame">隐藏相同行</el-checkbox>
        <el-tag type="success" effect="plain">新增 {{ stats.add }}</el-tag>
        <el-tag type="danger" effect="plain">删除 {{ stats.remove }}</el-tag>
        <el-tag type="info" effect="plain">相同 {{ stats.same }}</el-tag>
      </div>

      <div class="compare-view__result">
        <div class="compare-view__result-head">
          <span>原</span>
          <span>新</span>
          <span>内容</span>
        </div>
        <div v-if="rows.length" class="compare-view__rows">
          <div v-for="(row, idx) in rows" :key="`${idx}-${row.leftNo}-${row.rightNo}`" class="compare-view__row" :class="`compare-view__row--${row.type}`">
            <span class="compare-view__num">{{ row.leftNo ?? '' }}</span>
            <span class="compare-view__num">{{ row.rightNo ?? '' }}</span>
            <span class="compare-view__text">{{ row.text || ' ' }}</span>
          </div>
        </div>
        <div v-else class="compare-view__empty">暂无差异</div>
      </div>

      <div class="compare-view__actions">
        <el-button type="danger" plain @click="clearAll">清空</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.compare-view { display: flex; flex-direction: column; gap: 16px; }
.compare-view__head { margin-bottom: 4px; }
.compare-view__crumb { font-size: 13px; }
.compare-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.compare-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.compare-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.compare-view__split { display: flex; gap: 14px; }
.compare-view__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.compare-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.compare-view__toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.compare-view__result { border: 1px solid var(--el-border-color-lighter); border-radius: 10px; overflow: hidden; }
.compare-view__result-head { display: grid; grid-template-columns: 56px 56px 1fr; background: #f8fafc; color: var(--uu-text-secondary); font-size: 12px; padding: 8px 10px; font-weight: 600; }
.compare-view__rows { max-height: 320px; overflow: auto; }
.compare-view__row { display: grid; grid-template-columns: 56px 56px 1fr; padding: 8px 10px; border-top: 1px solid var(--el-border-color-lighter); font-size: 13px; }
.compare-view__row--add { background: rgba(34, 197, 94, 0.12); }
.compare-view__row--remove { background: rgba(239, 68, 68, 0.12); }
.compare-view__num { color: var(--uu-text-secondary); font-variant-numeric: tabular-nums; }
.compare-view__text { white-space: pre-wrap; word-break: break-word; color: var(--uu-text); }
.compare-view__empty { padding: 20px; font-size: 13px; color: var(--uu-text-secondary); text-align: center; }
.compare-view__actions { display: flex; justify-content: flex-end; }

@media (max-width: 980px) {
  .compare-view__split { flex-direction: column; }
}
</style>
