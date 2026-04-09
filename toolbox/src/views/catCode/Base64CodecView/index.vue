<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputText = ref('')
const outputText = ref('')
const errorText = ref<string | null>(null)
const urlSafe = ref(false)

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function normalizeInputBase64(raw: string): string {
  let text = raw.trim()
  if (urlSafe.value) text = text.replace(/-/g, '+').replace(/_/g, '/')
  const mod = text.length % 4
  if (mod !== 0) text += '='.repeat(4 - mod)
  return text
}

function applyUrlSafe(base64: string): string {
  if (!urlSafe.value) return base64
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function encodeText() {
  errorText.value = null
  try {
    const bytes = new TextEncoder().encode(inputText.value)
    const base64 = bytesToBase64(bytes)
    outputText.value = applyUrlSafe(base64)
  } catch (e) {
    outputText.value = ''
    errorText.value = e instanceof Error ? e.message : '编码失败。'
  }
}

function decodeText() {
  errorText.value = null
  try {
    const normalized = normalizeInputBase64(inputText.value)
    const bytes = base64ToBytes(normalized)
    outputText.value = new TextDecoder().decode(bytes)
  } catch (e) {
    outputText.value = ''
    errorText.value = e instanceof Error ? `解码失败：${e.message}` : '解码失败。'
  }
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
  errorText.value = null
}

function swapInputOutput() {
  const t = inputText.value
  inputText.value = outputText.value
  outputText.value = t
  errorText.value = null
}

const modeHint = computed(() =>
  urlSafe.value
    ? '当前为 URL Safe Base64（- / _，无尾部 =）。'
    : '当前为标准 Base64（+ / /，可能含尾部 =）。',
)

async function copyOutput() {
  if (!outputText.value) return
  await navigator.clipboard.writeText(outputText.value)
  ElMessage.success('结果已复制。')
}
</script>

<template>
  <div class="base64-page">
    <header class="base64-page__head">
      <el-breadcrumb class="base64-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-code' } }">编码工具</el-breadcrumb-item>
        <el-breadcrumb-item>Base64 编解码</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="base64-page__intro-card">
        <p class="base64-page__intro-desc">仅处理文本（UTF-8），支持标准 Base64 与 URL Safe Base64。</p>
      </div>
    </header>

    <section class="base64-panel">
      <div class="base64-top">
        <el-checkbox v-model="urlSafe">使用 URL Safe</el-checkbox>
        <span class="base64-hint">{{ modeHint }}</span>
      </div>

      <div class="base64-split">
        <div class="base64-pane">
          <p class="base64-label">输入</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="10"
            resize="none"
            placeholder="输入待编码文本或待解码 Base64"
          />
        </div>
        <div class="base64-pane">
          <p class="base64-label">输出</p>
          <el-input :model-value="outputText" type="textarea" :rows="10" readonly resize="none" />
        </div>
      </div>

      <p v-if="errorText" class="base64-error">{{ errorText }}</p>

      <div class="base64-actions">
        <el-button type="primary" :disabled="!inputText" @click="encodeText">编码</el-button>
        <el-button type="warning" plain :disabled="!inputText" @click="decodeText">解码</el-button>
        <el-button plain :disabled="!outputText" @click="copyOutput">复制结果</el-button>
        <el-button plain @click="swapInputOutput">交换输入输出</el-button>
        <el-button plain @click="clearAll">清空</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.base64-page { display: flex; flex-direction: column; gap: 16px; }
.base64-page__head { margin-bottom: 4px; }
.base64-page__crumb { font-size: 13px; }
.base64-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.base64-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.base64-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.base64-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.base64-hint { font-size: 12px; color: var(--uu-text-secondary); }
.base64-split { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 12px; }
.base64-pane { display: flex; flex-direction: column; gap: 8px; }
.base64-label { margin: 0; font-size: 13px; color: var(--uu-text); font-weight: 500; }
.base64-error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.base64-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
</style>
