<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'

const textInput = ref('')
const fileName = ref('')
const fileMd5 = ref('')
const fileLoading = ref(false)

const md5Lower32 = computed(() => CryptoJS.MD5(textInput.value).toString(CryptoJS.enc.Hex))
const md5Upper32 = computed(() => md5Lower32.value.toUpperCase())
const md5Lower16 = computed(() => md5Lower32.value.slice(8, 24))
const md5Upper16 = computed(() => md5Lower16.value.toUpperCase())

function fileToWordArray(file: File): Promise<CryptoJS.lib.WordArray> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const result = reader.result
        if (!(result instanceof ArrayBuffer)) throw new Error('文件读取失败。')
        const bytes = new Uint8Array(result)
        const words: number[] = []
        for (let i = 0; i < bytes.length; i += 1) {
          words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8)
        }
        resolve(CryptoJS.lib.WordArray.create(words, bytes.length))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败。'))
    reader.readAsArrayBuffer(file)
  })
}

async function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  fileLoading.value = true
  fileName.value = file.name
  fileMd5.value = ''
  try {
    const wa = await fileToWordArray(file)
    fileMd5.value = CryptoJS.MD5(wa).toString(CryptoJS.enc.Hex)
    ElMessage.success('文件 MD5 计算完成。')
  } catch (err) {
    fileName.value = ''
    fileMd5.value = ''
    ElMessage.error(err instanceof Error ? err.message : '文件 MD5 计算失败。')
  } finally {
    fileLoading.value = false
  }
}

async function copyText(value: string, label: string) {
  if (!value) return
  await navigator.clipboard.writeText(value)
  ElMessage.success(`${label} 已复制。`)
}

function clearText() {
  textInput.value = ''
}
</script>

<template>
  <div class="md5-page">
    <header class="md5-page__head">
      <el-breadcrumb class="md5-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-code' } }">编码工具</el-breadcrumb-item>
        <el-breadcrumb-item>MD5 计算</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="md5-page__intro-card">
        <p class="md5-page__intro-desc">支持文本和文件 MD5（本地计算，不上传）。可复制 16/32 位大小写结果。</p>
      </div>
    </header>

    <section class="md5-panel">
      <div class="md5-field">
        <p class="md5-label">输入文本</p>
        <el-input
          v-model="textInput"
          type="textarea"
          :rows="7"
          resize="none"
          placeholder="请输入需要计算 MD5 的文本内容"
        />
      </div>

      <div class="md5-result-grid">
        <div class="md5-item">
          <span class="md5-item__label">32位小写</span>
          <el-input :model-value="md5Lower32" readonly>
            <template #append>
              <el-button @click="copyText(md5Lower32, '32位小写')">复制</el-button>
            </template>
          </el-input>
        </div>
        <div class="md5-item">
          <span class="md5-item__label">32位大写</span>
          <el-input :model-value="md5Upper32" readonly>
            <template #append>
              <el-button @click="copyText(md5Upper32, '32位大写')">复制</el-button>
            </template>
          </el-input>
        </div>
        <div class="md5-item">
          <span class="md5-item__label">16位小写</span>
          <el-input :model-value="md5Lower16" readonly>
            <template #append>
              <el-button @click="copyText(md5Lower16, '16位小写')">复制</el-button>
            </template>
          </el-input>
        </div>
        <div class="md5-item">
          <span class="md5-item__label">16位大写</span>
          <el-input :model-value="md5Upper16" readonly>
            <template #append>
              <el-button @click="copyText(md5Upper16, '16位大写')">复制</el-button>
            </template>
          </el-input>
        </div>
      </div>

      <div class="md5-actions">
        <el-button plain @click="clearText">清空文本</el-button>
      </div>
    </section>

    <section class="md5-panel">
      <div class="md5-file-head">
        <p class="md5-label">文件 MD5</p>
        <label class="md5-upload-btn">
          <input type="file" class="md5-upload-input" @change="onPickFile" />
          <el-button type="primary" plain :loading="fileLoading">选择文件计算</el-button>
        </label>
      </div>
      <p v-if="fileName" class="md5-file-name">当前文件：{{ fileName }}</p>
      <el-input :model-value="fileMd5" readonly placeholder="选择文件后显示 MD5">
        <template #append>
          <el-button :disabled="!fileMd5" @click="copyText(fileMd5, '文件MD5')">复制</el-button>
        </template>
      </el-input>
    </section>
  </div>
</template>

<style scoped>
.md5-page { display: flex; flex-direction: column; gap: 16px; }
.md5-page__head { margin-bottom: 4px; }
.md5-page__crumb { font-size: 13px; }
.md5-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.md5-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.md5-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.md5-field { display: flex; flex-direction: column; gap: 8px; }
.md5-label { margin: 0; font-size: 13px; color: var(--uu-text); font-weight: 500; }
.md5-result-grid { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 12px; }
.md5-item { display: flex; flex-direction: column; gap: 8px; }
.md5-item__label { font-size: 12px; color: var(--uu-text-secondary); }
.md5-actions { display: flex; justify-content: flex-end; }
.md5-file-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
.md5-upload-btn { display: inline-flex; }
.md5-upload-input { display: none; }
.md5-file-name { margin: 0; font-size: 12px; color: var(--uu-text-secondary); }
</style>
