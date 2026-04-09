<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'

type DesMode = 'CBC' | 'ECB'

const plainText = ref('')
const cipherText = ref('')
const secretKey = ref('')
const ivText = ref('')
const mode = ref<DesMode>('CBC')
const errorText = ref<string | null>(null)

const needIv = computed(() => mode.value === 'CBC')

function keyWordArray(): CryptoJS.lib.WordArray {
  const key = secretKey.value
  if (!key) throw new Error('请输入密钥。')
  const keyBytes = new TextEncoder().encode(key)
  if (keyBytes.length !== 8) {
    throw new Error('DES 密钥长度必须为 8 字节。')
  }
  return CryptoJS.enc.Utf8.parse(key)
}

function ivWordArray(): CryptoJS.lib.WordArray | undefined {
  if (!needIv.value) return undefined
  const iv = ivText.value
  if (!iv) throw new Error('CBC 模式下请输入 IV。')
  const ivBytes = new TextEncoder().encode(iv)
  if (ivBytes.length !== 8) {
    throw new Error('DES IV 长度必须为 8 字节。')
  }
  return CryptoJS.enc.Utf8.parse(iv)
}

function desModeAlgo(): typeof CryptoJS.mode.CBC | typeof CryptoJS.mode.ECB {
  return mode.value === 'CBC' ? CryptoJS.mode.CBC : CryptoJS.mode.ECB
}

function encryptText() {
  errorText.value = null
  try {
    if (!plainText.value) throw new Error('请输入要加密的明文。')
    const key = keyWordArray()
    const iv = ivWordArray()
    const encrypted = CryptoJS.DES.encrypt(plainText.value, key, {
      mode: desModeAlgo(),
      padding: CryptoJS.pad.Pkcs7,
      ...(iv ? { iv } : {}),
    })
    cipherText.value = encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    ElMessage.success('加密完成。')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '加密失败，请检查输入。'
  }
}

function decryptText() {
  errorText.value = null
  try {
    if (!cipherText.value.trim()) throw new Error('请输入要解密的密文。')
    const key = keyWordArray()
    const iv = ivWordArray()
    const decrypted = CryptoJS.DES.decrypt(
      {
        ciphertext: CryptoJS.enc.Base64.parse(cipherText.value.trim()),
      } as CryptoJS.lib.CipherParams,
      key,
      {
        mode: desModeAlgo(),
        padding: CryptoJS.pad.Pkcs7,
        ...(iv ? { iv } : {}),
      },
    )
    const text = decrypted.toString(CryptoJS.enc.Utf8)
    if (!text) throw new Error('解密失败：密钥/IV/模式不匹配，或密文无效。')
    plainText.value = text
    ElMessage.success('解密完成。')
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : '解密失败，请检查输入。'
  }
}

async function copyText(value: string, okMsg: string) {
  if (!value) return
  await navigator.clipboard.writeText(value)
  ElMessage.success(okMsg)
}

function clearAll() {
  plainText.value = ''
  cipherText.value = ''
  errorText.value = null
}
</script>

<template>
  <div class="des-page">
    <header class="des-page__head">
      <el-breadcrumb class="des-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-code' } }">编码工具</el-breadcrumb-item>
        <el-breadcrumb-item>DES 加解密</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="des-page__intro-card">
        <p class="des-page__intro-desc">支持 DES-CBC / DES-ECB + PKCS7。密钥需 8 字节，CBC 模式下 IV 也需 8 字节。</p>
      </div>
    </header>

    <section class="des-panel">
      <div class="des-options">
        <div class="des-field">
          <span class="des-label">模式</span>
          <el-radio-group v-model="mode">
            <el-radio-button label="CBC">CBC</el-radio-button>
            <el-radio-button label="ECB">ECB</el-radio-button>
          </el-radio-group>
        </div>
        <div class="des-field">
          <span class="des-label">密钥（8 字节）</span>
          <el-input v-model="secretKey" type="password" show-password placeholder="例如：12345678" />
        </div>
        <div class="des-field">
          <span class="des-label">IV（8 字节，CBC 模式）</span>
          <el-input v-model="ivText" :disabled="!needIv" placeholder="例如：abcdefgh" />
        </div>
      </div>

      <div class="des-split">
        <div class="des-pane">
          <p class="des-label">明文</p>
          <el-input v-model="plainText" type="textarea" :rows="10" resize="none" placeholder="输入明文" />
        </div>
        <div class="des-pane">
          <p class="des-label">密文（Base64）</p>
          <el-input v-model="cipherText" type="textarea" :rows="10" resize="none" placeholder="输入或输出 Base64 密文" />
        </div>
      </div>

      <p v-if="errorText" class="des-error">{{ errorText }}</p>

      <div class="des-actions">
        <el-button type="primary" @click="encryptText">加密</el-button>
        <el-button type="warning" plain @click="decryptText">解密</el-button>
        <el-button type="success" plain :disabled="!cipherText" @click="copyText(cipherText, '密文已复制。')">复制密文</el-button>
        <el-button plain :disabled="!plainText" @click="copyText(plainText, '明文已复制。')">复制明文</el-button>
        <el-button plain @click="clearAll">清空</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.des-page { display: flex; flex-direction: column; gap: 16px; }
.des-page__head { margin-bottom: 4px; }
.des-page__crumb { font-size: 13px; }
.des-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.des-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.des-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.des-options { display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 12px; }
.des-field { display: flex; flex-direction: column; gap: 8px; }
.des-label { margin: 0; font-size: 13px; color: var(--uu-text); font-weight: 500; }
.des-split { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 12px; }
.des-pane { display: flex; flex-direction: column; gap: 8px; }
.des-error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.des-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
</style>
