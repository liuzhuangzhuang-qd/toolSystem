<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type CodecMode = 'uri' | 'component'

const mode = ref<CodecMode>('uri')
const inputText = ref('')
const outputText = ref('')
const errorText = ref<string | null>(null)

const modeHint = computed(() =>
  mode.value === 'uri'
    ? 'URI 模式：保留 URL 结构字符（如 : / ? & =）'
    : '组件模式：对任意片段进行严格编码（适合 query 值）',
)

function runEncode() {
  errorText.value = null
  try {
    outputText.value =
      mode.value === 'uri' ? encodeURI(inputText.value) : encodeURIComponent(inputText.value)
  } catch (e) {
    outputText.value = ''
    errorText.value = e instanceof Error ? e.message : '编码失败。'
  }
}

function runDecode() {
  errorText.value = null
  try {
    outputText.value =
      mode.value === 'uri' ? decodeURI(inputText.value) : decodeURIComponent(inputText.value)
  } catch (e) {
    outputText.value = ''
    errorText.value = e instanceof Error ? `解码失败：${e.message}` : '解码失败。'
  }
}

function swapInputOutput() {
  const t = inputText.value
  inputText.value = outputText.value
  outputText.value = t
  errorText.value = null
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
  errorText.value = null
}

async function copyOutput() {
  if (!outputText.value) return
  await navigator.clipboard.writeText(outputText.value)
  ElMessage.success('结果已复制。')
}
</script>

<template>
  <div class="url-codec-page">
    <header class="url-codec-page__head">
      <el-breadcrumb class="url-codec-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-code' } }">编码工具</el-breadcrumb-item>
        <el-breadcrumb-item>URL 编解码</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="url-codec-page__intro-card">
        <p class="url-codec-page__intro-desc">支持 URI / 组件两种模式，适配整条 URL 与 query 参数值场景。</p>
      </div>
    </header>

    <section class="url-codec-panel">
      <div class="url-codec-top">
        <div class="url-codec-field">
          <p class="url-codec-label">编码模式</p>
          <el-radio-group v-model="mode">
            <el-radio-button label="uri">URI</el-radio-button>
            <el-radio-button label="component">组件</el-radio-button>
          </el-radio-group>
        </div>
        <p class="url-codec-hint">{{ modeHint }}</p>
      </div>

      <div class="url-codec-split">
        <div class="url-codec-pane">
          <p class="url-codec-label">输入</p>
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="10"
            resize="none"
            placeholder="输入待编码或解码的内容"
          />
        </div>
        <div class="url-codec-pane">
          <p class="url-codec-label">输出</p>
          <el-input
            :model-value="outputText"
            type="textarea"
            :rows="10"
            readonly
            resize="none"
            placeholder="结果输出区域"
          />
        </div>
      </div>

      <p v-if="errorText" class="url-codec-error">{{ errorText }}</p>

      <div class="url-codec-actions">
        <el-button type="primary" :disabled="!inputText" @click="runEncode">编码</el-button>
        <el-button type="warning" plain :disabled="!inputText" @click="runDecode">解码</el-button>
        <el-button plain :disabled="!outputText" @click="copyOutput">复制结果</el-button>
        <el-button plain @click="swapInputOutput">交换输入输出</el-button>
        <el-button plain @click="clearAll">清空</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.url-codec-page { display: flex; flex-direction: column; gap: 16px; }
.url-codec-page__head { margin-bottom: 4px; }
.url-codec-page__crumb { font-size: 13px; }
.url-codec-page__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.url-codec-page__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.url-codec-panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.url-codec-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.url-codec-field { display: flex; flex-direction: column; gap: 8px; }
.url-codec-label { margin: 0; font-size: 13px; color: var(--uu-text); font-weight: 500; }
.url-codec-hint { margin: 0; font-size: 12px; color: var(--uu-text-secondary); }
.url-codec-split { display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 12px; }
.url-codec-pane { display: flex; flex-direction: column; gap: 8px; }
.url-codec-error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.url-codec-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
</style>
