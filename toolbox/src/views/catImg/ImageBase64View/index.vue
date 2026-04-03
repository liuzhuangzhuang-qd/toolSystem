<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'

type EncodeItem = {
  id: string
  file: File
  dataUrl: string
  base64: string
}

const activeTab = ref<'encode' | 'decode'>('encode')

// ----------- encode: image -> base64 -----------
const acceptMime = 'image/png,image/jpeg,image/webp,image/bmp,image/gif'
const dragOver = ref(false)
const encodeItems = ref<EncodeItem[]>([])
const activeEncodeId = ref<string | null>(null)
const encodeFileInputRef = ref<HTMLInputElement | null>(null)

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function dataUrlToBase64(dataUrl: string) {
  const i = dataUrl.indexOf(',')
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl
}

async function readFileAsDataUrl(file: File): Promise<string> {
  // FileReader 读取图片为 data URL，形如 data:image/png;base64,xxxxx
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function addFiles(list: FileList | null) {
  if (!list || !list.length) return
  const next: EncodeItem[] = []

  for (const f of Array.from(list)) {
    if (!f.type.startsWith('image/')) continue
    const dataUrl = await readFileAsDataUrl(f)
    next.push({
      id: createId(),
      file: f,
      dataUrl,
      base64: dataUrlToBase64(dataUrl),
    })
  }

  if (!next.length) {
    ElMessage.warning('未检测到可用的图片文件。')
    return
  }

  // 读取新文件覆盖旧列表（符合同类工具的简洁交互）。
  encodeItems.value = next
  activeEncodeId.value = next[0]?.id ?? null
}

function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  addFiles(e.dataTransfer?.files ?? null)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
}

function clearEncode() {
  encodeItems.value = []
  activeEncodeId.value = null
}

const activeEncodeItem = computed(() => {
  if (!activeEncodeId.value) return null
  return encodeItems.value.find((it) => it.id === activeEncodeId.value) ?? null
})

function selectEncodeItem(id: string) {
  activeEncodeId.value = id
}

function onCopyBase64() {
  const it = activeEncodeItem.value
  if (!it) return
  copyText(it.base64)
}

function onDownloadBase64() {
  const it = activeEncodeItem.value
  if (!it) return
  downloadText(`${nameWithoutExt(it.file.name)}.base64.txt`, it.base64)
}

function onDownloadImage() {
  const it = activeEncodeItem.value
  if (!it) return
  const ext = buildExtFromMime(it.file.type || 'image/png')
  downloadDataUrl(`${nameWithoutExt(it.file.name)}.${ext}`, it.dataUrl)
}

async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板。')
  } catch {
    // 兼容旧环境：兜底 textarea
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    if (ok) ElMessage.success('已复制到剪贴板。')
    else ElMessage.error('复制失败，请手动选择文本后复制。')
  }
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

const encodeCount = computed(() => encodeItems.value.length)

function buildExtFromMime(mime: string) {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/bmp') return 'bmp'
  if (mime === 'image/gif') return 'gif'
  return 'img'
}

function nameWithoutExt(name: string) {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

// ----------- decode: base64 -> image -----------
const decodeInput = ref('')
const decodeMime = ref<'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp' | 'image/gif'>('image/png')
const decodeError = ref<string | null>(null)

const decodedPreviewUrl = ref<string | null>(null)
const decodedBlobSize = ref<number | null>(null)
const decodedMime = ref<string>('')

function resetDecodeResult() {
  decodedPreviewUrl.value && URL.revokeObjectURL(decodedPreviewUrl.value)
  decodedPreviewUrl.value = null
  decodedBlobSize.value = null
  decodedMime.value = ''
  decodeError.value = null
}

function parseInputToBase64(input: string): { mime: string; base64: string } {
  const raw = input.trim()
  if (!raw) throw new Error('请输入 Base64 内容。')

  // data URL: data:image/png;base64,xxxx
  if (raw.startsWith('data:') && raw.includes('base64,')) {
    const m = /^data:([^;]+);base64,(.*)$/s.exec(raw)
    if (!m?.[1] || !m?.[2]) throw new Error('data URL 格式不正确。')
    return { mime: m[1], base64: m[2] }
  }

  // 纯 Base64：允许 base64url（-/_）
  const sanitized = raw.replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/')
  // 允许缺少 padding 的情况（少量容错）：补齐到 4 的倍数
  const padded =
    sanitized.length % 4 === 0 ? sanitized : sanitized + '='.repeat(4 - (sanitized.length % 4))

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(padded)) {
    throw new Error('Base64 内容包含非法字符。')
  }

  return { mime: decodeMime.value, base64: padded }
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binStr = atob(base64)
  const len = binStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function decodeNow() {
  resetDecodeResult()
  try {
    const { mime, base64 } = parseInputToBase64(decodeInput.value)
    const blob = base64ToBlob(base64, mime)
    decodedMime.value = mime
    decodedBlobSize.value = blob.size
    decodedPreviewUrl.value = URL.createObjectURL(blob)
    ElMessage.success('解码成功。')
  } catch (e) {
    decodeError.value = e instanceof Error ? e.message : '解码失败，请检查输入。'
  }
}

function downloadDecoded() {
  if (!decodedPreviewUrl.value || !decodedBlobSize.value) return
  if (!decodedMime.value) return
  const ext = buildExtFromMime(decodedMime.value)
  const filename = `decoded-${Date.now()}.${ext}`

  // 通过 fetch bloburl 生成 blob，再下载，兼容性更好。
  fetch(decodedPreviewUrl.value)
    .then((r) => r.blob())
    .then((b) => {
      const url = URL.createObjectURL(b)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    })
    .catch(() => ElMessage.error('下载失败，请稍后重试。'))
}

onBeforeUnmount(() => {
  resetDecodeResult()
})
</script>

<template>
  <div class="img-b64">
    <header class="img-b64__head">
      <el-breadcrumb class="img-b64__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-img' } }">
          图片工具
        </el-breadcrumb-item>
        <el-breadcrumb-item>图片 Base64 编解码</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="img-b64__intro-card">
        <p class="img-b64__intro-desc ">
          支持本地图片在 PNG / JPG / WebP 之间互转，全部在浏览器本地完成，不上传服务器。
        </p>
      </div>
    </header>

    <section class="img-b64__panel">
      <el-tabs v-model="activeTab" class="img-b64__tabs">
        <el-tab-pane label="图片转 Base64" name="encode">
          <div class="img-b64__split">
            <div class="img-b64__pane img-b64__pane--left">
              <p class="img-b64__pane-title">图片转 Base64</p>
              <label
                class="img-b64__uploadBig"
                :class="{ 'img-b64__uploadBig--drag': dragOver }"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                @drop="onDrop"
              >
                <input
                  ref="encodeFileInputRef"
                  class="img-b64__file-input"
                  type="file"
                  :accept="acceptMime"
                  multiple
                  @change="onFileInputChange"
                />

                <div v-if="!activeEncodeItem" class="img-b64__uploadBig-inner">
                  <el-button type="primary" plain @click="encodeFileInputRef?.click()">
                    上传图片
                  </el-button>
                  <p class="img-b64__uploadBig-sub">支持拖拽或点击上传（可批量）</p>
                </div>

                <div v-else class="img-b64__previewLarge">
                  <img :src="activeEncodeItem.dataUrl" alt="" />
                </div>
              </label>

              <div v-if="activeEncodeItem" class="img-b64__left-meta">
                <p class="img-b64__name" :title="activeEncodeItem.file.name">
                  {{ activeEncodeItem.file.name }}
                </p>
                <p class="img-b64__meta">
                  {{ (activeEncodeItem.file.size / 1024).toFixed(1) }} KB · {{ activeEncodeItem.file.type || 'image' }}
                </p>
              </div>

              <div v-if="encodeCount > 1" class="img-b64__thumb-strip">
                <button
                  v-for="it in encodeItems"
                  :key="it.id"
                  class="img-b64__thumb-chip"
                  :class="{ 'img-b64__thumb-chip--active': it.id === activeEncodeId }"
                  @click="selectEncodeItem(it.id)"
                >
                  <img :src="it.dataUrl" alt="" />
                </button>
              </div>
            </div>

            <div class="img-b64__pane img-b64__pane--right">
              <p class="img-b64__pane-title">Base64 编码</p>

              <div class="img-b64__empty-right">
                <span v-if="activeEncodeItem" class="img-b64__empty-right-span">{{ activeEncodeItem?.base64 }}
                </span>
                <span v-else>请先上传图片</span>
              </div>

              <!-- 右侧按钮统一放在下方 action bar -->
            </div>
          </div>

          <div class="img-b64__encode-actions">
            <el-button
              text
              type="danger"
              :disabled="encodeCount === 0"
              @click="clearEncode"
            >
              清空
            </el-button>

            <el-button
              type="primary"
              plain
              :disabled="!activeEncodeItem"
              @click="onCopyBase64"
            >
              复制Base64
            </el-button>

            <el-button plain :disabled="!activeEncodeItem" @click="onDownloadBase64">
              下载Base64
            </el-button>

            <el-button plain :disabled="!activeEncodeItem" @click="onDownloadImage">
              下载图片
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Base64 转图片" name="decode">
          <div class="img-b64__split">
            <div class="img-b64__pane img-b64__pane--left">
              <p class="img-b64__pane-title">Base64 输入</p>

              <div class="img-b64__decode-inputBox">
                <div class="img-b64__decode-mimeRow">
                  <span class="img-b64__decode-mimeLabel">MIME（纯 Base64 时使用）</span>
                  <el-select
                    v-model="decodeMime"
                    size="small"
                    style="width: 200px"
                    :teleported="false"
                  >
                    <el-option label="image/png" value="image/png" />
                    <el-option label="image/jpeg" value="image/jpeg" />
                    <el-option label="image/webp" value="image/webp" />
                    <el-option label="image/bmp" value="image/bmp" />
                    <el-option label="image/gif" value="image/gif" />
                  </el-select>
                </div>

                <el-input
                  v-model="decodeInput"
                  placeholder="粘贴 data URL：data:image/png;base64,xxxx 或纯 Base64：xxxx"
                  type="textarea"
                  :rows="6"
                  resize="none"
                  class="img-b64__decode-textarea"
                />
                <p v-if="decodeError" class="img-b64__decode-error">{{ decodeError }}</p>
              </div>
            </div>

            <div class="img-b64__pane img-b64__pane--right">
              <p class="img-b64__pane-title">图片预览</p>

              <div v-if="decodedPreviewUrl" class="img-b64__decode-previewBox">
                <img :src="decodedPreviewUrl" alt="" />
                <div class="img-b64__decode-previewMeta">
                  <p class="img-b64__decode-previewLine">MIME：{{ decodedMime || 'unknown' }}</p>
                  <p class="img-b64__decode-previewLine" v-if="decodedBlobSize !== null">
                    大小：{{ (decodedBlobSize / 1024).toFixed(1) }} KB
                  </p>
                </div>
              </div>
              <div v-else class="img-b64__empty-right">请先开始解码</div>

              <div class="img-b64__encode-actions">
                <el-button
                  text
                  type="danger"
                  :disabled="!decodeInput.trim()"
                  @click="() => (decodeInput = '', resetDecodeResult())"
                >
                  清空
                </el-button>
                <el-button
                  type="primary"
                  plain
                  :disabled="!decodeInput.trim()"
                  @click="decodeNow"
                >
                  开始解码
                </el-button>
                <el-button
                  plain
                  type="success"
                  :disabled="!decodedPreviewUrl"
                  @click="downloadDecoded"
                >
                  下载图片
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<style scoped>
.img-b64 {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.img-b64__head {
  margin-bottom: 4px;
}

.img-b64__crumb {
  font-size: 13px;
}

.img-b64__intro-card {
  margin-top: 16px;
  padding: 18px 20px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.img-b64__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}

.img-b64__panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
}

.img-b64__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.img-b64__split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.img-b64__pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.img-b64__pane-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--uu-text);
}

.img-b64__uploadBig {
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

.img-b64__uploadBig--drag {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
}

.img-b64__uploadBig-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.img-b64__uploadBig-sub {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-b64__previewLarge {
  width: 100%;
  height: calc(260px - 32px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-b64__previewLarge img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.img-b64__left-meta {
  margin-top: 10px;
}

.img-b64__left-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  align-items: flex-start;
}

.img-b64__thumb-strip {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.img-b64__thumb-chip {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  cursor: pointer;
  padding: 0;
}

.img-b64__thumb-chip--active {
  border-color: rgba(92, 103, 242, 0.55);
  box-shadow: 0 0 0 2px rgba(92, 103, 242, 0.15);
}

.img-b64__thumb-chip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.img-b64__b64-output {
  width: 100%;
  flex: 1;
}

.img-b64__b64-output :deep(.el-input__wrapper) {
  height: 260px;
  min-height: 260px;
  align-items: stretch;
}

.img-b64__b64-output :deep(.el-textarea__inner) {
  height: calc(260px - 32px);
  min-height: calc(260px - 32px);
}

.img-b64__empty-right {
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  padding: 18px;
  color: var(--uu-text-secondary);
  font-size: 13px;
  height: 260px;
  display: flex;
  align-items: center;
  overflow-y: auto;
}

.img-b64__empty-right-span {
  display: block;
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

.img-b64__encode-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.img-b64__right-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

.img-b64__upload {
  padding: 0;
}

.img-b64__drop {
  display: block;
  cursor: pointer;
}

.img-b64__file-input {
  display: none;
}

.img-b64__drop-inner {
  padding: 34px 16px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fafafa;
  text-align: center;
}

.img-b64__drop--drag .img-b64__drop-inner {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
}

.img-b64__drop-icon {
  font-size: 32px;
  margin-bottom: 6px;
  color: var(--uu-text-secondary);
}

.img-b64__drop-main {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--uu-text);
}

.img-b64__drop-sub {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
}

.img-b64__upload-meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-b64__list {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 420px;
  overflow-y: auto;
}

.img-b64__item {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 12px;
  align-items: start;
}

.img-b64__left {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  gap: 8px 12px;
  align-items: start;
}

.img-b64__thumb-wrap {
  width: 62px;
  height: 62px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--el-fill-color-dark);
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-b64__thumb {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.img-b64__info {
  min-width: 0;
}

.img-b64__name {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--uu-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.img-b64__meta {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-b64__ops {
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: 2 / -1;
  align-items: flex-end;
}

.img-b64__b64 {
  min-width: 0;
}

.img-b64__b64 :deep(.el-textarea__inner) {
  border-radius: 12px;
}

.img-b64__b64-input :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.img-b64__decode-card {
  background: #fafafa;
  border: 1px dashed rgba(148, 163, 184, 0.6);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.img-b64__decode-inputBox {
  height: 260px;
  min-height: 260px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.img-b64__decode-mimeRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.img-b64__decode-mimeLabel {
  font-size: 12px;
  color: var(--uu-text-secondary);
  white-space: nowrap;
}

.img-b64__decode-textarea {
  flex: 1;
}

.img-b64__decode-textarea :deep(.el-textarea__inner) {
  height: 100%;
  min-height: 0;
}

.img-b64__decode-previewBox {
  height: 260px;
  min-height: 260px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 10px;
}

.img-b64__decode-previewBox img {
  width: 100%;
  height: 190px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--el-fill-color-dark);
}

.img-b64__decode-previewMeta {
  margin-top: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-b64__decode-previewLine {
  margin: 0;
}

.img-b64__decode-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.img-b64__decode-label {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
  font-weight: 600;
}

.img-b64__decode-mime {
  display: flex;
  gap: 10px;
  align-items: center;
}

.img-b64__decode-mime-label {
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.img-b64__decode-error {
  margin: 0;
  font-size: 12px;
  color: var(--el-color-danger);
}

.img-b64__decode-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.img-b64__preview {
  display: flex;
  gap: 16px;
  align-items: center;
  padding-top: 6px;
}

.img-b64__preview-thumb {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.img-b64__preview-thumb img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.img-b64__preview-info {
  min-width: 0;
}

.img-b64__preview-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
}

.img-b64__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}
</style>

