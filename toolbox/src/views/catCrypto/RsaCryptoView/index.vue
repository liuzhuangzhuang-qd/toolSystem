<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const plainText = ref('')
const cipherText = ref('')
const publicKeyPem = ref('')
const privateKeyPem = ref('')
const keyBits = ref<2048 | 3072 | 4096>(2048)
const working = ref(false)
const errorText = ref<string | null>(null)

function ab2b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function b642ab(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  if (!body) throw new Error('密钥 PEM 内容为空。')
  return b642ab(body)
}

function formatPem(base64: string, type: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  const lines = base64.match(/.{1,64}/g)?.join('\n') ?? base64
  return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`
}

async function generateKeys() {
  working.value = true
  errorText.value = null
  try {
    const pair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: keyBits.value,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    )
    const pub = await crypto.subtle.exportKey('spki', pair.publicKey)
    const pri = await crypto.subtle.exportKey('pkcs8', pair.privateKey)
    publicKeyPem.value = formatPem(ab2b64(pub), 'PUBLIC KEY')
    privateKeyPem.value = formatPem(ab2b64(pri), 'PRIVATE KEY')
    ElMessage.success('RSA 密钥已生成。')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '生成密钥失败。'
  } finally {
    working.value = false
  }
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  )
}

async function encryptText() {
  errorText.value = null
  if (!plainText.value) {
    errorText.value = '请输入明文。'
    return
  }
  if (!publicKeyPem.value.trim()) {
    errorText.value = '请输入公钥。'
    return
  }

  working.value = true
  try {
    const key = await importPublicKey(publicKeyPem.value)
    const data = new TextEncoder().encode(plainText.value)
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data)
    cipherText.value = ab2b64(encrypted)
    ElMessage.success('加密完成。')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '加密失败。'
  } finally {
    working.value = false
  }
}

async function decryptText() {
  errorText.value = null
  if (!cipherText.value.trim()) {
    errorText.value = '请输入密文（Base64）。'
    return
  }
  if (!privateKeyPem.value.trim()) {
    errorText.value = '请输入私钥。'
    return
  }

  working.value = true
  try {
    const key = await importPrivateKey(privateKeyPem.value)
    const encrypted = b642ab(cipherText.value.trim())
    const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, encrypted)
    plainText.value = new TextDecoder().decode(decrypted)
    ElMessage.success('解密完成。')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '解密失败。'
  } finally {
    working.value = false
  }
}

async function copyText(text: string, msg: string) {
  if (!text) return
  await navigator.clipboard.writeText(text)
  ElMessage.success(msg)
}

function clearAll() {
  plainText.value = ''
  cipherText.value = ''
  errorText.value = null
}
</script>

<template>
  <div class="rsa-page">
    <header class="rsa-page__head">
      <el-breadcrumb class="rsa-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-code' } }">编码工具</el-breadcrumb-item>
        <el-breadcrumb-item>RSA 加解密</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="rsa-page__intro-card">
        <p class="rsa-page__intro-desc">基于 RSA-OAEP + SHA-256（浏览器本地）。支持生成 PEM 公私钥并进行加解密。</p>
      </div>
    </header>

    <section class="rsa-panel">
      <div class="rsa-top">
        <div class="rsa-field">
          <span class="rsa-label">密钥长度</span>
          <el-radio-group v-model="keyBits">
            <el-radio-button :label="2048">2048</el-radio-button>
            <el-radio-button :label="3072">3072</el-radio-button>
            <el-radio-button :label="4096">4096</el-radio-button>
          </el-radio-group>
        </div>
        <el-button type="primary" :loading="working" @click="generateKeys">生成公私钥</el-button>
      </div>

      <div class="rsa-split">
        <div class="rsa-pane">
          <p class="rsa-label">公钥（PEM）</p>
          <el-input v-model="publicKeyPem" type="textarea" :rows="8" resize="none" placeholder="-----BEGIN PUBLIC KEY-----" />
        </div>
        <div class="rsa-pane">
          <p class="rsa-label">私钥（PEM）</p>
          <el-input v-model="privateKeyPem" type="textarea" :rows="8" resize="none" placeholder="-----BEGIN PRIVATE KEY-----" />
        </div>
      </div>

      <div class="rsa-split">
        <div class="rsa-pane">
          <p class="rsa-label">明文</p>
          <el-input v-model="plainText" type="textarea" :rows="8" resize="none" placeholder="输入明文" />
        </div>
        <div class="rsa-pane">
          <p class="rsa-label">密文（Base64）</p>
          <el-input v-model="cipherText" type="textarea" :rows="8" resize="none" placeholder="输入或输出 Base64 密文" />
        </div>
      </div>

      <p v-if="errorText" class="rsa-error">{{ errorText }}</p>

      <div class="rsa-actions">
        <el-button type="primary" :loading="working" @click="encryptText">公钥加密</el-button>
        <el-button type="warning" plain :loading="working" @click="decryptText">私钥解密</el-button>
        <el-button type="success" plain :disabled="!cipherText" @click="copyText(cipherText, '密文已复制。')">复制密文</el-button>
        <el-button plain :disabled="!plainText" @click="copyText(plainText, '明文已复制。')">复制明文</el-button>
        <el-button plain :disabled="!publicKeyPem" @click="copyText(publicKeyPem, '公钥已复制。')">复制公钥</el-button>
        <el-button plain :disabled="!privateKeyPem" @click="copyText(privateKeyPem, '私钥已复制。')">复制私钥</el-button>
        <el-button plain @click="clearAll">清空明文/密文</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rsa-page { display: flex; flex-direction: column; gap: 16px; }
.rsa-page__head { margin-bottom: 4px; }
.rsa-page__crumb { font-size: 13px; }
.rsa-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.rsa-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.rsa-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.rsa-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.rsa-field { display: flex; flex-direction: column; gap: 8px; }
.rsa-label { margin: 0; font-size: 13px; color: var(--uu-text); font-weight: 500; }
.rsa-split { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 12px; }
.rsa-pane { display: flex; flex-direction: column; gap: 8px; }
.rsa-error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.rsa-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
</style>
