<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue }

const jwtInput = ref('')
const errorText = ref<string | null>(null)

function base64UrlToBase64(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4
  if (pad === 0) return normalized
  return normalized + '='.repeat(4 - pad)
}

function decodeBase64UrlUtf8(input: string): string {
  const b64 = base64UrlToBase64(input)
  const binary = atob(b64)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function safeParseJson(text: string): JsonValue {
  return JSON.parse(text) as JsonValue
}

const tokenParts = computed(() => {
  const raw = jwtInput.value.trim()
  if (!raw) return null
  const parts = raw.split('.')
  if (parts.length !== 3) return null
  return {
    headerRaw: parts[0],
    payloadRaw: parts[1],
    signatureRaw: parts[2],
  }
})

const parsed = computed(() => {
  errorText.value = null
  if (!tokenParts.value) {
    if (jwtInput.value.trim()) errorText.value = 'JWT 格式无效，应为 3 段（header.payload.signature）。'
    return null
  }
  try {
    const headerText = decodeBase64UrlUtf8(tokenParts.value.headerRaw)
    const payloadText = decodeBase64UrlUtf8(tokenParts.value.payloadRaw)
    const header = safeParseJson(headerText)
    const payload = safeParseJson(payloadText)
    return {
      header,
      payload,
      signature: tokenParts.value.signatureRaw,
    }
  } catch (e) {
    errorText.value = e instanceof Error ? `解析失败：${e.message}` : '解析失败。'
    return null
  }
})

function fmtJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function toDateString(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  // JWT 标准时间戳单位是秒
  return new Date(value * 1000).toLocaleString()
}

const headerText = computed(() => (parsed.value ? fmtJson(parsed.value.header) : ''))
const payloadText = computed(() => (parsed.value ? fmtJson(parsed.value.payload) : ''))
const signatureText = computed(() => (parsed.value ? parsed.value.signature : ''))

const expText = computed(() => {
  if (!parsed.value || typeof parsed.value.payload !== 'object' || parsed.value.payload === null) return '-'
  return toDateString((parsed.value.payload as Record<string, unknown>).exp)
})
const iatText = computed(() => {
  if (!parsed.value || typeof parsed.value.payload !== 'object' || parsed.value.payload === null) return '-'
  return toDateString((parsed.value.payload as Record<string, unknown>).iat)
})
const nbfText = computed(() => {
  if (!parsed.value || typeof parsed.value.payload !== 'object' || parsed.value.payload === null) return '-'
  return toDateString((parsed.value.payload as Record<string, unknown>).nbf)
})

async function copyText(value: string, msg: string) {
  if (!value) return
  await navigator.clipboard.writeText(value)
  ElMessage.success(msg)
}

function clearAll() {
  jwtInput.value = ''
  errorText.value = null
}
</script>

<template>
  <div class="jwt-page">
    <header class="jwt-page__head">
      <el-breadcrumb class="jwt-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-code' } }">编码工具</el-breadcrumb-item>
        <el-breadcrumb-item>JWT 解析</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="jwt-page__intro-card">
        <p class="jwt-page__intro-desc">本地解析 JWT Header/Payload，不会校验签名，也不会上传任何数据。</p>
      </div>
    </header>

    <section class="jwt-panel">
      <div class="jwt-field">
        <p class="jwt-label">JWT Token</p>
        <el-input
          v-model="jwtInput"
          type="textarea"
          :rows="5"
          resize="none"
          placeholder="粘贴 JWT，例如：eyJ... .eyJ... .Sfl..."
        />
      </div>

      <p v-if="errorText" class="jwt-error">{{ errorText }}</p>

      <div class="jwt-meta">
        <div class="jwt-meta__item"><span>签发时间 iat</span><b>{{ iatText }}</b></div>
        <div class="jwt-meta__item"><span>生效时间 nbf</span><b>{{ nbfText }}</b></div>
        <div class="jwt-meta__item"><span>过期时间 exp</span><b>{{ expText }}</b></div>
      </div>

      <div class="jwt-split">
        <div class="jwt-pane">
          <p class="jwt-label">Header</p>
          <el-input :model-value="headerText" type="textarea" :rows="10" readonly resize="none" />
        </div>
        <div class="jwt-pane">
          <p class="jwt-label">Payload</p>
          <el-input :model-value="payloadText" type="textarea" :rows="10" readonly resize="none" />
        </div>
      </div>

      <div class="jwt-field">
        <p class="jwt-label">Signature</p>
        <el-input :model-value="signatureText" readonly />
      </div>

      <div class="jwt-actions">
        <el-button type="success" plain :disabled="!headerText" @click="copyText(headerText, 'Header 已复制。')">复制 Header</el-button>
        <el-button type="success" plain :disabled="!payloadText" @click="copyText(payloadText, 'Payload 已复制。')">复制 Payload</el-button>
        <el-button plain :disabled="!signatureText" @click="copyText(signatureText, 'Signature 已复制。')">复制 Signature</el-button>
        <el-button plain @click="clearAll">清空</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.jwt-page { display: flex; flex-direction: column; gap: 16px; }
.jwt-page__head { margin-bottom: 4px; }
.jwt-page__crumb { font-size: 13px; }
.jwt-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.jwt-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.jwt-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.jwt-field { display: flex; flex-direction: column; gap: 8px; }
.jwt-label { margin: 0; font-size: 13px; color: var(--uu-text); font-weight: 500; }
.jwt-error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.jwt-meta { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 10px; }
.jwt-meta__item { border: 1px dashed var(--el-border-color); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.jwt-meta__item span { font-size: 12px; color: var(--uu-text-secondary); }
.jwt-meta__item b { font-size: 13px; color: var(--uu-text); font-weight: 600; }
.jwt-split { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 12px; }
.jwt-pane { display: flex; flex-direction: column; gap: 8px; }
.jwt-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
</style>
