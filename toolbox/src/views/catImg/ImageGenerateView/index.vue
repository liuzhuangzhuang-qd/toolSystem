<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'

type OutputFormat = 'png' | 'jpg' | 'jpeg' | 'webp'

function mimeForFormat(fmt: OutputFormat): string {
  if (fmt === 'png') return 'image/png'
  if (fmt === 'webp') return 'image/webp'
  return 'image/jpeg'
}

/** JPG / JPEG 均为 JPEG 编码，仅下载扩展名不同 */
function downloadExtForFormat(fmt: OutputFormat): string {
  if (fmt === 'jpg') return 'jpg'
  if (fmt === 'jpeg') return 'jpeg'
  return fmt
}
type GradientDir = 'horizontal' | 'vertical' | 'diagonal'

/** 背景：纯色或双色渐变 */
type BgSettings = {
  solid: boolean
  color1: string
  color2: string
  dir: GradientDir
}

/** 内部起始画布（用户不可调），仅作体积拟合起点，最终像素由目标体积与格式决定 */
const START_W = 1920
const START_H = 1080

/** 目标最大体积（MB），唯一尺寸相关约束；其展示文案同时作为图中文字与下载文件名 */
const targetSizeMb = ref(1)
/** 纯色 / 渐变（过渡色） */
const bgMode = ref<'solid' | 'gradient'>('solid')
const bgColor1 = ref('#ffffff')
const bgColor2 = ref('#e0e7ff')
const gradientDir = ref<GradientDir>('vertical')
const outputFormat = ref<OutputFormat>('png')
const generating = ref(false)
const previewUrl = ref<string | null>(null)
const lastBlob = ref<Blob | null>(null)
/** 本次生成结果的实际像素与体积（与当前表单可能不一致时仍以该为准） */
const generatedMeta = ref<{
  w: number
  h: number
  bytes: number
  /** 启用体积目标时的上限（字节） */
  targetBytes?: number
  /** 生成时使用的目标 MB，用于下载文件名 */
  targetMb: number
} | null>(null)
/** 预览区内 img 元素当前 CSS 显示宽高 */
const previewDisplaySize = ref<{ w: number; h: number } | null>(null)

const hasOutput = computed(() => !!previewUrl.value && !!lastBlob.value)

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10_240 ? 1 : 0)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/** 与「目标文件大小（MB）」参数对应的展示文案，用于画布与文件名 */
function targetMbAsLabel(mb: number): string {
  const n = Number(mb)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1) {
    return n % 1 === 0 ? `${Math.round(n)} MB` : `${Number(n.toFixed(2))} MB`
  }
  return `${Number(n.toFixed(3))} MB`
}

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  lastBlob.value = null
  generatedMeta.value = null
  previewDisplaySize.value = null
}

function onPreviewImgLoad(e: Event) {
  const el = e.target as HTMLImageElement
  previewDisplaySize.value = { w: el.clientWidth, h: el.clientHeight }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function parseColorToRgb(s: string): { r: number; g: number; b: number } | null {
  const t = s.trim()
  const hex6 = /^#?([0-9a-f]{6})$/i.exec(t)
  if (hex6) {
    const n = parseInt(hex6[1], 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const hex8 = /^#?([0-9a-f]{8})$/i.exec(t)
  if (hex8) {
    const n = parseInt(hex8[1], 16)
    return { r: (n >> 24) & 255, g: (n >> 16) & 255, b: (n >> 8) & 255 }
  }
  const rgba = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(t)
  if (rgba) {
    return { r: +rgba[1], g: +rgba[2], b: +rgba[3] }
  }
  return null
}

/** 根据背景亮度自动选择深/浅标题色 */
function contrastTextColor(bg: BgSettings): string {
  const a = parseColorToRgb(bg.color1)
  const b = parseColorToRgb(bg.color2)
  if (!a) return '#0f172a'
  if (bg.solid || !b || bg.color1.toLowerCase() === bg.color2.toLowerCase()) {
    const l = (0.299 * a.r + 0.587 * a.g + 0.114 * a.b) / 255
    return l > 0.55 ? '#0f172a' : '#f8fafc'
  }
  const ar = (a.r + b.r) / 2
  const ag = (a.g + b.g) / 2
  const ab = (a.b + b.b) / 2
  const l = (0.299 * ar + 0.587 * ag + 0.114 * ab) / 255
  return l > 0.55 ? '#0f172a' : '#f8fafc'
}

function fillBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: BgSettings,
) {
  const c1 = bg.color1 || '#ffffff'
  const c2 = bg.color2 || c1
  if (bg.solid || c1.toLowerCase() === c2.toLowerCase()) {
    ctx.fillStyle = c1
    ctx.fillRect(0, 0, w, h)
    return
  }
  let g: CanvasGradient
  if (bg.dir === 'horizontal') {
    g = ctx.createLinearGradient(0, 0, w, 0)
  } else if (bg.dir === 'vertical') {
    g = ctx.createLinearGradient(0, 0, 0, h)
  } else {
    g = ctx.createLinearGradient(0, 0, w, h)
  }
  g.addColorStop(0, c1)
  g.addColorStop(1, c2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function snapshotBg(): BgSettings {
  return {
    solid: bgMode.value === 'solid',
    color1: bgColor1.value,
    color2: bgColor2.value,
    dir: gradientDir.value,
  }
}

/** 浅色网格纹理，增加高频细节以便有损编码抬高体积 */
function drawFineGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const step = 28
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.12)'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath()
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(w, y + 0.5)
    ctx.stroke()
  }
}

/**
 * 背景（纯色或渐变）+ 可选噪声层 + 细网格 + 居中标题。
 * 噪声与网格用于在「不超过上限」前提下抬高编码后体积，逼近目标。
 */
function renderContent(
  w: number,
  h: number,
  centerText: string,
  noiseAmp: number,
  bg: BgSettings,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')
  fillBackground(ctx, w, h, bg)

  if (noiseAmp > 0) {
    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const px = i >> 2
      const x = px % w
      const y = (px / w) | 0
      // 确定性伪噪声：同一 noiseAmp 可复现，便于二分搜索且省去随机开销
      const t =
        Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + noiseAmp * 31.4159) * 43758.5453
      const n = (t - Math.floor(t) - 0.5) * 2 * noiseAmp
      d[i] = clamp(d[i] + n, 0, 255)
      d[i + 1] = clamp(d[i + 1] + n, 0, 255)
      d[i + 2] = clamp(d[i + 2] + n, 0, 255)
    }
    ctx.putImageData(img, 0, 0)
  }

  drawFineGrid(ctx, w, h)
  drawTitleOnCanvas(ctx, w, h, centerText, contrastTextColor(bg))
  return canvas
}

function blobFromCanvas(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error('导出失败'))
        else resolve(b)
      },
      mime,
      quality,
    )
  })
}

function drawTitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  text: string,
  fillStyle = '#1e293b',
) {
  const t = text.trim()
  if (!t) return

  let fontSize = Math.max(14, Math.min(cw, ch) * 0.08)
  fontSize = Math.min(fontSize, 96)
  const maxW = cw * 0.88
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fillStyle

  for (let i = 0; i < 24 && fontSize >= 10; i++) {
    ctx.font = `600 ${fontSize}px system-ui, "Segoe UI", "Microsoft YaHei", sans-serif`
    if (ctx.measureText(t).width <= maxW) break
    fontSize *= 0.9
  }
  ctx.fillText(t, cw / 2, ch / 2)
}

function downloadFileBase(w: number, h: number, mb: number): string {
  const label = targetMbAsLabel(mb)
  if (!label) return `generated-${w}x${h}`
  const safe = label.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '')
  const cut = safe.slice(0, 120)
  return cut || `generated-${w}x${h}`
}

const MIN_FIT_SIDE = 16
const MAX_SIDE = 8192
/** 达到「已逼近目标」的最低比例（不超过上限前提下） */
const TARGET_FILL_RATIO = 0.88
/** 质量二分次数（原 22 次 toBlob 过多） */
const Q_SEARCH_STEPS = 12
/** 噪声幅度二分上界 */
const NOISE_MAX = 220
/** 噪声二分次数（替代线性 0..220 step4 约 56 次） */
const NOISE_SEARCH_STEPS = 14

/** 有损：在不超过 maxBytes 下取尽量高质量；PNG 仅检查整图体积 */
async function bestBlobUnderMax(
  canvas: HTMLCanvasElement,
  mime: string,
  fmt: OutputFormat,
  maxBytes: number,
): Promise<Blob | null> {
  if (fmt === 'png') {
    const b = await blobFromCanvas(canvas, mime)
    return b.size <= maxBytes ? b : null
  }
  let b = await blobFromCanvas(canvas, mime, 1)
  if (b.size <= maxBytes) return b
  let lo = 0.05
  let hi = 1
  let best: Blob | null = null
  for (let i = 0; i < Q_SEARCH_STEPS; i++) {
    const q = (lo + hi) / 2
    b = await blobFromCanvas(canvas, mime, q)
    if (b.size <= maxBytes) {
      best = b
      lo = q
    } else {
      hi = q
    }
  }
  return best
}

/** 无噪声时若仍超上限，则缩小画布直至可编码进上限 */
async function shrinkUntilFits(
  w0: number,
  h0: number,
  centerText: string,
  fmt: OutputFormat,
  maxBytes: number,
  bg: BgSettings,
): Promise<{ w: number; h: number }> {
  const mime = mimeForFormat(fmt)
  let w = w0
  let h = h0
  for (let i = 0; i < 24; i++) {
    const canvas = renderContent(w, h, centerText, 0, bg)
    const blob = await bestBlobUnderMax(canvas, mime, fmt, maxBytes)
    if (blob) return { w, h }
    if (Math.min(w, h) <= MIN_FIT_SIDE) {
      throw new Error(
        '目标体积过小，无法容纳基础画面与文字，请提高目标文件大小（MB）。',
      )
    }
    w = Math.max(MIN_FIT_SIDE, Math.floor(w * 0.88))
    h = Math.max(MIN_FIT_SIDE, Math.floor(h * 0.88))
  }
  throw new Error('无法在目标体积内完成基础布局，请提高目标或改用 JPEG/WebP。')
}

/**
 * 在不超过 maxBytes 前提下，通过噪声 + 网格 + 必要时放大画布，使体积尽量逼近目标。
 */
async function generateWithSizeBudget(
  baseW: number,
  baseH: number,
  fmt: OutputFormat,
  maxBytes: number,
  centerText: string,
  bg: BgSettings,
): Promise<{ blob: Blob; w: number; h: number }> {
  const mime = mimeForFormat(fmt)

  let { w, h } = await shrinkUntilFits(baseW, baseH, centerText, fmt, maxBytes, bg)

  let lastBest: Blob | null = null

  /**
   * 在固定宽高下，对噪声幅度二分：噪声越大体积通常越大，找仍不超上限的最大可行区间。
   */
  async function bestBlobAtCurrentSize(): Promise<Blob | null> {
    let lo = 0
    let hi = NOISE_MAX
    let bestBlob: Blob | null = null
    for (let i = 0; i < NOISE_SEARCH_STEPS; i++) {
      const mid = (lo + hi) / 2
      const canvas = renderContent(w, h, centerText, mid, bg)
      const blob = await bestBlobUnderMax(canvas, mime, fmt, maxBytes)
      if (!blob) {
        hi = mid
        continue
      }
      bestBlob = blob
      if (blob.size >= maxBytes * TARGET_FILL_RATIO) {
        return blob
      }
      lo = mid
    }
    const canvas = renderContent(w, h, centerText, lo, bg)
    const finalBlob = await bestBlobUnderMax(canvas, mime, fmt, maxBytes)
    return finalBlob ?? bestBlob
  }

  for (let round = 0; round < 18; round++) {
    const bestBlob = await bestBlobAtCurrentSize()
    if (bestBlob) lastBest = bestBlob

    if (bestBlob && bestBlob.size >= maxBytes * TARGET_FILL_RATIO) {
      return { blob: bestBlob, w, h }
    }

    const nw = Math.min(MAX_SIDE, Math.floor(w * 1.08))
    const nh = Math.min(MAX_SIDE, Math.floor(h * 1.08))
    if (nw <= w || nh <= h) {
      if (lastBest) return { blob: lastBest, w, h }
      throw new Error('无法继续放大画布以逼近目标体积。')
    }

    const probe = renderContent(nw, nh, centerText, 0, bg)
    const probeBlob = await bestBlobUnderMax(probe, mime, fmt, maxBytes)
    if (!probeBlob) {
      if (lastBest) return { blob: lastBest, w, h }
      throw new Error('画布放大后无法压回目标体积，请略提高目标上限。')
    }

    w = nw
    h = nh
  }

  if (lastBest) return { blob: lastBest, w, h }
  throw new Error('生成失败，请调整目标文件大小或格式。')
}

async function generateImage() {
  const mb = targetSizeMb.value
  if (!Number.isFinite(mb) || mb <= 0) {
    ElMessage.warning('请填写大于 0 的目标文件大小（MB）。')
    return
  }
  const maxBytes = Math.min(Math.floor(mb * 1024 * 1024), Number.MAX_SAFE_INTEGER)
  if (maxBytes < 1) {
    ElMessage.warning('目标文件过小，请增大 MB 数值。')
    return
  }

  generating.value = true
  try {
    const fmt = outputFormat.value
    const label = targetMbAsLabel(mb)
    const bg = snapshotBg()
    const { blob, w, h } = await generateWithSizeBudget(
      START_W,
      START_H,
      fmt,
      maxBytes,
      label,
      bg,
    )
    revokePreview()
    lastBlob.value = blob
    previewUrl.value = URL.createObjectURL(blob)
    generatedMeta.value = {
      w,
      h,
      bytes: blob.size,
      targetBytes: maxBytes,
      targetMb: mb,
    }
    const ratio = blob.size / maxBytes
    ElMessage.success(
      ratio >= TARGET_FILL_RATIO
        ? `已生成 ${w}×${h}，${formatBytes(blob.size)}（目标上限 ${formatBytes(maxBytes)}，已逼近目标体积）。`
        : `已生成 ${w}×${h}，${formatBytes(blob.size)}（目标上限 ${formatBytes(maxBytes)}，已尽力逼近）。`,
    )
  } catch (e) {
    console.error(e)
    ElMessage.error(e instanceof Error ? e.message : '生成失败，请尝试调整参数。')
  } finally {
    generating.value = false
  }
}

function downloadImage() {
  if (!previewUrl.value || !lastBlob.value || !generatedMeta.value) return
  const w = generatedMeta.value.w
  const h = generatedMeta.value.h
  const ext = downloadExtForFormat(outputFormat.value)
  const a = document.createElement('a')
  a.href = previewUrl.value
  a.download = `${downloadFileBase(w, h, generatedMeta.value.targetMb)}.${ext}`
  a.click()
}

onBeforeUnmount(() => {
  revokePreview()
})
</script>

<template>
  <div class="img-gen">
    <header class="img-gen__head">
      <el-breadcrumb class="img-gen__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-img' } }">
          图片工具
        </el-breadcrumb-item>
        <el-breadcrumb-item>图片生成</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="img-gen__intro-card">
        <p class="img-gen__intro-desc">
          根据「目标文件大小（MB）」、背景色（支持纯色或双色渐变）与导出格式在本地生成图片：结果不超过该体积，并自动叠加轻微噪声与网格纹理、必要时放大画布以逼近目标。目标体积文案居中绘制并作为下载默认文件名；实际像素在生成后展示。不上传服务器。
        </p>
      </div>
    </header>

    <section class="img-gen__panel">
      <div class="img-gen__row">
        <div class="img-gen__form">
          <p class="img-gen__section-title">参数</p>
          <div class="img-gen__fields">
            <div class="img-gen__top-row">
              <div class="img-gen__field img-gen__field--top-size">
                <span class="img-gen__label">目标文件大小（MB）</span>
                <el-input-number
                  v-model="targetSizeMb"
                  :min="0.001"
                  :max="512"
                  :step="0.1"
                  :precision="3"
                  controls-position="right"
                  class="img-gen__num img-gen__num--wide"
                />
              </div>
              <div class="img-gen__field img-gen__field--top-format">
                <span class="img-gen__label">图片格式</span>
                <el-radio-group v-model="outputFormat" class="img-gen__format-row">
                  <el-radio-button label="png">PNG</el-radio-button>
                  <el-radio-button label="jpg">JPG</el-radio-button>
                  <el-radio-button label="jpeg">JPEG</el-radio-button>
                  <el-radio-button label="webp">WEBP</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            <p class="img-gen__field-hint">
              输出不超过该上限；算法会通过噪声、网格与放大画布等方式抬高体积以逼近目标。像素从 1920×1080 起算，可增减。图中文字与下载文件名复用该数值展示（如 1 MB）。
            </p>
            <div class="img-gen__field img-gen__field--full">
              <span class="img-gen__label">背景颜色</span>
              <el-radio-group v-model="bgMode" class="img-gen__radios">
                <el-radio-button label="solid">纯色</el-radio-button>
                <el-radio-button label="gradient">渐变（过渡色）</el-radio-button>
              </el-radio-group>
              <div class="img-gen__bg-row">
                <div class="img-gen__bg-pick">
                  <span class="img-gen__bg-sublabel">{{ bgMode === 'solid' ? '颜色' : '起始色' }}</span>
                  <el-color-picker v-model="bgColor1" show-alpha />
                </div>
                <div v-if="bgMode === 'gradient'" class="img-gen__bg-pick">
                  <span class="img-gen__bg-sublabel">结束色</span>
                  <el-color-picker v-model="bgColor2" show-alpha />
                </div>
              </div>
              <div v-if="bgMode === 'gradient'" class="img-gen__bg-dir">
                <span class="img-gen__bg-sublabel">渐变方向</span>
                <el-radio-group v-model="gradientDir" size="small">
                  <el-radio-button label="horizontal">左右</el-radio-button>
                  <el-radio-button label="vertical">上下</el-radio-button>
                  <el-radio-button label="diagonal">对角</el-radio-button>
                </el-radio-group>
              </div>
              <div
                v-if="bgMode === 'gradient'"
                class="img-gen__bg-preview"
                :style="{
                  background:
                    gradientDir === 'horizontal'
                      ? `linear-gradient(90deg, ${bgColor1}, ${bgColor2})`
                      : gradientDir === 'vertical'
                        ? `linear-gradient(180deg, ${bgColor1}, ${bgColor2})`
                        : `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`,
                }"
              />
              <p class="img-gen__field-hint">
                渐变时由起始色过渡到结束色；标题颜色会随背景亮度自动反色以便阅读。
              </p>
            </div>
          </div>
          <p class="img-gen__hint">目标体积过大时浏览器可能卡顿；建议单次不超过约 50 MB。</p>
          <div class="img-gen__actions">
            <el-button type="primary" :loading="generating" @click="generateImage">生成图片</el-button>
            <el-button type="success" plain :disabled="!hasOutput" @click="downloadImage">下载</el-button>
          </div>
        </div>

        <div class="img-gen__preview-wrap">
          <p class="img-gen__section-title">预览</p>
          <div v-if="generatedMeta" class="img-gen__size-bar">
            <span class="img-gen__size-item">
              <span class="img-gen__size-k">实际尺寸</span>
              {{ generatedMeta.w }} × {{ generatedMeta.h }} px
            </span>
            <span class="img-gen__size-item">
              <span class="img-gen__size-k">文件大小</span>
              {{ formatBytes(generatedMeta.bytes) }}
              <template v-if="generatedMeta.targetBytes != null">
                <span class="img-gen__size-tip">
                  （目标上限 {{ formatBytes(generatedMeta.targetBytes) }}）
                </span>
              </template>
            </span>
            <span v-if="previewDisplaySize" class="img-gen__size-item">
              <span class="img-gen__size-k">预览显示</span>
              {{ previewDisplaySize.w }} × {{ previewDisplaySize.h }} px
              <span class="img-gen__size-tip">（区域内缩放，下载为实际像素）</span>
            </span>
          </div>
          <div class="img-gen__preview-box">
            <img
              v-if="previewUrl"
              class="img-gen__preview-img"
              :src="previewUrl"
              alt="生成预览"
              @load="onPreviewImgLoad"
            />
            <div v-else class="img-gen__preview-empty">点击「生成图片」后在此预览</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.img-gen {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.img-gen__head {
  margin-bottom: 4px;
}
.img-gen__crumb {
  font-size: 13px;
}
.img-gen__intro-card {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}
.img-gen__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}
.img-gen__panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
}
.img-gen__row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-start;
}
.img-gen__form {
  flex: 1 1 280px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.img-gen__preview-wrap {
  flex: 1 1 320px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.img-gen__size-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--uu-text);
  line-height: 1.5;
}
.img-gen__size-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
}
.img-gen__size-k {
  font-weight: 600;
  color: var(--uu-text-secondary);
  flex: 0 0 auto;
}
.img-gen__size-tip {
  font-size: 12px;
  color: var(--uu-text-secondary);
  font-weight: normal;
}
.img-gen__section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
}
.img-gen__fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.img-gen__top-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.img-gen__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.img-gen__field--top-size {
  flex: 1 1 280px;
  min-width: 220px;
}
.img-gen__field--top-format {
  flex: 1 1 360px;
  min-width: 280px;
}
.img-gen__field--full {
  width: 100%;
}
.img-gen__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--uu-text);
}
.img-gen__num {
  width: 100%;
  max-width: 200px;
}
.img-gen__num--wide {
  max-width: 280px;
}
.img-gen__field-hint {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
  line-height: 1.45;
}
.img-gen__radios {
  flex-wrap: wrap;
}
.img-gen__format-row {
  flex-wrap: wrap;
}
.img-gen__bg-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}
.img-gen__bg-pick {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.img-gen__bg-sublabel {
  font-size: 12px;
  color: var(--uu-text-secondary);
}
.img-gen__bg-dir {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.img-gen__bg-preview {
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}
.img-gen__hint {
  margin: 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
  line-height: 1.5;
}
.img-gen__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.img-gen__preview-box {
  min-height: 280px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: auto;
}
.img-gen__preview-img {
  max-width: 100%;
  max-height: 420px;
  width: auto;
  height: auto;
  display: block;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  border-radius: 4px;
}
.img-gen__preview-empty {
  font-size: 13px;
  color: var(--uu-text-secondary);
  text-align: center;
  padding: 24px;
}
</style>
