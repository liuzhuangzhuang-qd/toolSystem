<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'

type OutputFormat = 'png' | 'jpg' | 'webp'

const acceptMime = 'image/png,image/jpeg,image/webp,image/bmp,image/gif'
const fileInputRef = ref<HTMLInputElement | null>(null)

const sourceFile = ref<File | null>(null)
const sourceUrl = ref<string | null>(null)
const pixelUrl = ref<string | null>(null)
const working = ref(false)
const dragging = ref(false)
const renderTaskId = ref(0)

const blockSize = ref(18)
const outputFormat = ref<OutputFormat>('png')

const hasSource = computed(() => !!sourceFile.value && !!sourceUrl.value)
const hasResult = computed(() => !!pixelUrl.value)

function revokeSource() {
  if (sourceUrl.value) {
    URL.revokeObjectURL(sourceUrl.value)
    sourceUrl.value = null
  }
  sourceFile.value = null
}

function revokeResult() {
  if (pixelUrl.value) {
    URL.revokeObjectURL(pixelUrl.value)
    pixelUrl.value = null
  }
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function chooseFile(e: Event) {
  const input = e.target as HTMLInputElement
  void handleFiles(input.files)
  input.value = ''
}

async function handleFiles(list: FileList | null) {
  if (!list?.length) return
  const f = list[0]
  if (!f.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件。')
    return
  }

  // Invalidate any ongoing render task to avoid stale result overwrite.
  renderTaskId.value += 1
  working.value = false
  revokeSource()
  revokeResult()
  sourceFile.value = f
  sourceUrl.value = URL.createObjectURL(f)
  await makePixel()
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  void handleFiles(e.dataTransfer?.files ?? null)
}
function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (!dragging.value) dragging.value = true
}
function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function mimeForFormat(fmt: OutputFormat): string {
  if (fmt === 'png') return 'image/png'
  if (fmt === 'webp') return 'image/webp'
  return 'image/jpeg'
}

async function makePixel() {
  if (!sourceUrl.value) return
  const taskId = ++renderTaskId.value
  const source = sourceUrl.value
  working.value = true
  try {
    const img = await loadImage(source)
    const w = Math.max(1, img.naturalWidth || img.width)
    const h = Math.max(1, img.naturalHeight || img.height)
    const bs = Math.max(2, Math.floor(blockSize.value || 2))

    const smallW = Math.max(1, Math.floor(w / bs))
    const smallH = Math.max(1, Math.floor(h / bs))

    const tmp = document.createElement('canvas')
    tmp.width = smallW
    tmp.height = smallH
    const tctx = tmp.getContext('2d')
    if (!tctx) throw new Error('Canvas 不可用')
    tctx.imageSmoothingEnabled = false
    tctx.drawImage(img, 0, 0, smallW, smallH)

    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    const octx = out.getContext('2d')
    if (!octx) throw new Error('Canvas 不可用')
    octx.imageSmoothingEnabled = false
    octx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, w, h)

    const mime = mimeForFormat(outputFormat.value)
    const blob = await new Promise<Blob>((resolve, reject) => {
      out.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('导出失败'))),
        mime,
        outputFormat.value === 'png' ? undefined : 0.92,
      )
    })

    if (taskId !== renderTaskId.value) return
    revokeResult()
    pixelUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    if (taskId !== renderTaskId.value) return
    console.error(e)
    ElMessage.error('像素画转换失败，请重试。')
  } finally {
    if (taskId === renderTaskId.value) working.value = false
  }
}

function downloadResult() {
  if (!pixelUrl.value || !sourceFile.value) return
  const ext = outputFormat.value === 'jpg' ? 'jpg' : outputFormat.value
  const base = sourceFile.value.name.replace(/\.[^.]+$/, '')
  const a = document.createElement('a')
  a.href = pixelUrl.value
  a.download = `${base}-pixel-${Math.floor(blockSize.value)}.${ext}`
  a.click()
}

onBeforeUnmount(() => {
  revokeSource()
  revokeResult()
})
</script>

<template>
  <div class="img-pixel">
    <header class="img-pixel__head">
      <el-breadcrumb class="img-pixel__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-img' } }">图片工具</el-breadcrumb-item>
        <el-breadcrumb-item>像素画转换</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="img-pixel__intro-card">
        <p class="img-pixel__intro-desc">上传图片后按像素块大小转换为像素风格，全部本地处理，不上传服务器。</p>
      </div>
    </header>

    <section class="img-pixel__panel">
      <input ref="fileInputRef" type="file" class="img-pixel__file-input" :accept="acceptMime" @change="chooseFile" />

      <div class="img-pixel__toolbar">
        <div class="img-pixel__toolbar-group">
          <span class="img-pixel__label">像素块大小</span>
          <el-slider
            v-model="blockSize"
            :min="2"
            :max="80"
            :step="1"
            show-input
            :show-input-controls="false"
            @change="makePixel"
          />
        </div>
        <div class="img-pixel__toolbar-group">
          <span class="img-pixel__label">输出格式</span>
          <el-radio-group v-model="outputFormat" @change="makePixel">
            <el-radio-button label="png">PNG</el-radio-button>
            <el-radio-button label="jpg">JPG</el-radio-button>
            <el-radio-button label="webp">WEBP</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <label
        v-if="!hasSource"
        class="img-pixel__upload"
        :class="{ 'img-pixel__upload--drag': dragging }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div class="img-pixel__upload-inner">
          <el-button type="primary" plain @click.stop="openFilePicker">选择图片</el-button>
          <p class="img-pixel__upload-sub">支持拖拽上传，建议使用清晰图片。</p>
        </div>
      </label>

      <div v-else class="img-pixel__preview">
        <div class="img-pixel__pane">
          <p class="img-pixel__title">原图</p>
          <div class="img-pixel__box">
            <img :src="sourceUrl ?? ''" alt="原图" />
          </div>
        </div>
        <div class="img-pixel__pane">
          <p class="img-pixel__title">像素画</p>
          <div class="img-pixel__box">
            <img v-if="hasResult" :src="pixelUrl ?? ''" alt="像素画结果" />
            <div v-else class="img-pixel__empty">处理中...</div>
          </div>
        </div>
      </div>

      <div class="img-pixel__actions">
        <el-button type="primary" plain @click="openFilePicker">重新选择</el-button>
        <el-button type="primary" :loading="working" :disabled="!hasSource" @click="makePixel">重新生成</el-button>
        <el-button type="success" plain :disabled="!hasResult" @click="downloadResult">下载结果</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.img-pixel { display: flex; flex-direction: column; gap: 16px; }
.img-pixel__head { margin-bottom: 4px; }
.img-pixel__crumb { font-size: 13px; }
.img-pixel__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.img-pixel__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.img-pixel__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.img-pixel__toolbar { display: flex; flex-wrap: wrap; gap: 18px; }
.img-pixel__toolbar-group { min-width: 260px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.img-pixel__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.img-pixel__file-input { display: none; }
.img-pixel__upload { min-height: 300px; border-radius: 12px; border: 1px dashed rgba(148, 163, 184, 0.8); background: #fafafa; display: block; cursor: pointer; }
.img-pixel__upload--drag { border-color: var(--el-color-primary); background: rgba(79, 70, 229, 0.05); }
.img-pixel__upload-inner { min-height: 300px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; }
.img-pixel__upload-sub { margin: 0; font-size: 13px; color: var(--uu-text-secondary); }
.img-pixel__preview { display: flex; gap: 14px; }
.img-pixel__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.img-pixel__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.img-pixel__box { height: 360px; border-radius: 12px; border: 1px solid var(--el-border-color-lighter); background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: auto; }
.img-pixel__box img { max-width: 100%; max-height: 100%; display: block; image-rendering: pixelated; }
.img-pixel__empty { color: var(--uu-text-secondary); font-size: 13px; }
.img-pixel__actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
</style>
