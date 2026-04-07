<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PDFDocument } from 'pdf-lib'

type PdfItem = { id: string; file: File; pageCount: number | null }

const acceptMime = 'application/pdf'
const fileInputRef = ref<HTMLInputElement | null>(null)
const items = ref<PdfItem[]>([])
const activeId = ref<string | null>(null)
const mergedUrl = ref<string | null>(null)
const merging = ref(false)
const dragging = ref(false)

const hasItems = computed(() => items.value.length > 0)
const activeItem = computed(() => {
  if (!activeId.value) return null
  return items.value.find((it) => it.id === activeId.value) ?? null
})
const totalPages = computed(() =>
  items.value.reduce((n, it) => n + (it.pageCount ?? 0), 0),
)

function createId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function countPages(file: File): Promise<number> {
  const buf = await file.arrayBuffer()
  const doc = await PDFDocument.load(buf)
  return doc.getPageCount()
}

function openFilePicker() {
  fileInputRef.value?.click()
}

async function handleFiles(list: FileList | null) {
  if (!list || !list.length) return
  const next: PdfItem[] = []
  for (const f of Array.from(list)) {
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    if (!isPdf) continue
    const id = createId()
    let pageCount: number | null = null
    try {
      pageCount = await countPages(f)
    } catch {
      pageCount = null
    }
    next.push({ id, file: f, pageCount })
  }
  if (!next.length) {
    ElMessage.warning('未检测到可用的 PDF 文件。')
    return
  }

  const prevCount = items.value.length
  items.value = [...items.value, ...next]
  if (!activeId.value) activeId.value = items.value[0]?.id ?? null
  else if (prevCount > 0) activeId.value = next[0]?.id ?? activeId.value

  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = null
  }

  const failed = next.filter((it) => it.pageCount === null)
  if (failed.length) {
    ElMessage.warning(
      `${failed.length} 个文件无法读取页数（可能已加密或已损坏），合并时可能失败。`,
    )
  }
}

function chooseFiles(e: Event) {
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

function selectItem(id: string) {
  activeId.value = id
}

function removeItem(id: string) {
  const idx = items.value.findIndex((it) => it.id === id)
  if (idx < 0) return
  items.value.splice(idx, 1)
  if (activeId.value === id) {
    const fallback = items.value[idx] ?? items.value[idx - 1] ?? null
    activeId.value = fallback?.id ?? null
  }
  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = null
  }
}

function moveItem(id: string, delta: number) {
  const idx = items.value.findIndex((it) => it.id === id)
  const j = idx + delta
  if (idx < 0 || j < 0 || j >= items.value.length) return
  const copy = [...items.value]
  const [row] = copy.splice(idx, 1)
  copy.splice(j, 0, row)
  items.value = copy
  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = null
  }
}

function clearAll() {
  items.value = []
  activeId.value = null
  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = null
  }
}

async function mergeNow() {
  if (!hasItems.value || merging.value) return
  merging.value = true
  try {
    const mergedPdf = await PDFDocument.create()
    for (const it of items.value) {
      const buf = await it.file.arrayBuffer()
      const src = await PDFDocument.load(buf)
      const copied = await mergedPdf.copyPages(src, src.getPageIndices())
      copied.forEach((p) => mergedPdf.addPage(p))
    }
    const bytes = await mergedPdf.save()
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
    if (mergedUrl.value) URL.revokeObjectURL(mergedUrl.value)
    mergedUrl.value = URL.createObjectURL(blob)
    ElMessage.success('合并完成。')
  } catch (e) {
    console.error(e)
    ElMessage.error('合并失败：文件可能已加密、损坏或格式异常。')
  } finally {
    merging.value = false
  }
}

function downloadMerged() {
  if (!mergedUrl.value) return
  const a = document.createElement('a')
  a.href = mergedUrl.value
  const stamp = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  a.download = `merged-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}.pdf`
  a.click()
}

onBeforeUnmount(() => {
  if (mergedUrl.value) URL.revokeObjectURL(mergedUrl.value)
})
</script>

<template>
  <div class="pdf-merge">
    <header class="pdf-merge__head">
      <el-breadcrumb class="pdf-merge__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-office' } }">办公工具</el-breadcrumb-item>
        <el-breadcrumb-item>PDF 合并</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="pdf-merge__intro-card">
        <p class="pdf-merge__intro-desc">
          在浏览器本地合并多个 PDF，按下列顺序拼接所有页面；文件不会上传到服务器。
        </p>
      </div>
    </header>

    <section class="pdf-merge__panel">
      <div class="pdf-merge__toolbar">
        <div class="pdf-merge__stat" v-if="hasItems">
          <span>共 {{ items.length }} 个文件</span>
          <span v-if="totalPages > 0">，合计约 {{ totalPages }} 页</span>
        </div>
      </div>

      <div class="pdf-merge__split">
        <div class="pdf-merge__pane pdf-merge__pane--left">
          <p class="pdf-merge__pane-title">待合并 PDF（自上而下为合并顺序）</p>
          <label
            class="pdf-merge__uploadBig"
            :class="{ 'pdf-merge__uploadBig--drag': dragging }"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="pdf-merge__file-input"
              :accept="acceptMime"
              multiple
              @change="chooseFiles"
            />
            <div v-if="!activeItem" class="pdf-merge__uploadBig-inner">
              <el-button type="primary" plain @click.stop="openFilePicker">选择 PDF</el-button>
              <p class="pdf-merge__uploadBig-sub">支持拖拽或点击上传（可批量）</p>
            </div>
            <div v-else class="pdf-merge__detail">
              <p class="pdf-merge__file-name">{{ activeItem.file.name }}</p>
              <p class="pdf-merge__meta">
                <template v-if="activeItem.pageCount != null">{{ activeItem.pageCount }} 页</template>
                <template v-else>无法读取页数</template>
                <span class="pdf-merge__size">
                  · {{ (activeItem.file.size / 1024 / 1024).toFixed(2) }} MB
                </span>
              </p>
            </div>
          </label>

          <div v-if="items.length > 1" class="pdf-merge__list">
            <div
              v-for="(it, idx) in items"
              :key="it.id"
              class="pdf-merge__row"
              :class="{ 'pdf-merge__row--active': it.id === activeId }"
              @click="selectItem(it.id)"
            >
              <span class="pdf-merge__order">{{ idx + 1 }}</span>
              <span class="pdf-merge__row-name" :title="it.file.name">{{ it.file.name }}</span>
              <span class="pdf-merge__row-pages">
                {{ it.pageCount != null ? `${it.pageCount} 页` : '—' }}
              </span>
              <span class="pdf-merge__row-actions">
                <el-button text size="small" :disabled="idx === 0" @click.stop="moveItem(it.id, -1)">
                  上移
                </el-button>
                <el-button
                  text
                  size="small"
                  :disabled="idx === items.length - 1"
                  @click.stop="moveItem(it.id, 1)"
                >
                  下移
                </el-button>
                <el-button type="danger" text size="small" @click.stop="removeItem(it.id)">
                  移除
                </el-button>
              </span>
            </div>
          </div>
        </div>

        <div class="pdf-merge__pane pdf-merge__pane--right">
          <p class="pdf-merge__pane-title">合并结果预览</p>
          <iframe v-if="mergedUrl" class="pdf-merge__iframe" title="合并结果" :src="mergedUrl" />
          <div v-else class="pdf-merge__empty-right">合并后将在此预览</div>
        </div>
      </div>

      <div class="pdf-merge__actions">
        <el-button type="primary" plain @click="openFilePicker">继续添加</el-button>
        <el-button type="danger" plain :disabled="!hasItems" @click="clearAll">清空</el-button>
        <el-button type="primary" :disabled="!hasItems" :loading="merging" @click="mergeNow">
          开始合并
        </el-button>
        <el-button type="success" plain :disabled="!mergedUrl" @click="downloadMerged">
          下载 PDF
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pdf-merge {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pdf-merge__head {
  margin-bottom: 4px;
}
.pdf-merge__crumb {
  font-size: 13px;
}
.pdf-merge__intro-card {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}
.pdf-merge__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}
.pdf-merge__panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pdf-merge__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.pdf-merge__stat {
  font-size: 13px;
  color: var(--uu-text-secondary);
}
.pdf-merge__split {
  --pdf-merge-main-h: 420px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.pdf-merge__pane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pdf-merge__pane--left,
.pdf-merge__pane--right {
  flex: 1;
}
.pdf-merge__pane-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
}
.pdf-merge__file-input {
  display: none;
}
.pdf-merge__uploadBig {
  height: var(--pdf-merge-main-h);
  min-height: var(--pdf-merge-main-h);
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.8);
  background: #fafafa;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}
.pdf-merge__uploadBig--drag {
  border-color: var(--el-color-primary);
  background: rgba(79, 70, 229, 0.05);
}
.pdf-merge__uploadBig-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
}
.pdf-merge__uploadBig-sub {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
}
.pdf-merge__detail {
  flex: 1;
  min-height: 0;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
}
.pdf-merge__file-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
  word-break: break-all;
}
.pdf-merge__meta {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
}
.pdf-merge__size {
  margin-left: 4px;
}
.pdf-merge__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}
.pdf-merge__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}
.pdf-merge__row--active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}
.pdf-merge__order {
  flex: 0 0 22px;
  text-align: center;
  font-weight: 600;
  color: var(--uu-text-secondary);
}
.pdf-merge__row-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--uu-text);
}
.pdf-merge__row-pages {
  flex: 0 0 52px;
  text-align: right;
  color: var(--uu-text-secondary);
}
.pdf-merge__row-actions {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: nowrap;
  gap: 2px;
}
.pdf-merge__iframe {
  width: 100%;
  height: var(--pdf-merge-main-h);
  min-height: var(--pdf-merge-main-h);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: #f1f5f9;
}
.pdf-merge__empty-right {
  height: var(--pdf-merge-main-h);
  min-height: var(--pdf-merge-main-h);
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.8);
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--uu-text-secondary);
  font-size: 13px;
}
.pdf-merge__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}
</style>
