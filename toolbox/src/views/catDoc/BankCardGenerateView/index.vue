<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

type Gender = '' | 'male' | 'female'
type CardKind = '' | 'debit' | 'credit'
type BankCode = '' | 'icbc' | 'abc' | 'ccb' | 'boc' | 'cmb'
type CardRecord = { name: string; bank: string; cardType: string; cardNo: string }

const records = ref<CardRecord[]>([])
const generating = ref(false)
const DEFAULT_COUNT = 5
const COLS_PER_ROW = 5

const nameInput = ref('')
const gender = ref<Gender>('')
const bank = ref<BankCode>('')
const cardKind = ref<CardKind>('')
const countInput = ref<number>(DEFAULT_COUNT)

const familyNames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '蒋', '沈', '韩', '杨']
const maleGiven = ['伟', '强', '磊', '军', '洋', '勇', '杰', '涛', '超', '宇']
const femaleGiven = ['芳', '娜', '敏', '静', '丽', '艳', '琳', '雪', '婷', '慧']
const neutralGiven = ['明', '晨', '宁', '可', '安', '一', '子', '凡']

const BANK_META: Record<Exclude<BankCode, ''>, { name: string; debitBins: string[]; creditBins: string[] }> = {
  icbc: { name: '工商银行', debitBins: ['622200', '622202'], creditBins: ['622230', '622231'] },
  abc: { name: '农业银行', debitBins: ['622848', '622845'], creditBins: ['622836', '622837'] },
  ccb: { name: '建设银行', debitBins: ['621700', '436742'], creditBins: ['622280', '622281'] },
  boc: { name: '中国银行', debitBins: ['621661', '621660'], creditBins: ['622760', '622761'] },
  cmb: { name: '招商银行', debitBins: ['621483', '622588'], creditBins: ['622575', '622576'] },
}

const allBanks = Object.keys(BANK_META) as Array<Exclude<BankCode, ''>>

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const cardRows = computed(() => chunkArray(records.value, COLS_PER_ROW))
const totalCount = computed(() => records.value.length)
const copyText = computed(() =>
  records.value.map((r) => `${r.name}\t${r.bank}\t${r.cardType}\t${r.cardNo}`).join('\n'),
)

function randomInt(min: number, max: number): number {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  const range = hi - lo + 1
  if (range <= 0) return lo
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return lo + (buf[0] % range)
  }
  return lo + Math.floor(Math.random() * range)
}

function pickName(): string {
  const manual = nameInput.value.trim()
  if (manual) return manual
  const family = familyNames[randomInt(0, familyNames.length - 1)]
  let pool = neutralGiven
  if (gender.value === 'male') pool = maleGiven
  else if (gender.value === 'female') pool = femaleGiven
  const g1 = pool[randomInt(0, pool.length - 1)]
  const g2 = randomInt(0, 1) ? pool[randomInt(0, pool.length - 1)] : ''
  return `${family}${g1}${g2}`
}

function pickBankCode(): Exclude<BankCode, ''> {
  if (bank.value) return bank.value
  return allBanks[randomInt(0, allBanks.length - 1)]
}

function pickCardKind(): Exclude<CardKind, ''> {
  if (cardKind.value) return cardKind.value
  return randomInt(0, 1) === 0 ? 'debit' : 'credit'
}

function computeLuhnCheckDigit(partial: string): string {
  let sum = 0
  let shouldDouble = true
  for (let i = partial.length - 1; i >= 0; i--) {
    let n = partial.charCodeAt(i) - 48
    if (shouldDouble) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    shouldDouble = !shouldDouble
  }
  const mod = sum % 10
  return String((10 - mod) % 10)
}

function pickBin(bankCode: Exclude<BankCode, ''>, kind: Exclude<CardKind, ''>): string {
  const meta = BANK_META[bankCode]
  const bins = kind === 'debit' ? meta.debitBins : meta.creditBins
  return bins[randomInt(0, bins.length - 1)]
}

function buildCardNumber(bankCode: Exclude<BankCode, ''>, kind: Exclude<CardKind, ''>): string {
  const targetLen = kind === 'debit' ? 19 : 16
  const bin = pickBin(bankCode, kind)
  const bodyLen = targetLen - 1 - bin.length
  let partial = bin
  for (let i = 0; i < bodyLen; i++) partial += String(randomInt(0, 9))
  return partial + computeLuhnCheckDigit(partial)
}

function generateOne(): CardRecord {
  const bankCode = pickBankCode()
  const kind = pickCardKind()
  const cardNo = buildCardNumber(bankCode, kind)
  return {
    name: pickName(),
    bank: BANK_META[bankCode].name,
    cardType: kind === 'debit' ? '借记卡' : '信用卡',
    cardNo,
  }
}

function generateMany(count: number) {
  if (generating.value) return
  const safeCount = Math.max(1, Math.min(50, Number.isFinite(count) ? count : DEFAULT_COUNT))

  generating.value = true
  try {
    const set = new Set<string>()
    const list: CardRecord[] = []
    let attempts = 0
    const maxAttempts = safeCount * 80
    while (list.length < safeCount && attempts < maxAttempts) {
      const one = generateOne()
      if (!set.has(one.cardNo)) {
        set.add(one.cardNo)
        list.push(one)
      }
      attempts++
    }
    records.value = list
    ElMessage.success(`已生成 ${list.length} 条银行卡数据。`)
  } finally {
    generating.value = false
  }
}

async function copyAll() {
  if (!copyText.value.trim()) {
    ElMessage.info('暂无可复制内容。')
    return
  }
  try {
    await navigator.clipboard.writeText(copyText.value)
    ElMessage.success('已复制到剪贴板。')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = copyText.value
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

onMounted(() => {
  generateMany(DEFAULT_COUNT)
})
</script>

<template>
  <div class="bank-card-page">
    <header class="bank-card-page__head">
      <el-breadcrumb class="bank-card-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-doc' } }">证件工具</el-breadcrumb-item>
        <el-breadcrumb-item>银行卡生成</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="bank-card-page__intro">
        <p class="bank-card-page__intro-desc">
          支持按银行、卡种、性别、姓名与数量生成；参数不填时自动随机生成。
        </p>
      </div>
    </header>

    <section class="bank-card-page__panel">
      <div class="bank-card-config">
        <el-form label-width="90px" label-position="right">
          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="银行">
                <el-select v-model="bank" clearable placeholder="不填则随机" style="width: 100%">
                  <el-option label="工商银行" value="icbc" />
                  <el-option label="农业银行" value="abc" />
                  <el-option label="建设银行" value="ccb" />
                  <el-option label="中国银行" value="boc" />
                  <el-option label="招商银行" value="cmb" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="卡种">
                <el-select v-model="cardKind" clearable placeholder="不填则随机" style="width: 100%">
                  <el-option label="借记卡" value="debit" />
                  <el-option label="信用卡" value="credit" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="性别">
                <el-select v-model="gender" clearable placeholder="不填则随机" style="width: 100%">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="姓名">
                <el-input v-model="nameInput" clearable placeholder="不填则随机姓名" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="生成数量">
                <el-input-number v-model="countInput" :min="1" :max="50" :step="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="bank-card-page__toolbar">
        <el-button type="primary" :loading="generating" @click="generateMany(countInput || DEFAULT_COUNT)">重新生成</el-button>
        <el-button plain type="success" :disabled="!records.length" @click="copyAll">复制全部</el-button>
      </div>

      <div v-if="records.length" class="bank-card-table-wrap">
        <table class="bank-card-table" role="table" aria-label="银行卡列表">
          <tbody>
            <tr v-for="(row, r) in cardRows" :key="r">
              <td v-for="(item, c) in row" :key="c" class="bank-card-table__cell">
                <p class="bank-card-table__name">{{ item.name }}</p>
                <p class="bank-card-table__meta">{{ item.bank }} · {{ item.cardType }}</p>
                <div class="bank-card-table__value">{{ item.cardNo }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="bank-card-page__count">共 {{ totalCount }} 个</p>
      </div>

      <p v-else class="bank-card-page__tip">暂无数据</p>
      <p class="bank-card-page__tip">说明：卡号按 Luhn 算法计算校验位，仅用于测试/演示，不对应真实账户。</p>
    </section>
  </div>
</template>

<style scoped>
.bank-card-page { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.bank-card-page__head { margin-bottom: 4px; }
.bank-card-page__crumb { font-size: 13px; }
.bank-card-page__intro { margin-top: 18px; padding: 18px 20px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.bank-card-page__intro-desc { margin: 0; font-size: 14px; color: var(--uu-text-secondary); }
.bank-card-page__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.bank-card-config { border: 1px solid var(--el-border-color-lighter); border-radius: 12px; padding: 14px 14px 2px; background: #fafcff; }
.bank-card-page__toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
.bank-card-table-wrap { display: flex; flex-direction: column; gap: 8px; margin-top: 30px; }
.bank-card-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.bank-card-table__cell { border: 1px solid var(--el-border-color-lighter); padding: 10px 8px; text-align: center; vertical-align: middle; }
.bank-card-table__name { margin: 0 0 4px; font-size: 13px; color: var(--uu-text-secondary); }
.bank-card-table__meta { margin: 0 0 6px; font-size: 12px; color: var(--uu-text-secondary); }
.bank-card-table__value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 16px; word-break: break-all; }
.bank-card-page__count { margin: 0; font-size: 13px; color: var(--uu-text-secondary); text-align: right; }
.bank-card-page__tip { margin: 0; font-size: 13px; color: var(--uu-text-secondary); }
</style>
