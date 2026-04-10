<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const plainText = ref('')
const cipherText = ref('')
const secretKey = ref('')
const ivText = ref('')
const working = ref(false)
const errorText = ref<string | null>(null)

function toSafeBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes)
}

function normalizeKey(raw: string): Uint8Array<ArrayBuffer> {
  const bytes = toSafeBytes(new TextEncoder().encode(raw.trim()))
  if (bytes.length === 16 || bytes.length === 24 || bytes.length === 32) return bytes
  throw new Error('密钥长度需为 16 / 24 / 32 字节（对应 AES-128/192/256）。')
}

function randomIvBytes(): Uint8Array<ArrayBuffer> {
  return toSafeBytes(crypto.getRandomValues(new Uint8Array(12)))
}

function base64Encode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64Decode(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return toSafeBytes(out)
}

function parseInputCipher(raw: string): { iv: Uint8Array<ArrayBuffer>; cipher: Uint8Array<ArrayBuffer> } {
  const text = raw.trim()
  const parts = text.split(':')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('密文格式错误，请使用“IVBase64:密文Base64”格式。')
  }
  const iv = base64Decode(parts[0])
  const cipher = base64Decode(parts[1])
  if (iv.length !== 12) throw new Error('IV 长度必须为 12 字节（Base64 解码后）。')
  return { iv, cipher }
}

async function importKey(rawKey: string): Promise<CryptoKey> {
  const keyBytes = normalizeKey(rawKey)
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function encryptText() {
  errorText.value = null
  if (!plainText.value.trim()) {
    errorText.value = '请输入要加密的明文。'
    return
  }
  if (!secretKey.value.trim()) {
    errorText.value = '请输入密钥。'
    return
  }

  working.value = true
  try {
    const key = await importKey(secretKey.value)
    const iv = randomIvBytes()
    const encoded = toSafeBytes(new TextEncoder().encode(plainText.value))
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
    const cipher = new Uint8Array(encrypted)

    ivText.value = base64Encode(iv)
    cipherText.value = `${ivText.value}:${base64Encode(cipher)}`
    ElMessage.success('加密完成。')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '加密失败，请检查输入。'
  } finally {
    working.value = false
  }
}

async function decryptText() {
  errorText.value = null
  if (!cipherText.value.trim()) {
    errorText.value = '请输入要解密的密文。'
    return
  }
  if (!secretKey.value.trim()) {
    errorText.value = '请输入密钥。'
    return
  }

  working.value = true
  try {
    const key = await importKey(secretKey.value)
    const { iv, cipher } = parseInputCipher(cipherText.value)
    ivText.value = base64Encode(iv)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    plainText.value = new TextDecoder().decode(decrypted)
    ElMessage.success('解密完成。')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '解密失败，请检查输入。'
  } finally {
    working.value = false
  }
}

async function copyCipher() {
  if (!cipherText.value) return
  await navigator.clipboard.writeText(cipherText.value)
  ElMessage.success('密文已复制。')
}

async function copyPlain() {
  if (!plainText.value) return
  await navigator.clipboard.writeText(plainText.value)
  ElMessage.success('明文已复制。')
}

function clearAll() {
  plainText.value = ''
  cipherText.value = ''
  ivText.value = ''
  errorText.value = null
}
</script>

<template>
  <div class="aes-page">
    <header class="aes-page__head">
      <el-breadcrumb class="aes-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-code' } }">编码工具</el-breadcrumb-item>
        <el-breadcrumb-item>AES 加解密</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="aes-page__intro-card">
        <p class="aes-page__intro-desc">使用浏览器本地 AES-GCM 加解密。密文格式：<b>IVBase64:CipherBase64</b>。</p>
      </div>
    </header>

    <section class="aes-panel">
      <div class="aes-row">
        <div class="aes-field">
          <span class="aes-label">密钥（16/24/32 字节）</span>
          <el-input v-model="secretKey" type="password" show-password placeholder="例如：1234567890abcdef" />
        </div>
        <div class="aes-field">
          <span class="aes-label">IV（Base64，解密时自动识别）</span>
          <el-input v-model="ivText" readonly placeholder="加密后自动生成" />
        </div>
      </div>

      <div class="aes-split">
        <div class="aes-pane">
          <p class="aes-label">明文</p>
          <el-input v-model="plainText" type="textarea" :rows="10" resize="none" placeholder="输入要加密的明文" />
        </div>
        <div class="aes-pane">
          <p class="aes-label">密文（IVBase64:CipherBase64）</p>
          <el-input v-model="cipherText" type="textarea" :rows="10" resize="none" placeholder="输入或粘贴密文" />
        </div>
      </div>

      <p v-if="errorText" class="aes-error">{{ errorText }}</p>

      <div class="aes-actions">
        <el-button type="primary" :loading="working" @click="encryptText">加密</el-button>
        <el-button type="warning" plain :loading="working" @click="decryptText">解密</el-button>
        <el-button type="success" plain :disabled="!cipherText" @click="copyCipher">复制密文</el-button>
        <el-button plain :disabled="!plainText" @click="copyPlain">复制明文</el-button>
        <el-button plain @click="clearAll">清空</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.aes-page { display: flex; flex-direction: column; gap: 16px; }
.aes-page__head { margin-bottom: 4px; }
.aes-page__crumb { font-size: 13px; }
.aes-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.aes-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.aes-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.aes-row { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 12px; }
.aes-field { display: flex; flex-direction: column; gap: 8px; }
.aes-label { margin: 0; font-size: 13px; color: var(--uu-text); font-weight: 500; }
.aes-split { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 12px; }
.aes-pane { display: flex; flex-direction: column; gap: 8px; }
.aes-error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.aes-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
</style>
