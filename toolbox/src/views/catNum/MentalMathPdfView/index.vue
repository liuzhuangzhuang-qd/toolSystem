<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PDFDocument, PDFPage, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

type Op = '+' | '-' | '*' | '/'

const selectedOps = ref<Op[]>(['+', '-', '*', '/'])
const questionCount = ref(50)
const maxValue = ref(100)
const setCount = ref(1)
const generating = ref(false)
const CHINESE_FONT_URL = '/fonts/NotoSansCJKsc-Regular.otf'
let chineseFontBytesPromise: Promise<ArrayBuffer> | null = null

function getChineseFontBytes(): Promise<ArrayBuffer> {
  if (!chineseFontBytesPromise) {
    chineseFontBytesPromise = fetch(CHINESE_FONT_URL).then(async (res) => {
      if (!res.ok) throw new Error('字体文件加载失败')
      return res.arrayBuffer()
    })
  }
  return chineseFontBytesPromise
}

function randInt(min: number, max: number): number {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}

function pickOne<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function makeQuestion(op: Op, max: number): string {
  if (op === '+') {
    const a = randInt(0, max)
    const b = randInt(0, max)
    return `${a} + ${b} = ______`
  }
  if (op === '-') {
    const a = randInt(0, max)
    const b = randInt(0, a)
    return `${a} - ${b} = ______`
  }
  if (op === '*') {
    const a = randInt(0, max)
    const b = randInt(0, max)
    return `${a} * ${b} = ______`
  }
  const b = randInt(1, Math.max(1, max))
  const q = randInt(0, Math.floor(max / b))
  const a = b * q
  return `${a} / ${b} = ______`
}

function validateInput(): boolean {
  if (!selectedOps.value.length) {
    ElMessage.warning('请至少选择一种运算符。')
    return false
  }
  if (!Number.isFinite(questionCount.value) || questionCount.value < 1) {
    ElMessage.warning('题目数量需大于等于 1。')
    return false
  }
  if (questionCount.value > 100) {
    ElMessage.warning('题目数量最大为 100。')
    return false
  }
  if (!Number.isFinite(setCount.value) || setCount.value < 1) {
    ElMessage.warning('生成套数需大于等于 1。')
    return false
  }
  if (setCount.value > 10) {
    ElMessage.warning('生成套数最大为 10。')
    return false
  }
  if (!Number.isFinite(maxValue.value) || maxValue.value < 1) {
    ElMessage.warning('最大数值需大于等于 1。')
    return false
  }
  return true
}

async function generatePdf() {
  if (generating.value) return
  if (!validateInput()) return

  generating.value = true
  try {
    const count = Math.floor(questionCount.value)
    const max = Math.floor(maxValue.value)
    const totalSets = Math.floor(setCount.value)
    const ops = selectedOps.value

    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit)
    const fontBytes = await getChineseFontBytes()
    // CJK 字体在部分环境下子集化会出现中文不显示，改为完整嵌入确保稳定出字。
    const font = await pdf.embedFont(fontBytes, { subset: false })

    const pageWidth = 595.28
    const pageHeight = 841.89
    const marginX = 30
    const marginBottom = 42
    const titleY = pageHeight - 56
    const infoY = pageHeight - 82
    const gridTop = pageHeight - 114
    const columns = count > 40 ? 4 : 3
    const rowsPerPage = Math.max(1, Math.ceil(count / columns))
    const colGap = 6
    const rowGap = 6
    const colWidth = (pageWidth - marginX * 2 - colGap * (columns - 1)) / columns
    const usableHeight = gridTop - marginBottom
    const cellHeight = (usableHeight - rowGap * (rowsPerPage - 1)) / rowsPerPage
    const perPage = count

    const lineColor = rgb(0.96, 0.96, 0.96)
    const textColor = rgb(0.22, 0.27, 0.33)
    const subColor = rgb(0.4, 0.43, 0.47)

    function drawInfoLine(page: PDFPage, x: number, y: number, label: string, width: number) {
      page.drawText(label, { x, y: y + 2, size: 10, font, color: subColor })
      const lineStart = x + 36
      page.drawLine({
        start: { x: lineStart, y },
        end: { x: x + width, y },
        thickness: 0.6,
        color: lineColor,
      })
    }

    for (let setIndex = 0; setIndex < totalSets; setIndex += 1) {
      const questions = Array.from({ length: count }, () => makeQuestion(pickOne(ops), max))
      const page = pdf.addPage([pageWidth, pageHeight])
      const title = totalSets > 1 ? `口算练习题（第 ${setIndex + 1} 套）` : '口算练习题'
      const titleWidth = font.widthOfTextAtSize(title, 20)
      page.drawText(title, {
        x: (pageWidth - titleWidth) / 2,
        y: titleY,
        size: 20,
        font,
        color: textColor,
      })

      const fieldY = infoY
      const fieldWidth = (pageWidth - marginX * 2 - 18) / 4
      drawInfoLine(page, marginX, fieldY, '姓名:', fieldWidth)
      drawInfoLine(page, marginX + fieldWidth + 6, fieldY, '班级:', fieldWidth)
      drawInfoLine(page, marginX + (fieldWidth + 6) * 2, fieldY, '日期:', fieldWidth)
      drawInfoLine(page, marginX + (fieldWidth + 6) * 3, fieldY, '用时:', fieldWidth)

      for (let i = 0; i < perPage; i += 1) {
        const row = Math.floor(i / columns)
        const col = i % columns
        const x = marginX + col * (colWidth + colGap)
        const yTop = gridTop - row * (cellHeight + rowGap)
        const yBottom = yTop - cellHeight

        page.drawRectangle({
          x,
          y: yBottom,
          width: colWidth,
          height: cellHeight,
          borderColor: lineColor,
          borderWidth: 0.6,
        })

        const raw = questions[i].replace(/\*/g, '×').replace(/\//g, '÷').replace(/_/g, ' ')
        const tSize = 13
        const textWidth = font.widthOfTextAtSize(raw, tSize)
        page.drawText(raw, {
          x: x + (colWidth - textWidth) / 2,
          y: yBottom + (cellHeight - tSize) / 2 + 2,
          size: tSize,
          font,
          color: textColor,
        })
      }
    }

    const bytes = await pdf.save()
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mental-math-${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`已生成 ${totalSets} 套口算题（每套 ${count} 题）并开始下载。`)
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('字体文件')) ElMessage.error('中文字体加载失败，请刷新后重试。')
    else ElMessage.error('生成 PDF 失败，请稍后重试。')
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="mental-math">
    <header class="mental-math__head">
      <el-breadcrumb class="mental-math__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-num' } }">数字工具</el-breadcrumb-item>
        <el-breadcrumb-item>口算题生成</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="mental-math__intro-card">
        <p class="mental-math__intro-desc">
          按运算类型、题目数量和最大数值生成口算练习题，自动分页导出 PDF 下载。
        </p>
      </div>
    </header>

    <section class="mental-math__panel">
      <el-form label-width="100px" label-position="right">
        <el-form-item label="运算类型">
          <el-checkbox-group v-model="selectedOps">
            <el-checkbox label="+">加法</el-checkbox>
            <el-checkbox label="-">减法</el-checkbox>
            <el-checkbox label="*">乘法</el-checkbox>
            <el-checkbox label="/">除法</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="题目数量">
          <el-input-number v-model="questionCount" :min="1" :max="100" :step="1" />
        </el-form-item>

        <el-form-item label="生成套数">
          <el-input-number v-model="setCount" :min="1" :max="10" :step="1" />
        </el-form-item>

        <el-form-item label="最大数值">
          <el-input-number v-model="maxValue" :min="1" :max="100000" :step="1" />
        </el-form-item>
      </el-form>

      <div class="mental-math__actions">
        <el-button type="primary" :loading="generating" @click="generatePdf">生成并下载 PDF</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mental-math { display: flex; flex-direction: column; gap: 16px; }
.mental-math__head { margin-bottom: 4px; }
.mental-math__crumb { font-size: 13px; }
.mental-math__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.mental-math__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.mental-math__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.mental-math__actions { display: flex; justify-content: flex-end; }
</style>
