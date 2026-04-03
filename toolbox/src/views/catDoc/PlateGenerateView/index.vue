<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

type PlateType = '' | 'normal' | 'new-energy'
type FuelType = '' | 'small-new' | 'large-new'
type PlateRecord = { province: string; type: string; plate: string }

const records = ref<PlateRecord[]>([])
const generating = ref(false)
const DEFAULT_COUNT = 5
const COLS_PER_ROW = 5

const provinceInput = ref('')
const cityLetterInput = ref('')
const plateTypeInput = ref<PlateType>('')
const fuelTypeInput = ref<FuelType>('')
const countInput = ref<number>(DEFAULT_COUNT)

const PROVINCES = [
  { label: '京', value: '京' }, { label: '津', value: '津' }, { label: '沪', value: '沪' }, { label: '渝', value: '渝' },
  { label: '冀', value: '冀' }, { label: '豫', value: '豫' }, { label: '云', value: '云' }, { label: '辽', value: '辽' },
  { label: '黑', value: '黑' }, { label: '湘', value: '湘' }, { label: '皖', value: '皖' }, { label: '鲁', value: '鲁' },
  { label: '新', value: '新' }, { label: '苏', value: '苏' }, { label: '浙', value: '浙' }, { label: '赣', value: '赣' },
  { label: '鄂', value: '鄂' }, { label: '桂', value: '桂' }, { label: '甘', value: '甘' }, { label: '晋', value: '晋' },
  { label: '蒙', value: '蒙' }, { label: '陕', value: '陕' }, { label: '吉', value: '吉' }, { label: '闽', value: '闽' },
  { label: '贵', value: '贵' }, { label: '粤', value: '粤' }, { label: '青', value: '青' }, { label: '藏', value: '藏' },
  { label: '川', value: '川' }, { label: '宁', value: '宁' }, { label: '琼', value: '琼' },
]

const CITY_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
const DIGITS = '0123456789'

const rows = computed(() => {
  const out: PlateRecord[][] = []
  for (let i = 0; i < records.value.length; i += COLS_PER_ROW) out.push(records.value.slice(i, i + COLS_PER_ROW))
  return out
})
const totalCount = computed(() => records.value.length)
const copyText = computed(() => records.value.map((r) => `${r.province}\t${r.type}\t${r.plate}`).join('\n'))

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

function pickChar(chars: string): string {
  return chars[randomInt(0, chars.length - 1)]
}

function pickProvince(): string {
  const p = provinceInput.value.trim()
  if (p && PROVINCES.some((x) => x.value === p)) return p
  return pickFrom(PROVINCES).value
}

function pickCityLetter(): string {
  const raw = cityLetterInput.value.trim().toUpperCase()
  if (raw && raw.length === 1 && CITY_LETTERS.includes(raw)) return raw
  return pickChar(CITY_LETTERS)
}

function pickPlateType(): Exclude<PlateType, ''> {
  if (plateTypeInput.value) return plateTypeInput.value
  return randomInt(0, 1) === 0 ? 'normal' : 'new-energy'
}

function pickFuelType(): Exclude<FuelType, ''> {
  if (fuelTypeInput.value) return fuelTypeInput.value
  return randomInt(0, 1) === 0 ? 'small-new' : 'large-new'
}

function genNormalBody(): string {
  let s = ''
  for (let i = 0; i < 5; i++) s += pickChar(ALNUM)
  return s
}

// 新能源规则示意：
// - 小型新能源：D/F + 字母数字 + 4位数字
// - 大型新能源：5位数字 + D/F
function genNewEnergyBody(fuel: Exclude<FuelType, ''>): string {
  if (fuel === 'small-new') {
    return `${pickFrom(['D', 'F'])}${pickChar(ALNUM)}${pickChar(DIGITS)}${pickChar(DIGITS)}${pickChar(DIGITS)}${pickChar(DIGITS)}`
  }
  return `${pickChar(DIGITS)}${pickChar(DIGITS)}${pickChar(DIGITS)}${pickChar(DIGITS)}${pickChar(DIGITS)}${pickFrom(['D', 'F'])}`
}

function generateOne(): PlateRecord {
  const province = pickProvince()
  const city = pickCityLetter()
  const plateType = pickPlateType()
  if (plateType === 'normal') {
    const plate = `${province}${city}${genNormalBody()}`
    return { province, type: '普通', plate }
  }

  const fuel = pickFuelType()
  const plate = `${province}${city}${genNewEnergyBody(fuel)}`
  return { province, type: fuel === 'small-new' ? '新能源-小型' : '新能源-大型', plate }
}

function generateMany(count: number) {
  if (generating.value) return
  const safeCount = Math.max(1, Math.min(50, Number.isFinite(count) ? count : DEFAULT_COUNT))
  generating.value = true
  try {
    const set = new Set<string>()
    const list: PlateRecord[] = []
    let attempts = 0
    const maxAttempts = safeCount * 100
    while (list.length < safeCount && attempts < maxAttempts) {
      const one = generateOne()
      if (!set.has(one.plate)) {
        set.add(one.plate)
        list.push(one)
      }
      attempts++
    }
    records.value = list
    ElMessage.success(`已生成 ${list.length} 条车牌号。`)
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
  <div class="plate-page">
    <header class="plate-page__head">
      <el-breadcrumb class="plate-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-doc' } }">证件工具</el-breadcrumb-item>
        <el-breadcrumb-item>车牌号生成</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="plate-page__intro">
        <p class="plate-page__intro-desc">支持省份、发牌机关字母、类型和数量参数；参数不填时自动随机生成。</p>
      </div>
    </header>

    <section class="plate-page__panel">
      <div class="plate-config">
        <el-form label-width="90px" label-position="right">
          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="省份简称">
                <el-select v-model="provinceInput" clearable filterable placeholder="不填则随机" style="width: 100%">
                  <el-option v-for="p in PROVINCES" :key="p.value" :label="p.label" :value="p.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="发牌字母">
                <el-input v-model="cityLetterInput" maxlength="1" clearable placeholder="不填则随机（A-Z，去I/O）" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="车牌类型">
                <el-select v-model="plateTypeInput" clearable placeholder="不填则随机" style="width: 100%">
                  <el-option label="普通" value="normal" />
                  <el-option label="新能源" value="new-energy" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="新能源细分">
                <el-select v-model="fuelTypeInput" clearable placeholder="不填则随机" style="width: 100%" :disabled="plateTypeInput !== 'new-energy' && plateTypeInput !== ''">
                  <el-option label="小型新能源" value="small-new" />
                  <el-option label="大型新能源" value="large-new" />
                </el-select>
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

      <div class="plate-page__toolbar">
        <el-button type="primary" :loading="generating" @click="generateMany(countInput || DEFAULT_COUNT)">重新生成</el-button>
        <el-button plain type="success" :disabled="!records.length" @click="copyAll">复制全部</el-button>
      </div>

      <div v-if="records.length" class="plate-table-wrap">
        <table class="plate-table" role="table" aria-label="车牌号列表">
          <tbody>
            <tr v-for="(row, r) in rows" :key="r">
              <td v-for="(item, c) in row" :key="c" class="plate-table__cell">
                <p class="plate-table__meta">{{ item.province }} · {{ item.type }}</p>
                <div class="plate-table__value">{{ item.plate }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="plate-page__count">共 {{ totalCount }} 个</p>
      </div>

      <p v-else class="plate-page__tip">暂无数据</p>
      <p class="plate-page__tip">说明：生成规则用于测试/演示，不对应真实车辆登记信息。</p>
    </section>
  </div>
</template>

<style scoped>
.plate-page { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.plate-page__head { margin-bottom: 4px; }
.plate-page__crumb { font-size: 13px; }
.plate-page__intro { margin-top: 18px; padding: 18px 20px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.plate-page__intro-desc { margin: 0; font-size: 14px; color: var(--uu-text-secondary); }
.plate-page__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: flex; flex-direction: column; gap: 14px; }
.plate-config { border: 1px solid var(--el-border-color-lighter); border-radius: 12px; padding: 14px 14px 2px; background: #fafcff; }
.plate-page__toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
.plate-table-wrap { display: flex; flex-direction: column; gap: 8px; margin-top: 30px; }
.plate-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.plate-table__cell { border: 1px solid var(--el-border-color-lighter); padding: 10px 8px; text-align: center; vertical-align: middle; }
.plate-table__meta { margin: 0 0 6px; font-size: 13px; color: var(--uu-text-secondary); }
.plate-table__value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 16px; word-break: break-all; }
.plate-page__count { margin: 0; font-size: 13px; color: var(--uu-text-secondary); text-align: right; }
.plate-page__tip { margin: 0; font-size: 13px; color: var(--uu-text-secondary); }
</style>
