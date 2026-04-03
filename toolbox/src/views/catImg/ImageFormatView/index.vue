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
const targetFormat = ref<TargetFormat>('jpg')
const converting = ref(false)
const dragging = ref(false)

const hasFiles = computed(() => files.value.length > 0)

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
      <div class="img-format__upload">
        <label
          class="img-format__drop"
          :class="{ 'img-format__drop--drag': dragging }"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <input
            ref="fileInput"
            type="file"
            class="img-format__file-input"
            :accept="acceptMime"
            multiple
            @change="chooseFiles"
          />
          <div class="img-format__drop-inner">
            <div class="img-format__drop-icon">☁</div>
            <p class="img-format__drop-main">将图片拖动到此处</p>
            <p class="img-format__drop-sub">或点击此处打开文件选择图片，支持批量上传</p>
            <p class="img-format__drop-ext">
              PNG、JPG、BMP、WEBP、GIF 等格式互相转换，支持批量转换。
            </p>
          </div>
        </label>
        <div class="img-format__upload-meta">
          <span>文件数：{{ files.length }}</span>
        </div>
      </div>

      <div class="img-format__bottom">
        <div class="img-format__bottom-left">
          <el-button type="primary" plain @click="$refs.fileInput?.click()">
            + 添加文件
          </el-button>
          <el-button type="danger" plain :disabled="!hasFiles" @click="clearAll">
            清空列表
          </el-button>
        </div>
        <div class="img-format__bottom-right">
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
          <div class="img-format__actions">
            <el-button
              type="success"
              :disabled="!hasFiles"
              plain
              @click="downloadAll"
            >
              图片打包下载
            </el-button>
            <el-button
              type="primary"
              :disabled="!hasFiles"
              :loading="converting"
              @click="startConvert"
            >
              开始转换
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="hasFiles" class="img-format__list">
        <div
          v-for="item in files"
          :key="item.id"
          class="img-format__item"
        >
          <div class="img-format__thumb-wrap">
            <img
              :src="item.previewUrl"
              alt=""
              class="img-format__thumb"
            />
          </div>
          <div class="img-format__info">
            <p class="img-format__name" :title="item.file.name">
              {{ item.file.name }}
            </p>
            <p class="img-format__meta">
              原始：{{ (item.file.size / 1024).toFixed(1) }} KB
              <span v-if="item.convertedUrl"> · 已生成 {{ targetFormat.toUpperCase() }}</span>
            </p>
          </div>
          <div class="img-format__ops">
            <el-button
              size="small"
              type="primary"
              text
              :disabled="!item.convertedUrl"
              @click="downloadOne(item)"
            >
              下载
            </el-button>
          </div>
        </div>
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
  margin-top: 30px;
  padding: 20px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.img-format__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
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

.img-format__upload {
  border-radius: 12px;
  padding: 0;
  background: transparent;
}

.img-format__drop {
  display: block;
  cursor: pointer;
}

.img-format__file-input {
  display: none;
}

.img-format__drop-inner {
  padding: 40px 16px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fafafa;
  text-align: center;
}

.img-format__drop--drag .img-format__drop-inner {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
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
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--uu-text-secondary);
}

.img-format__drop-ext {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-format__upload-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-format__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  font-size: 13px;
}

.img-format__toolbar-label {
  font-weight: 500;
  color: var(--uu-text);
}

.img-format__toolbar-tip {
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-format__bottom {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.img-format__bottom-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.img-format__bottom-right {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 1;
}

.img-format__format {
  display: flex;
  align-items: center;
  gap: 8px;
}

.img-format__actions {
  display: flex;
  gap: 8px;
}

.img-format__list {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.img-format__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px 12px;
  align-items: center;
}

.img-format__thumb-wrap {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-format__thumb {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.img-format__info {
  min-width: 0;
}

.img-format__name {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--uu-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.img-format__meta {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-format__ops {
  text-align: right;
}
</style>

