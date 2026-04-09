<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

type SortMode = 'none' | 'asc' | 'desc'

const minValue = ref(0)
const maxValue = ref(100)
const count = ref(10)
const decimalPlaces = ref(0)
const uniqueOnly = ref(false)
const sortMode = ref<SortMode>('none')

const result = ref<number[]>([])
const errorText = ref<string | null>(null)

const isIntegerMode = computed(() => decimalPlaces.value === 0)
watch(decimalPlaces, (v) => {
  if (v > 0 && uniqueOnly.value) uniqueOnly.value = false
})

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateRandomNumbers() {
  errorText.value = null
  result.value = []

  const min = Number(minValue.value)
  const max = Number(maxValue.value)
  const n = Math.floor(Number(count.value))
  const places = Math.floor(Number(decimalPlaces.value))

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    errorText.value = '最小值和最大值必须是有效数字。'
    return
  }
  if (max < min) {
    errorText.value = '最大值不能小于最小值。'
    return
  }
  if (!Number.isFinite(n) || n < 1 || n > 10000) {
    errorText.value = '生成数量范围为 1 ~ 10000。'
    return
  }
  if (!Number.isFinite(places) || places < 0 || places > 8) {
    errorText.value = '小数位数范围为 0 ~ 8。'
    return
  }

  if (uniqueOnly.value && places === 0) {
    const uniqueCap = Math.floor(max) - Math.ceil(min) + 1
    if (uniqueCap < n) {
      errorText.value = '当前整数范围不足以生成指定数量的不重复随机数。'
      return
    }
  }

  const values: number[] = []
  if (uniqueOnly.value && places === 0) {
    const start = Math.ceil(min)
    const end = Math.floor(max)
    const pool = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = pool[i]
      pool[i] = pool[j]
      pool[j] = tmp
    }
    result.value = pool.slice(0, n)
  } else {
    const seen = new Set<number>()
    let guard = 0
    const maxAttempts = Math.max(n * 40, 2000)
    while (values.length < n && guard < maxAttempts) {
      let value = randomInRange(min, max)
      if (places === 0) value = Math.floor(value)
      else value = Number(value.toFixed(places))

      if (!uniqueOnly.value) {
        values.push(value)
      } else if (!seen.has(value)) {
        seen.add(value)
        values.push(value)
      }
      guard += 1
    }

    if (values.length < n) {
      errorText.value = '在当前范围与精度下，无法生成足够多的不重复随机数。请增大范围或减少数量。'
      return
    }
    result.value = values
  }

  if (sortMode.value === 'asc') result.value.sort((a, b) => a - b)
  if (sortMode.value === 'desc') result.value.sort((a, b) => b - a)
}

const resultText = computed(() => result.value.join('\n'))

async function copyResult() {
  if (!result.value.length) {
    ElMessage.info('暂无结果，请先生成随机数。')
    return
  }
  try {
    await navigator.clipboard.writeText(resultText.value)
    ElMessage.success('已复制结果。')
  } catch {
    ElMessage.error('复制失败，请手动复制。')
  }
}

function clearAll() {
  result.value = []
  errorText.value = null
}
</script>

<template>
  <div class="random-page">
    <header class="random-page__head">
      <el-breadcrumb class="random-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-num' } }">数字工具</el-breadcrumb-item>
        <el-breadcrumb-item>随机数生成</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="random-page__intro-card">
        <p class="random-page__intro-desc">支持范围、数量、小数位、不重复与排序设置，结果可一键复制。</p>
      </div>
    </header>

    <section class="random-panel">
      <div class="random-controls">
        <div class="random-control">
          <span class="random-label">最小值</span>
          <el-input-number v-model="minValue" :step="1" :precision="decimalPlaces" controls-position="right" />
        </div>
        <div class="random-control">
          <span class="random-label">最大值</span>
          <el-input-number v-model="maxValue" :step="1" :precision="decimalPlaces" controls-position="right" />
        </div>
        <div class="random-control">
          <span class="random-label">生成数量</span>
          <el-input-number v-model="count" :min="1" :max="10000" :step="1" controls-position="right" />
        </div>
        <div class="random-control">
          <span class="random-label">小数位数</span>
          <el-slider v-model="decimalPlaces" :min="0" :max="8" :step="1" show-input :show-input-controls="false" />
        </div>
      </div>

      <div class="random-options">
        <el-checkbox v-model="uniqueOnly" :disabled="!isIntegerMode">仅生成不重复值（仅整数模式）</el-checkbox>
        <el-radio-group v-model="sortMode">
          <el-radio-button label="none">不排序</el-radio-button>
          <el-radio-button label="asc">升序</el-radio-button>
          <el-radio-button label="desc">降序</el-radio-button>
        </el-radio-group>
      </div>

      <p v-if="errorText" class="random-error">{{ errorText }}</p>

      <el-input
        :model-value="resultText"
        type="textarea"
        :rows="12"
        readonly
        resize="none"
        placeholder="点击“生成随机数”后在此展示结果（每行一个）"
      />

      <div class="random-actions">
        <el-button type="primary" @click="generateRandomNumbers">生成随机数</el-button>
        <el-button plain @click="clearAll">清空结果</el-button>
        <el-button type="success" plain :disabled="!result.length" @click="copyResult">复制结果</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.random-page { display: flex; flex-direction: column; gap: 16px; }
.random-page__head { margin-bottom: 4px; }
.random-page__crumb { font-size: 13px; }
.random-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.random-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.random-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.random-controls { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 14px; }
.random-control { display: flex; flex-direction: column; gap: 8px; }
.random-label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.random-options { display: flex; gap: 14px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.random-error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.random-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
</style>
