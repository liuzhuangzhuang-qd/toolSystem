<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

type BrandCode = '' | 'vw' | 'toyota' | 'honda' | 'byd' | 'tesla'
type RegionCode = '' | 'cn' | 'jp' | 'us'
type VinRecord = { brand: string; year: number; vin: string }

const records = ref<VinRecord[]>([])
const generating = ref(false)
const DEFAULT_COUNT = 5
const COLS_PER_ROW = 5

const brandInput = ref<BrandCode>('')
const regionInput = ref<RegionCode>('')
const yearInput = ref<number | null>(null)
const plantCodeInput = ref('')
const countInput = ref<number>(DEFAULT_COUNT)

const BRAND_META: Record<Exclude<BrandCode, ''>, { label: string; wmis: Record<Exclude<RegionCode, ''>, string[]> }> = {
  vw: { label: '大众', wmis: { cn: ['LSV', 'LFV'], jp: ['WVW'], us: ['1VW'] } },
  toyota: { label: '丰田', wmis: { cn: ['LTV'], jp: ['JTD'], us: ['4T1'] } },
  honda: { label: '本田', wmis: { cn: ['LHG'], jp: ['JHM'], us: ['1HG'] } },
  byd: { label: '比亚迪', wmis: { cn: ['LGX', 'LC0'], jp: ['LGX'], us: ['LGX'] } },
  tesla: { label: '特斯拉', wmis: { cn: ['LRW'], jp: ['5YJ'], us: ['5YJ'] } },
}

const regionValues: Array<Exclude<RegionCode, ''>> = ['cn', 'jp', 'us']
const brandValues = Object.keys(BRAND_META) as Array<Exclude<BrandCode, ''>>

const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2] as const
const VIN_MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
}

const YEAR_CODE_MAP: Record<number, string> = {
  2001: '1', 2002: '2', 2003: '3', 2004: '4', 2005: '5',
  2006: '6', 2007: '7', 2008: '8', 2009: '9', 2010: 'A',
  2011: 'B', 2012: 'C', 2013: 'D', 2014: 'E', 2015: 'F',
  2016: 'G', 2017: 'H', 2018: 'J', 2019: 'K', 2020: 'L',
  2021: 'M', 2022: 'N', 2023: 'P', 2024: 'R', 2025: 'S',
  2026: 'T', 2027: 'V', 2028: 'W', 2029: 'X', 2030: 'Y',
}

const vinRows = computed(() => {
  const out: VinRecord[][] = []
  for (let i = 0; i < records.value.length; i += COLS_PER_ROW) out.push(records.value.slice(i, i + COLS_PER_ROW))
  return out
})
const totalCount = computed(() => records.value.length)
const copyText = computed(() => records.value.map((r) => `${r.brand}\t${r.year}\t${r.vin}`).join('\n'))

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

function pickFrom<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function sanitizePlantCode(v: string): string {
  const raw = v.trim().toUpperCase()
  if (!raw) return ''
  const c = raw[0]
  if (!/^[A-Z0-9]$/.test(c)) return ''
  if (c === 'I' || c === 'O' || c === 'Q') return ''
  return c
}

function pickBrand(): Exclude<BrandCode, ''> {
  if (brandInput.value) return brandInput.value
  return pickFrom(brandValues)
}

function pickRegion(): Exclude<RegionCode, ''> {
  if (regionInput.value) return regionInput.value
  return pickFrom(regionValues)
}

function pickYear(): number {
  const y = yearInput.value ?? randomInt(2010, 2030)
  if (y < 2001 || y > 2030) return randomInt(2010, 2030)
  return y
}

function randomVinChars(len: number): string {
  let s = ''
  for (let i = 0; i < len; i++) s += VIN_CHARS[randomInt(0, VIN_CHARS.length - 1)]
  return s
}

function calcCheckDigit(vinWithPlaceholder: string): string {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const ch = vinWithPlaceholder[i]
    const val = VIN_MAP[ch]
    sum += val * VIN_WEIGHTS[i]
  }
  const mod = sum % 11
  return mod === 10 ? 'X' : String(mod)
}

function generateOne(): VinRecord {
  const brand = pickBrand()
  const region = pickRegion()
  const year = pickYear()
  const meta = BRAND_META[brand]
  const wmi = pickFrom(meta.wmis[region])
  const vds = randomVinChars(5)
  const yearCode = YEAR_CODE_MAP[year] ?? 'Y'
  const plantCode = sanitizePlantCode(plantCodeInput.value) || LETTERS[randomInt(0, LETTERS.length - 1)]
  const serial = String(randomInt(0, 999999)).padStart(6, '0')
  const withoutCheck = `${wmi}${vds}0${yearCode}${plantCode}${serial}`
  const check = calcCheckDigit(withoutCheck)
  const vin = `${withoutCheck.slice(0, 8)}${check}${withoutCheck.slice(9)}`
  return { brand: meta.label, year, vin }
}

function generateMany(count: number) {
  if (generating.value) return
  const safeCount = Math.max(1, Math.min(50, Number.isFinite(count) ? count : DEFAULT_COUNT))
  generating.value = true
  try {
    const used = new Set<string>()
    const list: VinRecord[] = []
    let attempts = 0
    const maxAttempts = safeCount * 120
    while (list.length < safeCount && attempts < maxAttempts) {
      const one = generateOne()
      if (!used.has(one.vin)) {
        used.add(one.vin)
        list.push(one)
      }
      attempts++
    }
    records.value = list
    ElMessage.success(`已生成 ${list.length} 条 VIN 数据。`)
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
  <div class="vin-page">
    <header class="vin-page__head">
      <el-breadcrumb class="vin-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-doc' } }">证件工具</el-breadcrumb-item>
        <el-breadcrumb-item>VIN码生成</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="vin-page__intro">
        <p class="vin-page__intro-desc">支持品牌、地区、年份、工厂码和数量配置；参数不填时自动随机生成。</p>
      </div>
    </header>

    <section class="vin-page__panel">
      <div class="vin-config">
        <el-form label-width="90px" label-position="right">
          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="品牌">
                <el-select v-model="brandInput" clearable placeholder="不填则随机" style="width: 100%">
                  <el-option label="大众" value="vw" />
                  <el-option label="丰田" value="toyota" />
                  <el-option label="本田" value="honda" />
                  <el-option label="比亚迪" value="byd" />
                  <el-option label="特斯拉" value="tesla" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="地区">
                <el-select v-model="regionInput" clearable placeholder="不填则随机" style="width: 100%">
                  <el-option label="中国" value="cn" />
                  <el-option label="日本" value="jp" />
                  <el-option label="美国" value="us" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="年份">
                <el-input-number v-model="yearInput" :min="2001" :max="2030" :step="1" placeholder="不填则随机" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="工厂代码">
                <el-input v-model="plantCodeInput" maxlength="1" clearable placeholder="不填则随机（1位）" />
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

      <div class="vin-page__toolbar">
        <el-button type="primary" :loading="generating" @click="generateMany(countInput || DEFAULT_COUNT)">重新生成</el-button>
        <el-button plain type="success" :disabled="!records.length" @click="copyAll">复制全部</el-button>
      </div>

      <div v-if="records.length" class="vin-table-wrap">
        <table class="vin-table" role="table" aria-label="VIN列表">
          <tbody>
            <tr v-for="(row, r) in vinRows" :key="r">
              <td v-for="(item, c) in row" :key="c" class="vin-table__cell">
                <p class="vin-table__meta">{{ item.brand }} · {{ item.year }}</p>
                <div class="vin-table__value">{{ item.vin }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="vin-page__count">共 {{ totalCount }} 个</p>
      </div>

      <p v-else class="vin-page__tip">暂无数据</p>
      <p class="vin-page__tip">说明：VIN 长度 17 位，第 9 位为校验位；仅用于测试/演示，不对应真实车辆。</p>
    </section>
  </div>
</template>

<style scoped>
.vin-page { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.vin-page__head { margin-bottom: 4px; }
.vin-page__crumb { font-size: 13px; }
.vin-page__intro { margin-top: 18px; padding: 18px 20px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.vin-page__intro-desc { margin: 0; font-size: 14px; color: var(--uu-text-secondary); }
.vin-page__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.vin-config { border: 1px solid var(--el-border-color-lighter); border-radius: 12px; padding: 14px 14px 2px; background: #fafcff; }
.vin-page__toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
.vin-table-wrap { display: flex; flex-direction: column; gap: 8px; margin-top: 30px; }
.vin-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.vin-table__cell { border: 1px solid var(--el-border-color-lighter); padding: 10px 8px; text-align: center; vertical-align: middle; }
.vin-table__meta { margin: 0 0 6px; font-size: 13px; color: var(--uu-text-secondary); }
.vin-table__value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 16px; word-break: break-all; }
.vin-page__count { margin: 0; font-size: 13px; color: var(--uu-text-secondary); text-align: right; }
.vin-page__tip { margin: 0; font-size: 13px; color: var(--uu-text-secondary); }
</style>
