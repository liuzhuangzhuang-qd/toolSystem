<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'

type OutFmt = 'jpg' | 'png' | 'webp'
type Piece = { id: number; url: string; blob: Blob }

const fileInputRef = ref<HTMLInputElement | null>(null)
const sourceUrl = ref<string | null>(null)
const pieces = ref<Piece[]>([])
const slicing = ref(false)
const quality = ref(92)
const outputFormat = ref<OutFmt>('jpg')

const acceptMime = 'image/png,image/jpeg,image/webp,image/bmp'

function openFilePicker() {
  fileInputRef.value?.click()
}

function cleanupPieces() {
  pieces.value.forEach((p) => URL.revokeObjectURL(p.url))
  pieces.value = []
}

function cleanupSource() {
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
  sourceUrl.value = null
}

function resetAll() {
  cleanupPieces()
  cleanupSource()
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    sourceUrl.value = url
    return img
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

async function sliceNine(file: File) {
  if (slicing.value) return
  slicing.value = true
  try {
    cleanupPieces()
    cleanupSource()
    const img = await loadImageFromFile(file)

    const side = Math.min(img.width, img.height)
    const sx0 = Math.floor((img.width - side) / 2)
    const sy0 = Math.floor((img.height - side) / 2)
    const cell = Math.floor(side / 3)
    const size = cell * 3

    const newPieces: Piece[] = []
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const canvas = document.createElement('canvas')
        canvas.width = cell
        canvas.height = cell
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 不可用')
        const sx = sx0 + c * cell
        const sy = sy0 + r * cell
        ctx.drawImage(img, sx, sy, cell, cell, 0, 0, cell, cell)

        const mime =
          outputFormat.value === 'png'
            ? 'image/png'
            : outputFormat.value === 'webp'
              ? 'image/webp'
              : 'image/jpeg'
        const q = Math.max(0.1, Math.min(1, quality.value / 100))
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('切图导出失败'))),
            mime,
            outputFormat.value === 'png' ? undefined : q,
          )
        })
        newPieces.push({ id: r * 3 + c + 1, url: URL.createObjectURL(blob), blob })
      }
    }
    pieces.value = newPieces
    ElMessage.success(`已切分完成（有效裁剪区域 ${size}x${size}）。`)
  } catch (e) {
    console.error(e)
    ElMessage.error('切图失败，请更换图片后重试。')
  } finally {
    slicing.value = false
  }
}

function chooseFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件。')
    return
  }
  sliceNine(file)
}

function downloadOne(piece: Piece) {
  const ext = outputFormat.value === 'jpg' ? 'jpg' : outputFormat.value
  const a = document.createElement('a')
  a.href = piece.url
  a.download = `grid9-${piece.id}.${ext}`
  a.click()
}

function downloadAll() {
  if (!pieces.value.length) {
    ElMessage.info('请先完成切图。')
    return
  }
  pieces.value.forEach((p) => downloadOne(p))
}

onBeforeUnmount(() => {
  cleanupPieces()
  cleanupSource()
})
</script>

<template>
  <div class="img-grid9">
    <header class="img-grid9__head">
      <el-breadcrumb class="img-grid9__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-img' } }">图片工具</el-breadcrumb-item>
        <el-breadcrumb-item>九宫格切图</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="img-grid9__intro-card">
        <p class="img-grid9__intro-desc">上传单张图片后自动居中裁剪为正方形，并切成 3x3 共 9 张。</p>
      </div>
    </header>

    <section class="img-grid9__panel">
      <div class="img-grid9__toolbar">
        <div class="img-grid9__toolbar-group">
          <span class="img-grid9__label">输出格式</span>
          <el-radio-group v-model="outputFormat">
            <el-radio-button label="jpg">JPG</el-radio-button>
            <el-radio-button label="png">PNG</el-radio-button>
            <el-radio-button label="webp">WEBP</el-radio-button>
          </el-radio-group>
        </div>
        <div class="img-grid9__toolbar-group">
          <span class="img-grid9__label">质量</span>
          <div class="img-grid9__quality">
            <el-slider v-model="quality" :min="30" :max="100" :step="1" :disabled="outputFormat === 'png'" />
            <span class="img-grid9__quality-value">{{ outputFormat === 'png' ? '-' : `${quality}%` }}</span>
          </div>
        </div>
      </div>

      <div class="img-grid9__split">
        <div class="img-grid9__pane">
          <p class="img-grid9__pane-title">源图</p>
          <label class="img-grid9__upload">
            <input
              ref="fileInputRef"
              type="file"
              class="img-grid9__file-input"
              :accept="acceptMime"
              @change="chooseFile"
            />
            <div v-if="sourceUrl" class="img-grid9__preview">
              <img :src="sourceUrl" alt="" />
            </div>
            <div v-else class="img-grid9__empty">点击上传图片</div>
          </label>
        </div>

        <div class="img-grid9__pane">
          <p class="img-grid9__pane-title">九宫格预览</p>
          <div class="img-grid9__grid">
            <button
              v-for="i in 9"
              :key="i"
              class="img-grid9__cell"
              :disabled="!pieces[i - 1]"
              @click="pieces[i - 1] && downloadOne(pieces[i - 1])"
            >
              <img v-if="pieces[i - 1]" :src="pieces[i - 1].url" alt="" />
              <span v-else>{{ i }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="img-grid9__actions">
        <el-button type="primary" plain @click="openFilePicker">重新选择</el-button>
        <el-button type="danger" plain @click="resetAll">清空</el-button>
        <el-button type="success" plain :disabled="!pieces.length" @click="downloadAll">下载全部</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.img-grid9 { display: flex; flex-direction: column; gap: 16px; }
.img-grid9__head { margin-bottom: 4px; }
.img-grid9__crumb { font-size: 13px; }
.img-grid9__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.img-grid9__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.img-grid9__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.img-grid9__toolbar { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
.img-grid9__toolbar-group { display: flex; flex-direction: column; gap: 8px; min-width: 260px; }
.img-grid9__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.img-grid9__quality { display: flex; align-items: center; gap: 10px; }
.img-grid9__quality-value { width: 60px; text-align: right; font-size: 12px; color: var(--uu-text-secondary); }
.img-grid9__split { display: flex; gap: 14px; }
.img-grid9__pane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.img-grid9__pane-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.img-grid9__upload { display: block; cursor: pointer; }
.img-grid9__file-input { display: none; }
.img-grid9__preview, .img-grid9__empty { height: 320px; border-radius: 12px; border: 1px dashed rgba(148, 163, 184, 0.8); background: #fafafa; display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--uu-text-secondary); font-size: 13px; }
.img-grid9__preview img { max-width: 100%; max-height: 100%; display: block; }
.img-grid9__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.img-grid9__cell { aspect-ratio: 1 / 1; border-radius: 10px; border: 1px solid var(--el-border-color-lighter); background: #f8fafc; overflow: hidden; display: flex; align-items: center; justify-content: center; color: var(--uu-text-secondary); cursor: pointer; }
.img-grid9__cell:disabled { cursor: default; }
.img-grid9__cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-grid9__actions { display: flex; gap: 10px; justify-content: flex-end; }
</style>
