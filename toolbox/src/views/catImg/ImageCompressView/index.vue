<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'

type OutputFormat = 'jpg' | 'webp' | 'png'

type MaxSide = 0 | 1024 | 2048 | 4096 | 5120

type CompressItem = {
  id: string
  file: File
  previewUrl: string
  compressedUrl?: string
  compressedBytes?: number
  compressedFormat?: OutputFormat
}

const acceptMime = 'image/png,image/jpeg,image/webp,image/bmp,image/gif'

const dragging = ref(false)
const convertLoading = ref(false)

const items = ref<CompressItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const activeCompressId = ref<string | null>(null)

const outputFormat = ref<OutputFormat>('webp')
const quality = ref<number>(80)
const maxSide = ref<MaxSide>(2048)

const hasItems = computed(() => items.value.length > 0)

const activeItem = computed(() => {
  if (!activeCompressId.value) return null
  return items.value.find((it) => it.id === activeCompressId.value) ?? null
})

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function bytesToKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

function baseNameWithoutExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

function buildOutputName(srcName: string, fmt: OutputFormat): string {
  return `${baseNameWithoutExt(srcName)}.${fmt}`
}

function handleFiles(list: FileList | null) {
  if (!list || !list.length) return
  const next: CompressItem[] = []

  for (const f of Array.from(list)) {
    if (!f.type.startsWith('image/')) continue
    next.push({
      id: createId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
    })
  }

  if (!next.length) {
    ElMessage.warning('未检测到可用的图片文件。')
    return
  }

  // 覆盖旧列表时清理旧对象 URL
  items.value.forEach((it) => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl)
  })
  items.value = next
  activeCompressId.value = next[0]?.id ?? null
}

function chooseFiles(e: Event) {
  const input = e.target as HTMLInputElement
  handleFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  handleFiles(e.dataTransfer?.files ?? null)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (!dragging.value) dragging.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
}

function clearAll() {
  items.value.forEach((it) => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl)
  })
  items.value = []
  activeCompressId.value = null
}

function selectItem(id: string) {
  activeCompressId.value = id
}

function downloadActive() {
  if (!activeItem.value) return
  downloadOne(activeItem.value)
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const imgUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = imgUrl
    })
    return img
  } finally {
    URL.revokeObjectURL(imgUrl)
  }
}

function computeResize(w: number, h: number): { w: number; h: number } {
  if (!maxSide.value) return { w, h }
  const maxDim = maxSide.value
  const ratio = Math.min(1, maxDim / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * ratio)), h: Math.max(1, Math.round(h * ratio)) }
}

async function compressOne(file: File, fmt: OutputFormat): Promise<Blob> {
  const img = await loadImage(file)
  const { w, h } = computeResize(img.width, img.height)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.drawImage(img, 0, 0, w, h)

  const mime =
    fmt === 'png' ? 'image/png' : fmt === 'webp' ? 'image/webp' : 'image/jpeg'

  const out = await new Promise<Blob>((resolve, reject) => {
    const q = Math.max(0.05, Math.min(1, quality.value / 100))
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error('浏览器不支持当前格式导出'))
        else resolve(b)
      },
      mime,
      fmt === 'png' ? undefined : q,
    )
  })
  return out
}

async function startCompress() {
  if (!hasItems.value || convertLoading.value) return
  convertLoading.value = true
  try {
    const fmt = outputFormat.value

    for (const it of items.value) {
      if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl)
      it.compressedUrl = undefined
      it.compressedBytes = undefined
      it.compressedFormat = undefined

      const blob = await compressOne(it.file, fmt)
      it.compressedUrl = URL.createObjectURL(blob)
      it.compressedBytes = blob.size
      it.compressedFormat = fmt
    }

    ElMessage.success('压缩完成，可以逐个下载或批量下载。')
  } catch (e) {
    console.error(e)
    ElMessage.error('压缩失败，请尝试更换格式或降低质量/尺寸。')
  } finally {
    convertLoading.value = false
  }
}

function downloadOne(it: CompressItem) {
  if (!it.compressedUrl || !it.compressedBytes) return
  const a = document.createElement('a')
  a.href = it.compressedUrl
  a.download = buildOutputName(it.file.name, it.compressedFormat ?? outputFormat.value)
  a.click()
}

function downloadAll() {
  const ok = items.value.filter((it) => it.compressedUrl)
  if (!ok.length) {
    ElMessage.info('请先点击“开始压缩”。')
    return
  }
  ok.forEach((it) => downloadOne(it))
}

function openFilePicker() {
  fileInputRef.value?.click()
}

onBeforeUnmount(() => {
  items.value.forEach((it) => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.compressedUrl) URL.revokeObjectURL(it.compressedUrl)
  })
})
</script>

<template>
  <div class="img-compress">
    <header class="img-compress__head">
      <el-breadcrumb class="img-compress__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-img' } }">
          图片工具
        </el-breadcrumb-item>
        <el-breadcrumb-item>图片压缩</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="img-compress__intro-card">
        <p class="img-compress__intro-desc">
          上传图片后在浏览器本地完成压缩重编码（JPG/WebP 可控质量；PNG 可能不显著变小）。
        </p>
      </div>
    </header>

    <section class="img-compress__panel">
      <div class="img-compress__toolbar">
        <div class="img-compress__toolbar-group">
          <span class="img-compress__label">输出格式</span>
          <el-radio-group v-model="outputFormat" :disabled="convertLoading || !hasItems">
            <el-radio-button label="jpg">JPG</el-radio-button>
            <el-radio-button label="webp">WEBP</el-radio-button>
            <el-radio-button label="png">PNG</el-radio-button>
          </el-radio-group>
        </div>

        <div class="img-compress__toolbar-group">
          <span class="img-compress__label">质量</span>
          <div class="img-compress__qualityRow">
            <el-slider
              v-model="quality"
              :min="10"
              :max="100"
              :step="1"
              :disabled="convertLoading || !hasItems || outputFormat === 'png'"
            />
            <span class="img-compress__quality-value">
              {{ outputFormat === 'png' ? '-' : `${quality}%` }}
            </span>
          </div>
        </div>

        <div class="img-compress__toolbar-group">
          <span class="img-compress__label">最大边长</span>
          <el-select
            v-model="maxSide"
            :disabled="convertLoading || !hasItems"
            style="width: 150px"
            :teleported="false"
          >
            <el-option :value="0" label="不缩放" />
            <el-option :value="1024" label="1024" />
            <el-option :value="2048" label="2048" />
            <el-option :value="4096" label="4096" />
            <el-option :value="5120" label="5120" />
          </el-select>
        </div>
      </div>

      <div class="img-compress__split">
        <div class="img-compress__pane img-compress__pane--left">
          <p class="img-compress__pane-title">待压缩图片</p>

          <label
            class="img-compress__uploadBig"
            :class="{ 'img-compress__uploadBig--drag': dragging }"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="img-compress__file-input"
              :accept="acceptMime"
              multiple
              @change="chooseFiles"
            />

            <div v-if="!activeItem" class="img-compress__uploadBig-inner">
              <el-button type="primary" plain @click="openFilePicker">上传图片</el-button>
              <p class="img-compress__uploadBig-sub">支持拖拽或点击上传（可批量）</p>
            </div>

            <div v-else class="img-compress__previewLarge">
              <img :src="activeItem.previewUrl" alt="" />
            </div>
          </label>

          <div v-if="activeItem" class="img-compress__left-meta">
            <p class="img-compress__name" :title="activeItem.file.name">
              {{ activeItem.file.name }}
            </p>
            <p class="img-compress__meta">
              原始：{{ bytesToKB(activeItem.file.size) }}
              <span v-if="activeItem.compressedBytes">
                · 压缩后：{{ bytesToKB(activeItem.compressedBytes) }}
              </span>
            </p>
          </div>

          <div v-if="items.length > 1" class="img-compress__thumb-strip">
            <button
              v-for="it in items"
              :key="it.id"
              class="img-compress__thumb-chip"
              :class="{ 'img-compress__thumb-chip--active': it.id === activeCompressId }"
              @click="selectItem(it.id)"
            >
              <img :src="it.previewUrl" alt="" />
            </button>
          </div>
        </div>

        <div class="img-compress__pane img-compress__pane--right">
          <p class="img-compress__pane-title">压缩后图片</p>

          <div v-if="activeItem?.compressedUrl" class="img-compress__previewBox">
            <img :src="activeItem.compressedUrl" alt="" />
          </div>
          <div v-else class="img-compress__empty-right">请先开始压缩</div>

        </div>
      </div>

      <div class="img-compress__actions">
        <el-button type="danger" plain :disabled="!hasItems" @click="clearAll">
          清空
        </el-button>
        <el-button
          type="primary"
          :disabled="!hasItems"
          :loading="convertLoading"
          @click="startCompress"
        >
          开始压缩
        </el-button>
        <el-button
          type="success"
          plain
          :disabled="!activeItem?.compressedUrl"
          @click="downloadActive"
        >
          下载压缩图
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.img-compress {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.img-compress__head {
  margin-bottom: 4px;
}

.img-compress__crumb {
  font-size: 13px;
}

.img-compress__intro-card {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.img-compress__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}

.img-compress__panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.img-compress__upload {
  border-radius: 12px;
  padding: 0;
  background: transparent;
}

.img-compress__drop {
  display: block;
  cursor: pointer;
}

.img-compress__file-input {
  display: none;
}

.img-compress__drop-inner {
  padding: 34px 16px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fafafa;
  text-align: center;
}

.img-compress__drop--drag .img-compress__drop-inner {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
}

.img-compress__drop-icon {
  font-size: 32px;
  margin-bottom: 6px;
  color: var(--uu-text-secondary);
}

.img-compress__drop-main {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--uu-text);
}

.img-compress__drop-sub {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
}

.img-compress__drop-ext {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-compress__upload-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-compress__toolbar {
  display: flex;
  gap: 18px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.img-compress__toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
}

.img-compress__toolbar-group .img-compress__label {
  margin-bottom: 0;
}

.img-compress__qualityRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.img-compress__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--uu-text);
  margin-bottom: 0;
}

.img-compress__quality {
  display: flex;
  align-items: center;
  gap: 10px;
}

.img-compress__quality-value {
  width: 60px;
  text-align: right;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-compress__resize {
  display: flex;
  align-items: center;
  gap: 10px;
}

.img-compress__actions {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
}

.img-compress__list {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.img-compress__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px 12px;
  align-items: center;
}

.img-compress__thumb-wrap {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-compress__thumb {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.img-compress__info {
  min-width: 0;
}

.img-compress__name {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--uu-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.img-compress__meta {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-compress__ops {
  text-align: right;
}

.img-compress__split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.img-compress__pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.img-compress__pane-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--uu-text);
}

.img-compress__uploadBig {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fff;
  height: 260px;
  min-height: 260px;
  padding: 16px;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.img-compress__uploadBig--drag {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
}

.img-compress__uploadBig-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.img-compress__uploadBig-sub {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-compress__previewLarge {
  width: 100%;
  height: calc(260px - 32px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-compress__previewLarge img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.img-compress__left-meta {
  margin-top: 10px;
}

.img-compress__thumb-strip {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.img-compress__thumb-chip {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  cursor: pointer;
  padding: 0;
}

.img-compress__thumb-chip--active {
  border-color: rgba(92, 103, 242, 0.55);
  box-shadow: 0 0 0 2px rgba(92, 103, 242, 0.15);
}

.img-compress__thumb-chip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.img-compress__previewBox {
  height: 260px;
  min-height: 260px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-compress__previewBox img {
  width: 100%;
  height: calc(260px - 32px);
  object-fit: contain;
  border-radius: 8px;
}

.img-compress__empty-right {
  height: 260px;
  min-height: 260px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  padding: 18px;
  color: var(--uu-text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
}

.img-compress__right-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>

