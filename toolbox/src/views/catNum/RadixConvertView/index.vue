<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type Base = 2 | 8 | 10 | 16

const fromBase = ref<Base>(10)
const toBase = ref<Base>(16)

const inputText = ref('')
const outputText = ref('')
const errorText = ref<string | null>(null)

const acceptBases = computed(() => [2, 8, 10, 16] as Base[])

function digitValue(ch: string): number {
  const code = ch.charCodeAt(0)
  // 0-9
  if (code >= 48 && code <= 57) return code - 48
  // A-F
  if (code >= 65 && code <= 70) return code - 55
  // a-f
  if (code >= 97 && code <= 102) return code - 87
  return -1
}

function parseIntegerToBigInt(s: string, base: Base): bigint {
  const raw = s.trim().replace(/[_\s]/g, '')
  if (!raw) throw new Error('请输入数字内容。')

  let sign = 1n
  let digits = raw
  if (digits.startsWith('-')) {
    sign = -1n
    digits = digits.slice(1)
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1)
  }

  if (!digits) throw new Error('数字格式不正确（缺少有效位）。')

  // 防止 BigInt 的默认解析差异：全部用“位权累乘”方式手动解析。
  let acc = 0n
  const b = BigInt(base)
  for (let i = 0; i < digits.length; i++) {
    const v = digitValue(digits[i])
    if (v < 0 || v >= base) {
      throw new Error(`包含无效字符：${digits[i]}（第 ${i + 1} 位，目标进制为 ${base}）。`)
    }
    acc = acc * b + BigInt(v)
  }
  return sign * acc
}

function bigIntToBaseString(value: bigint, base: Base): string {
  if (value === 0n) return '0'
  const negative = value < 0n
  const abs = negative ? -value : value

  const s = abs.toString(base)
  // 16 进制统一输出大写，便于阅读与和常见工具一致。
  const normalized = base === 16 ? s.toUpperCase() : s
  return negative ? `-${normalized}` : normalized
}

// 执行一次转换并把结果写入页面。
function doConvert() {
  try {
    if (!acceptBases.value.includes(fromBase.value) || !acceptBases.value.includes(toBase.value)) {
      throw new Error('当前不支持的进制选项。')
    }
    const v = parseIntegerToBigInt(inputText.value, fromBase.value)
    outputText.value = bigIntToBaseString(v, toBase.value)
    errorText.value = null
  } catch (e) {
    outputText.value = ''
    errorText.value = e instanceof Error ? e.message : '转换失败，请检查输入。'
  }
}

// 交换源/目标进制；如果已有输出，则把输出作为新的输入继续转换。
function switchBases() {
  const newFrom = toBase.value
  const newTo = fromBase.value
  fromBase.value = newFrom
  toBase.value = newTo

  // 如果当前已有输出，则把输出当作新的输入，符合用户常见预期。
  if (outputText.value) inputText.value = outputText.value
  errorText.value = null
}

// 尝试使用剪贴板复制结果；失败则走 textarea 兜底。
async function copyOutput() {
  if (!outputText.value) {
    ElMessage.info('暂无可复制结果，请先进行转换。')
    return
  }
  const text = outputText.value
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板。')
  } catch {
    // 兼容部分环境：通过临时 textarea 兜底复制。
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
</script>

<template>
  <div class="radix-page">
    <header class="radix-page__head">
      <el-breadcrumb class="radix-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-num' } }">
          数字工具
        </el-breadcrumb-item>
        <el-breadcrumb-item>进制转换</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="radix-page__intro">
        <p class="radix-page__intro-desc">支持大整数、正负号与校验提示（仅支持整数，不处理小数）。</p>
      </div>
    </header>

    <section class="radix-panel">
      <div class="radix-modes">
        <div class="radix-field">
          <p class="radix-field__label">源进制</p>
          <el-radio-group v-model="fromBase">
            <el-radio-button :label="2">2</el-radio-button>
            <el-radio-button :label="8">8</el-radio-button>
            <el-radio-button :label="10">10</el-radio-button>
            <el-radio-button :label="16">16</el-radio-button>
          </el-radio-group>
        </div>

        <div class="radix-field">
          <p class="radix-field__label">目标进制</p>
          <el-radio-group v-model="toBase">
            <el-radio-button :label="2">2</el-radio-button>
            <el-radio-button :label="8">8</el-radio-button>
            <el-radio-button :label="10">10</el-radio-button>
            <el-radio-button :label="16">16</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="radix-split">
        <div class="radix-pane radix-pane--left">
          <div class="radix-input-card__top">
            <div class="radix-input-card__title">
              <p class="radix-field__label radix-label--tight">输入数字（{{ fromBase }} 进制）</p>
            </div>
          </div>

          <el-input
            v-model="inputText"
            placeholder="例如：-1011、FF、12345678901234567890"
            :rows="8"
            type="textarea"
            resize="none"
            class="radix-textarea"
            @keydown.ctrl.enter="doConvert"
          />
        </div>

        <div class="radix-pane radix-pane--right">
          <div class="radix-input-card__top">
            <div class="radix-input-card__title">
              <p class="radix-field__label radix-label--tight">输出结果（{{ toBase }} 进制）</p>
            </div>
          </div>

          <el-input
            v-model="outputText"
            readonly
            type="textarea"
            :rows="8"
            resize="none"
            class="radix-textarea"
          />
        </div>
      </div>

      <p v-if="errorText" class="radix-error">{{ errorText }}</p>
      <p class="radix-aux-tip">
        支持整数；小写/大写 A-F 都支持。允许使用下划线或空格分隔（例如：FF_A0）。按 <b>Ctrl + Enter</b> 可直接开始转换。
      </p>

      <div class="radix-bottom">
        <div class="radix-bottom__left">
          <el-button type="primary" :disabled="!inputText.trim()" @click="doConvert">
            开始转换
          </el-button>
          <el-button plain :disabled="!inputText.trim()" @click="switchBases">
            交换进制
          </el-button>
          <el-button type="success" plain :disabled="!outputText" @click="copyOutput">
            复制结果
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.radix-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.radix-page__head {
  margin-bottom: 4px;
}

.radix-page__crumb {
  font-size: 13px;
}

.radix-page__intro {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.radix-page__intro-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--uu-text);
}

.radix-page__intro-desc {
  margin: 0;
  font-size: 16px;
  color: var(--uu-text-secondary);
  line-height: 1.6;
}

.radix-panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.radix-modes {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.radix-field {
  flex: 1;
  min-width: 260px;
}

.radix-field__label {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--uu-text-secondary);
}

.radix-label--tight {
  margin: 0;
}

.radix-split {
  display: flex;
  gap: 14px;
}

.radix-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radix-error {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-color-danger);
}

.radix-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
}

.radix-input-zone {
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  background: #fafafa;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.radix-input-card__top {
  display: flex;
  gap: 12px;
  align-items: center;
}

.radix-input-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 70, 229, 0.06);
  color: var(--el-color-primary);
  font-size: 20px;
  flex-shrink: 0;
}

.radix-input-card__title {
  min-width: 0;
}

.radix-aux-tip {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--uu-text-secondary);
  line-height: 1.5;
}

.radix-textarea :deep(.el-textarea__inner) {
  border-radius: 12px;
}

.radix-bottom {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.radix-bottom__left {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
}
</style>

