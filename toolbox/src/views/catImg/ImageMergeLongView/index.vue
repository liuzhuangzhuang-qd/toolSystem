<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'

type Direction = 'vertical' | 'horizontal'
type OutputFormat = 'png' | 'jpg' | 'webp'
type MergeItem = { id: string; file: File; previewUrl: string }

const acceptMime = 'image/png,image/jpeg,image/webp,image/bmp,image/gif'
const fileInputRef = ref<HTMLInputElement | null>(null)
const items = ref<MergeItem[]>([])
const activeId = ref<string | null>(null)
const mergedUrl = ref<string | null>(null)
const merging = ref(false)
const dragging = ref(false)

const direction = ref<Direction>('vertical')
const gap = ref(0)
const bgColor = ref('#ffffff')
const outputFormat = ref<OutputFormat>('png')

const hasItems = computed(() => items.value.length > 0)
const activeItem = computed(() => {
  if (!activeId.value) return null
  return items.value.find((it) => it.id === activeId.value) ?? null
})

function createId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFiles(list: FileList | null) {
  if (!list || !list.length) return
  const next: MergeItem[] = []
  for (const f of Array.from(list)) {
    if (!f.type.startsWith('image/')) continue
    next.push({ id: createId(), file: f, previewUrl: URL.createObjectURL(f) })
  }
  if (!next.length) {
    ElMessage.warning('未检测到可用的图片文件。')
    return
  }

  const prevCount = items.value.length
  items.value = [...items.value, ...next]
  if (!activeId.value) activeId.value = items.value[0]?.id ?? null
  // 首次上传完成后，默认选中第一张；继续上传后，自动选中新追加的第一张。
  else if (prevCount > 0) activeId.value = next[0]?.id ?? activeId.value
  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = null
  }
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

function selectItem(id: string) {
  activeId.value = id
}

function removeItem(id: string) {
  const idx = items.value.findIndex((it) => it.id === id)
  if (idx < 0) return

  const [removed] = items.value.splice(idx, 1)
  URL.revokeObjectURL(removed.previewUrl)

  if (activeId.value === id) {
    const fallback = items.value[idx] ?? items.value[idx - 1] ?? null
    activeId.value = fallback?.id ?? null
  }

  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = null
  }
}

function clearAll() {
  items.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
  items.value = []
  activeId.value = null
  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = null
  }
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function mergeNow() {
  if (!hasItems.value || merging.value) return
  merging.value = true
  try {
    const imgs = await Promise.all(items.value.map((it) => loadImage(it.file)))
    const g = Math.max(0, Math.min(200, Number(gap.value) || 0))
    const isVertical = direction.value === 'vertical'

    // 以“最小图片”作为基准尺寸，并使用其宽高比统一所有图片。
    const base = imgs.reduce((min, cur) => {
      const minArea = min.width * min.height
      const curArea = cur.width * cur.height
      return curArea < minArea ? cur : min
    }, imgs[0])
    const baseW = Math.max(1, base.width)
    const baseH = Math.max(1, base.height)
    const baseRatio = baseW / baseH

    const width = isVertical
      ? baseW
      : baseW * imgs.length + g * (imgs.length - 1)
    const height = isVertical
      ? baseH * imgs.length + g * (imgs.length - 1)
      : baseH

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 不可用')

    ctx.fillStyle = bgColor.value || '#ffffff'
    ctx.fillRect(0, 0, width, height)

    function cropRectByRatio(w: number, h: number, ratio: number) {
      const current = w / h
      if (Math.abs(current - ratio) < 1e-6) {
        return { sx: 0, sy: 0, sw: w, sh: h }
      }
      if (current > ratio) {
        const sw = Math.round(h * ratio)
        const sx = Math.floor((w - sw) / 2)
        return { sx, sy: 0, sw, sh: h }
      }
      const sh = Math.round(w / ratio)
      const sy = Math.floor((h - sh) / 2)
      return { sx: 0, sy, sw: w, sh }
    }

    let offset = 0
    for (const img of imgs) {
      const { sx, sy, sw, sh } = cropRectByRatio(img.width, img.height, baseRatio)
      if (isVertical) {
        ctx.drawImage(img, sx, sy, sw, sh, 0, offset, baseW, baseH)
        offset += baseH + g
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, offset, 0, baseW, baseH)
        offset += baseW + g
      }
    }

    const mime =
      outputFormat.value === 'jpg'
        ? 'image/jpeg'
        : outputFormat.value === 'webp'
          ? 'image/webp'
          : 'image/png'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error('导出失败'))
          else resolve(b)
        },
        mime,
        outputFormat.value === 'png' ? undefined : 0.92,
      )
    })

    if (mergedUrl.value) URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = URL.createObjectURL(blob)
    ElMessage.success('合并完成。')
  } catch (e) {
    console.error(e)
    ElMessage.error('合并失败，请重试。')
  } finally {
    merging.value = false
  }
}

function downloadMerged() {
  if (!mergedUrl.value) return
  const a = document.createElement('a')
  a.href = mergedUrl.value
  a.download = `merged-long-image.${outputFormat.value === 'jpg' ? 'jpg' : outputFormat.value}`
  a.click()
}

onBeforeUnmount(() => {
  items.value.forEach((it) => URL.revokeObjectURL(it.previewUrl))
  if (mergedUrl.value) URL.revokeObjectURL(mergedUrl.value)
})
</script>

<template>
  <div class="img-merge">
    <header class="img-merge__head">
      <el-breadcrumb class="img-merge__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-img' } }">图片工具</el-breadcrumb-item>
        <el-breadcrumb-item>合并长图</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="img-merge__intro-card">
        <p class="img-merge__intro-desc">支持纵向/横向拼接，设置间距与背景色后导出长图。</p>
      </div>
    </header>

    <section class="img-merge__panel">
      <div class="img-merge__toolbar">
        <div class="img-merge__toolbar-group">
          <span class="img-merge__label">拼接方向</span>
          <el-radio-group v-model="direction">
            <el-radio-button label="vertical">纵向</el-radio-button>
            <el-radio-button label="horizontal">横向</el-radio-button>
          </el-radio-group>
        </div>
        <div class="img-merge__toolbar-group">
          <span class="img-merge__label">间距(px)</span>
          <el-input-number v-model="gap" :min="0" :max="200" :step="1" />
        </div>
        <div class="img-merge__toolbar-group">
          <span class="img-merge__label">背景色</span>
          <el-color-picker v-model="bgColor" />
        </div>
        <div class="img-merge__toolbar-group">
          <span class="img-merge__label">输出格式</span>
          <el-radio-group v-model="outputFormat">
            <el-radio-button label="png">PNG</el-radio-button>
            <el-radio-button label="jpg">JPG</el-radio-button>
            <el-radio-button label="webp">WEBP</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="img-merge__split">
        <div class="img-merge__pane img-merge__pane--left">
          <p class="img-merge__pane-title">待合并图片</p>
          <label
            class="img-merge__uploadBig"
            :class="{ 'img-merge__uploadBig--drag': dragging }"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="img-merge__file-input"
              :accept="acceptMime"
              multiple
              @change="chooseFiles"
            />
            <div v-if="!activeItem" class="img-merge__uploadBig-inner">
              <el-button type="primary" plain @click="openFilePicker">上传图片</el-button>
              <p class="img-merge__uploadBig-sub">支持拖拽或点击上传（可批量）</p>
            </div>
            <div v-else class="img-merge__previewLarge">
              <img :src="activeItem.previewUrl" alt="" />
            </div>
          </label>

          <div v-if="items.length > 1" class="img-merge__thumb-strip">
            <button
              v-for="it in items"
              :key="it.id"
              class="img-merge__thumb-chip"
              :class="{ 'img-merge__thumb-chip--active': it.id === activeId }"
              @click="selectItem(it.id)"
            >
              <img :src="it.previewUrl" alt="" />
              <span
                class="img-merge__thumb-remove"
                title="删除"
                @click.stop="removeItem(it.id)"
              >
                ×
              </span>
            </button>
          </div>
        </div>

        <div class="img-merge__pane img-merge__pane--right">
          <p class="img-merge__pane-title">合并结果</p>
          <div v-if="mergedUrl" class="img-merge__previewBox">
            <img :src="mergedUrl" alt="" />
          </div>
          <div v-else class="img-merge__empty-right">请先开始合并</div>
        </div>
      </div>

      <div class="img-merge__actions">
        <el-button type="primary" plain @click="openFilePicker">继续上传</el-button>
        <el-button type="danger" plain :disabled="!hasItems" @click="clearAll">清空</el-button>
        <el-button type="primary" :disabled="!hasItems" :loading="merging" @click="mergeNow">开始合并</el-button>
        <el-button type="success" plain :disabled="!mergedUrl" @click="downloadMerged">下载长图</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.img-merge { display: flex; flex-direction: column; gap: 16px; }
.img-merge__head { margin-bottom: 4px; }
.img-merge__crumb { font-size: 13px; }
.img-merge__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.img-merge__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.img-merge__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.img-merge__toolbar { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
.img-merge__toolbar-group { display: flex; flex-direction: column; gap: 8px; }
.img-merge__label { font-size: 13px; font-weight: 500; color: var(--uu-text); }
.img-merge__split { display: flex; gap: 14px; }
.img-merge__pane { min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.img-merge__pane--left, .img-merge__pane--right { flex: 1; }
.img-merge__pane-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.img-merge__file-input { display: none; }
.img-merge__uploadBig { height: 320px; border-radius: 12px; border: 1px dashed rgba(148, 163, 184, 0.8); background: #fafafa; position: relative; overflow: hidden; display: block; cursor: pointer; }
.img-merge__uploadBig--drag { border-color: var(--el-color-primary); background: rgba(79, 70, 229, 0.05); }
.img-merge__uploadBig-inner { height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; }
.img-merge__uploadBig-sub { margin: 0; font-size: 13px; color: var(--uu-text-secondary); }
.img-merge__previewLarge { height: 100%; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
.img-merge__previewLarge img { max-width: 100%; max-height: 100%; display: block; }
.img-merge__thumb-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; }
.img-merge__thumb-chip { position: relative; width: 56px; height: 56px; border-radius: 10px; padding: 0; border: 1px solid var(--el-border-color-lighter); background: #fff; overflow: hidden; cursor: pointer; flex: 0 0 auto; }
.img-merge__thumb-chip img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-merge__thumb-chip--active { border-color: var(--el-color-primary); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }
.img-merge__thumb-remove { position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; border-radius: 50%; background: rgba(15, 23, 42, 0.7); color: #fff; font-size: 12px; line-height: 16px; text-align: center; }
.img-merge__previewBox { height: 320px; border-radius: 12px; border: 1px solid var(--el-border-color-lighter); background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: auto; }
.img-merge__previewBox img { max-width: 100%; display: block; }
.img-merge__empty-right { height: 320px; border-radius: 12px; border: 1px dashed rgba(148, 163, 184, 0.8); background: #fafafa; display: flex; align-items: center; justify-content: center; color: var(--uu-text-secondary); font-size: 13px; }
.img-merge__actions { display: flex; gap: 10px; flex-wrap: nowrap; align-items: center; justify-content: flex-end; }
</style>
