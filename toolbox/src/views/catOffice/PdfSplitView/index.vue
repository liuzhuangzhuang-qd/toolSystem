<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

type SplitMode = 'each-page' | 'chunk' | 'ranges'

const acceptMime = 'application/pdf'
const fileInputRef = ref<HTMLInputElement | null>(null)

const file = ref<File | null>(null)
const sourceBytes = ref<ArrayBuffer | null>(null)
const pageCount = ref<number | null>(null)
const dragging = ref(false)

const splitMode = ref<SplitMode>('chunk')
const chunkSize = ref(5)
const rangesText = ref('1')

const splitting = ref(false)
const previewUrl = ref<string | null>(null)
/** 多文件时使用 ZIP；单文件时与预览同源 */
const resultZipUrl = ref<string | null>(null)
const resultFileCount = ref(0)

const hasPdf = computed(() => !!file.value && pageCount.value != null && pageCount.value > 0)
const canSplit = computed(() => hasPdf.value && !splitting.value)

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (resultZipUrl.value) {
    URL.revokeObjectURL(resultZipUrl.value)
    resultZipUrl.value = null
  }
  resultFileCount.value = 0
}

function openFilePicker() {
  fileInputRef.value?.click()
}

async function loadPdf(f: File) {
  revokePreview()
  const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
  if (!isPdf) {
    ElMessage.warning('请选择 PDF 文件。')
    return
  }
  try {
    const buf = await f.arrayBuffer()
    const doc = await PDFDocument.load(buf.slice(0))
    const n = doc.getPageCount()
    if (n < 1) {
      ElMessage.warning('该 PDF 没有可拆分的页面。')
      return
    }
    file.value = f
    sourceBytes.value = buf.slice(0)
    pageCount.value = n
    if (chunkSize.value > n) chunkSize.value = n
    if (chunkSize.value < 1) chunkSize.value = 1
  } catch (e) {
    console.error(e)
    file.value = null
    sourceBytes.value = null
    pageCount.value = null
    ElMessage.error('无法读取 PDF，可能已加密或已损坏。')
  }
}

async function handleFiles(list: FileList | null) {
  if (!list?.length) return
  const f = list[0]
  await loadPdf(f)
}

function chooseFile(e: Event) {
  const input = e.target as HTMLInputElement
  void handleFiles(input.files)
  input.value = ''
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

function clearFile() {
  file.value = null
  sourceBytes.value = null
  pageCount.value = null
  revokePreview()
}

/** 1-based inclusive segments → 0-based index arrays */
function parseRanges(input: string, total: number): number[][] {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('请填写页码范围。')
  const raw: [number, number][] = []
  for (const part of trimmed.split(',')) {
    const p = part.trim()
    if (!p) continue
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(p)
    if (range) {
      const a = Number(range[1])
      const b = Number(range[2])
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`无法解析：${p}`)
      raw.push([Math.min(a, b), Math.max(a, b)])
    } else if (/^\d+$/.test(p)) {
      const n = Number(p)
      if (!Number.isFinite(n)) throw new Error(`无法解析：${p}`)
      raw.push([n, n])
    } else {
      throw new Error(`无法解析：${p}`)
    }
  }
  if (!raw.length) throw new Error('无有效范围。')
  for (const [s, e] of raw) {
    if (s < 1 || e > total || s > e) {
      throw new Error(`页码需在 1～${total} 之间，且起始页不大于结束页。`)
    }
  }
  return raw.map(([s, e]) =>
    Array.from({ length: e - s + 1 }, (_, i) => s - 1 + i),
  )
}

function buildChunkBatches(total: number, size: number): number[][] {
  const k = Math.max(1, Math.floor(size) || 1)
  const out: number[][] = []
  for (let i = 0; i < total; i += k) {
    out.push(
      Array.from({ length: Math.min(k, total - i) }, (_, j) => i + j),
    )
  }
  return out
}

function buildEachPageBatches(total: number): number[][] {
  return Array.from({ length: total }, (_, i) => [i])
}

async function extractBatches(
  buf: ArrayBuffer,
  batches: number[][],
): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(buf.slice(0))
  const outputs: Uint8Array[] = []
  for (const indices of batches) {
    const out = await PDFDocument.create()
    const pages = await out.copyPages(src, indices)
    pages.forEach((p) => out.addPage(p))
    outputs.push(await out.save())
  }
  return outputs
}

async function splitNow() {
  if (!canSplit.value || !sourceBytes.value || pageCount.value == null) return
  const total = pageCount.value
  let batches: number[][]
  try {
    if (splitMode.value === 'each-page') {
      batches = buildEachPageBatches(total)
    } else if (splitMode.value === 'chunk') {
      const k = Math.min(Math.max(1, chunkSize.value), total)
      batches = buildChunkBatches(total, k)
    } else {
      batches = parseRanges(rangesText.value, total)
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '页码范围无效。')
    return
  }

  splitting.value = true
  revokePreview()
  try {
    const pdfs = await extractBatches(sourceBytes.value, batches)
    const blobs = pdfs.map(
      (bytes) => new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
    )
    resultFileCount.value = blobs.length

    if (blobs.length === 1) {
      previewUrl.value = URL.createObjectURL(blobs[0])
      ElMessage.success('拆分完成，共 1 个文件。')
    } else {
      const zip = new JSZip()
      blobs.forEach((blob, i) => {
        const name = `split-${String(i + 1).padStart(3, '0')}.pdf`
        zip.file(name, blob)
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      resultZipUrl.value = URL.createObjectURL(zipBlob)
      previewUrl.value = URL.createObjectURL(blobs[0])
      ElMessage.success(`拆分完成，共 ${blobs.length} 个 PDF，已打包为 ZIP。`)
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('拆分失败，请重试或检查文件是否异常。')
  } finally {
    splitting.value = false
  }
}

function downloadResult() {
  if (resultFileCount.value <= 1 && previewUrl.value) {
    const a = document.createElement('a')
    a.href = previewUrl.value
    const base = (file.value?.name ?? 'document').replace(/\.pdf$/i, '')
    a.download = `${base}-split.pdf`
    a.click()
    return
  }
  if (resultZipUrl.value) {
    const a = document.createElement('a')
    a.href = resultZipUrl.value
    const base = (file.value?.name ?? 'document').replace(/\.pdf$/i, '')
    a.download = `${base}-split.zip`
    a.click()
  }
}

watch(pageCount, (n) => {
  if (n != null && chunkSize.value > n) chunkSize.value = n
})

onBeforeUnmount(() => {
  revokePreview()
})
</script>

<template>
  <div class="pdf-split">
    <header class="pdf-split__head">
      <el-breadcrumb class="pdf-split__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-office' } }">办公工具</el-breadcrumb-item>
        <el-breadcrumb-item>PDF 拆分</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="pdf-split__intro-card">
        <p class="pdf-split__intro-desc">
          在浏览器本地按页拆分 PDF，支持逐页、固定页数分卷或自定义页码范围；多份结果打包为 ZIP。书签结构因文件差异较大，当前仅支持按页码规则拆分。
        </p>
      </div>
    </header>

    <section class="pdf-split__panel">
      <div class="pdf-split__split">
        <div class="pdf-split__pane pdf-split__pane--left">
          <p class="pdf-split__pane-title">选择 PDF 与拆分方式</p>
          <label
            class="pdf-split__uploadBig"
            :class="{ 'pdf-split__uploadBig--drag': dragging }"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="pdf-split__file-input"
              :accept="acceptMime"
              @change="chooseFile"
            />
            <div v-if="!file" class="pdf-split__uploadBig-inner">
              <el-button type="primary" plain @click.stop="openFilePicker">选择 PDF</el-button>
              <p class="pdf-split__uploadBig-sub">点击或拖拽一个文件（每次仅处理一个）</p>
            </div>
            <div v-else class="pdf-split__detail">
              <p class="pdf-split__file-name">{{ file.name }}</p>
              <p class="pdf-split__meta">
                <template v-if="pageCount != null">共 {{ pageCount }} 页</template>
                <template v-else>—</template>
                <span class="pdf-split__size"> · {{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
              </p>
            </div>
          </label>

          <div v-if="hasPdf" class="pdf-split__options">
            <span class="pdf-split__label">拆分方式</span>
            <el-radio-group v-model="splitMode" class="pdf-split__radios">
              <el-radio-button label="chunk">固定每份页数</el-radio-button>
              <el-radio-button label="each-page">每页单独文件</el-radio-button>
              <el-radio-button label="ranges">自定义页码范围</el-radio-button>
            </el-radio-group>

            <div v-if="splitMode === 'chunk'" class="pdf-split__field">
              <span class="pdf-split__label">每份页数</span>
              <el-input-number
                v-model="chunkSize"
                :min="1"
                :max="pageCount ?? 9999"
                :step="1"
              />
            </div>

            <div v-if="splitMode === 'ranges'" class="pdf-split__field pdf-split__field--block">
              <span class="pdf-split__label">页码范围（1 起算）</span>
              <el-input
                v-model="rangesText"
                type="textarea"
                :rows="3"
                placeholder="例如：1-3, 5, 8-10（逗号分隔；每段生成一个 PDF）"
              />
            </div>
          </div>

          <div v-if="file" class="pdf-split__file-actions">
            <el-button type="danger" plain size="small" @click="clearFile">移除文件</el-button>
            <el-button type="primary" plain size="small" @click="openFilePicker">重新选择</el-button>
          </div>
        </div>

        <div class="pdf-split__pane pdf-split__pane--right">
          <p class="pdf-split__pane-title">预览（多文件时仅预览第一份）</p>
          <iframe v-if="previewUrl" class="pdf-split__iframe" title="拆分预览" :src="previewUrl" />
          <div v-else class="pdf-split__empty-right">拆分后将在此预览第一份 PDF</div>
        </div>
      </div>

      <div class="pdf-split__actions">
        <el-button type="primary" :disabled="!canSplit" :loading="splitting" @click="splitNow">
          开始拆分
        </el-button>
        <el-button type="success" plain :disabled="!previewUrl" @click="downloadResult">
          {{ resultFileCount > 1 ? '下载 ZIP' : '下载 PDF' }}
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pdf-split {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pdf-split__head {
  margin-bottom: 4px;
}
.pdf-split__crumb {
  font-size: 13px;
}
.pdf-split__intro-card {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}
.pdf-split__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}
.pdf-split__panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pdf-split__split {
  --pdf-split-main-h: 420px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.pdf-split__pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pdf-split__pane--left,
.pdf-split__pane--right {
  flex: 1;
}
.pdf-split__pane-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
}
.pdf-split__file-input {
  display: none;
}
.pdf-split__uploadBig {
  height: var(--pdf-split-main-h);
  min-height: var(--pdf-split-main-h);
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.8);
  background: #fafafa;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}
.pdf-split__uploadBig--drag {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
}
.pdf-split__uploadBig-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
}
.pdf-split__uploadBig-sub {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
  text-align: center;
  padding: 0 12px;
}
.pdf-split__detail {
  flex: 1;
  min-height: 0;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
}
.pdf-split__file-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
  word-break: break-all;
}
.pdf-split__meta {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
}
.pdf-split__size {
  margin-left: 4px;
}
.pdf-split__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pdf-split__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--uu-text);
}
.pdf-split__radios {
  flex-wrap: wrap;
}
.pdf-split__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pdf-split__field--block {
  width: 100%;
}
.pdf-split__file-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pdf-split__iframe {
  width: 100%;
  height: var(--pdf-split-main-h);
  min-height: var(--pdf-split-main-h);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: #f1f5f9;
}
.pdf-split__empty-right {
  height: var(--pdf-split-main-h);
  min-height: var(--pdf-split-main-h);
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.8);
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--uu-text-secondary);
  font-size: 13px;
  text-align: center;
  padding: 16px;
}
.pdf-split__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}
</style>
