<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'

type TargetFormat = 'jpg' | 'png' | 'webp' | 'bmp' | 'gif'

type ImageItem = {
  id: string
  file: File
  previewUrl: string
  convertedUrl?: string
}

const acceptMime = 'image/png,image/jpeg,image/webp,image/bmp,image/gif'
const files = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const activeId = ref<string | null>(null)
const targetFormat = ref<TargetFormat>('jpg')
const converting = ref(false)
const dragging = ref(false)

const hasFiles = computed(() => files.value.length > 0)
const activeItem = computed(() => {
  if (!activeId.value) return null
  return files.value.find((it) => it.id === activeId.value) ?? null
})

function handleFiles(list: FileList | null) {
  if (!list || !list.length) return

  const next: ImageItem[] = []
  for (const f of Array.from(list)) {
    if (!f.type.startsWith('image/')) continue
    const url = URL.createObjectURL(f)
    next.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file: f,
      previewUrl: url,
    })
  }
  if (!next.length) {
    ElMessage.warning('未检测到可用的图片文件。')
    return
  }
  files.value.forEach((it) => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl)
  })
  files.value = next
  activeId.value = next[0]?.id ?? null
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
  files.value.forEach((it) => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl)
  })
  files.value = []
  activeId.value = null
}

function srcNameWithExt(name: string, ext: TargetFormat): string {
  const i = name.lastIndexOf('.')
  const base = i > 0 ? name.slice(0, i) : name
  return `${base}.${ext === 'jpg' ? 'jpg' : ext}`
}

async function convertOne(file: File, fmt: TargetFormat): Promise<Blob> {
  if (fmt === 'bmp' || fmt === 'gif') {
    throw new Error('当前版本暂不支持导出 BMP / GIF')
  }
  const imgUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = (err) => reject(err)
      image.src = imgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 不可用')
    ctx.drawImage(img, 0, 0)

    const mime =
      fmt === 'png'
        ? 'image/png'
        : fmt === 'webp'
          ? 'image/webp'
          : 'image/jpeg'

    const out = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error('浏览器不支持当前格式导出'))
            return
          }
          resolve(b)
        },
        mime,
        fmt === 'jpg' ? 0.9 : undefined,
      )
    })
    return out
  } finally {
    URL.revokeObjectURL(imgUrl)
  }
}

async function startConvert() {
  if (!hasFiles.value || converting.value) return
  converting.value = true
  try {
    const fmt = targetFormat.value
    const tasks = files.value.map(async (item) => {
      if (item.convertedUrl) {
        URL.revokeObjectURL(item.convertedUrl)
        item.convertedUrl = undefined
      }
      const blob = await convertOne(item.file, fmt)
      item.convertedUrl = URL.createObjectURL(blob)
    })
    await Promise.all(tasks)
    ElMessage.success('转换完成，可以逐个下载图片。')
  } catch (e) {
    console.error(e)
    ElMessage.error('转换失败，请尝试更换浏览器或图片。')
  } finally {
    converting.value = false
  }
}

function downloadOne(item: ImageItem) {
  if (!item.convertedUrl) return
  const a = document.createElement('a')
  a.href = item.convertedUrl
  a.download = srcNameWithExt(item.file.name, targetFormat.value)
  a.click()
}

function downloadAll() {
  if (!hasFiles.value) return
  const ok = files.value.filter((it) => it.convertedUrl)
  if (!ok.length) {
    ElMessage.info('请先点击「开始转换」。')
    return
  }
  ok.forEach((it) => downloadOne(it))
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function selectItem(id: string) {
  activeId.value = id
}

onBeforeUnmount(() => {
  files.value.forEach((it) => {
    URL.revokeObjectURL(it.previewUrl)
    if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl)
  })
})
</script>

<template>
  <div class="img-format">
    <header class="img-format__head">
      <el-breadcrumb class="img-format__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-img' } }">
          图片工具
        </el-breadcrumb-item>
        <el-breadcrumb-item>图片格式转换</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="img-format__intro-card">
        <p class="img-format__intro-desc">
          支持本地图片在 PNG / JPG / WebP 之间互转，全部在浏览器本地完成，不上传服务器。
        </p>
      </div>
    </header>

    <section class="img-format__panel">
      <div class="img-format__toolbar">
        <div class="img-format__format">
          <span class="img-format__toolbar-label">转换格式</span>
          <el-radio-group v-model="targetFormat" :disabled="!hasFiles || converting">
            <el-radio-button label="jpg">JPG</el-radio-button>
            <el-radio-button label="png">PNG</el-radio-button>
            <el-radio-button label="webp">WEBP</el-radio-button>
            <el-radio-button label="bmp">BMP</el-radio-button>
            <el-radio-button label="gif">GIF</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="img-format__split">
        <div class="img-format__pane img-format__pane--left">
          <p class="img-format__pane-title">导入图片</p>
          <label
            class="img-format__leftUpload"
            :class="{ 'img-format__leftUpload--drag': dragging }"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="img-format__file-input"
              :accept="acceptMime"
              multiple
              @change="chooseFiles"
            />
            <div v-if="activeItem" class="img-format__previewBox">
              <img :src="activeItem.previewUrl" alt="" />
            </div>
            <div v-else class="img-format__empty-right">
              <div>
                <div class="img-format__drop-icon">☁</div>
                <p class="img-format__drop-main">请先导入图片</p>
                <p class="img-format__drop-sub">点击或拖拽到此处导入</p>
              </div>
            </div>
          </label>

          <div v-if="hasFiles" class="img-format__thumb-strip">
            <button
              v-for="item in files"
              :key="item.id"
              class="img-format__thumb-chip"
              :class="{ 'img-format__thumb-chip--active': item.id === activeId }"
              @click="selectItem(item.id)"
            >
              <img :src="item.previewUrl" alt="" />
            </button>
          </div>
        </div>

        <div class="img-format__pane img-format__pane--right">
          <p class="img-format__pane-title">生成图片</p>
          <div v-if="activeItem?.convertedUrl" class="img-format__previewBox">
            <img :src="activeItem.convertedUrl" alt="" />
          </div>
          <div v-else class="img-format__empty-right">请先开始转换</div>
        </div>
      </div>

      <div class="img-format__actions">
        <el-button type="primary" plain @click="openFilePicker">
          + 添加文件
        </el-button>
        <el-button type="danger" plain :disabled="!hasFiles" @click="clearAll">
          清空列表
        </el-button>
        <el-button
          type="primary"
          :disabled="!hasFiles"
          :loading="converting"
          @click="startConvert"
        >
          开始转换
        </el-button>
        <el-button
          type="success"
          :disabled="!activeItem?.convertedUrl"
          plain
          @click="activeItem && downloadOne(activeItem)"
        >
          下载当前
        </el-button>
        <el-button
          type="success"
          :disabled="!hasFiles"
          plain
          @click="downloadAll"
        >
          图片打包下载
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.img-format {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.img-format__head {
  margin-bottom: 4px;
}

.img-format__crumb {
  font-size: 13px;
}

.img-format__intro-card {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.img-format__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}

.img-format__panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.img-format__file-input {
  display: none;
}

.img-format__drop-icon {
  font-size: 32px;
  margin-bottom: 6px;
  color: var(--uu-text-secondary);
}

.img-format__drop-main {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--uu-text);
}

.img-format__drop-sub {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
}

.img-format__toolbar {
  display: flex;
  gap: 18px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.img-format__toolbar-label {
  font-weight: 500;
  color: var(--uu-text);
}

.img-format__format {
  display: flex;
  align-items: center;
  gap: 8px;
}

.img-format__split {
  display: flex;
  gap: 14px;
}

.img-format__pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.img-format__pane--left,
.img-format__pane--right {
  flex: 1;
}

.img-format__pane-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
}

.img-format__leftUpload {
  display: block;
  cursor: pointer;
}

.img-format__leftUpload--drag .img-format__previewBox,
.img-format__leftUpload--drag .img-format__empty-right {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
}

.img-format__previewBox {
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--el-border-color-lighter);
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.img-format__previewBox img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.img-format__empty-right {
  height: 300px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.8);
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--uu-text-secondary);
  font-size: 13px;
}

.img-format__thumb-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.img-format__thumb-chip {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  flex: 0 0 auto;
}

.img-format__thumb-chip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.img-format__thumb-chip--active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.img-format__actions {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
}
</style>

