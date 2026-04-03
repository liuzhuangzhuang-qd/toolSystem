<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

type Gender = '' | 'male' | 'female'
type IdRecord = { name: string; idNo: string }

const records = ref<IdRecord[]>([])
const generating = ref(false)
const DEFAULT_COUNT = 5
const COLS_PER_ROW = 5

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const idRows = computed(() => chunkArray(records.value, COLS_PER_ROW))
const totalCount = computed(() => records.value.length)
const copyText = computed(() => records.value.map((r) => `${r.name}\t${r.idNo}`).join('\n'))

const selectedRegion = ref<string[]>([])
const birthDate = ref<Date | null>(null)
const gender = ref<Gender>('')
const nameInput = ref('')
const countInput = ref<number>(DEFAULT_COUNT)

const regionOptions = [
  {
    label: '北京市',
    value: '110000',
    children: [
      {
        label: '北京市',
        value: '110100',
        children: [
          { label: '东城区', value: '110101' },
          { label: '西城区', value: '110102' },
          { label: '朝阳区', value: '110105' },
        ],
      },
    ],
  },
  {
    label: '上海市',
    value: '310000',
    children: [
      {
        label: '上海市',
        value: '310100',
        children: [
          { label: '黄浦区', value: '310101' },
          { label: '徐汇区', value: '310104' },
          { label: '浦东新区', value: '310115' },
        ],
      },
    ],
  },
  {
    label: '广东省',
    value: '440000',
    children: [
      {
        label: '广州市',
        value: '440100',
        children: [
          { label: '越秀区', value: '440104' },
          { label: '天河区', value: '440106' },
          { label: '白云区', value: '440111' },
        ],
      },
      {
        label: '深圳市',
        value: '440300',
        children: [
          { label: '罗湖区', value: '440303' },
          { label: '福田区', value: '440304' },
          { label: '南山区', value: '440305' },
        ],
      },
    ],
  },
]

// 仅用于“格式演示”：地区码使用常见省级行政区代码（xx0000）。
const regionCodes = ['110101', '110102', '110105', '310101', '310104', '310115', '440104', '440106', '440111', '440303', '440304', '440305']
const familyNames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨']
const givenNameChars = ['伟', '芳', '娜', '敏', '静', '秀', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '琳', '鑫', '宇']

function randomInt(min: number, max: number): number {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  const range = hi - lo + 1
  if (range <= 0) return lo

  // 使用 Web Crypto 获取更好的随机性；否则降级 Math.random。
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return lo + (buf[0] % range)
  }
  return lo + Math.floor(Math.random() * range)
}

function daysInMonth(year: number, month1to12: number): number {
  // JS Date month 是 0-based，所以这里用 month1to12 直接让 new Date 计算“上个月末日”。
  return new Date(year, month1to12, 0).getDate()
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function pickRegionCode(): string {
  const code = selectedRegion.value[selectedRegion.value.length - 1]
  return code || regionCodes[randomInt(0, regionCodes.length - 1)]
}

function pickBirthDateParts(): { year: number; month: number; day: number } {
  if (birthDate.value) {
    return {
      year: birthDate.value.getFullYear(),
      month: birthDate.value.getMonth() + 1,
      day: birthDate.value.getDate(),
    }
  }
  const year = randomInt(1950, 2004)
  const month = randomInt(1, 12)
  const day = randomInt(1, daysInMonth(year, month))
  return { year, month, day }
}

function pickName(): string {
  const manual = nameInput.value.trim()
  if (manual) return manual

  const family = familyNames[randomInt(0, familyNames.length - 1)]
  const given1 = givenNameChars[randomInt(0, givenNameChars.length - 1)]
  const twoChars = randomInt(0, 1) === 1
  const given2 = twoChars ? givenNameChars[randomInt(0, givenNameChars.length - 1)] : ''
  return `${family}${given1}${given2}`
}

function buildSequenceByGender(g: Gender): string {
  const prefix = String(randomInt(0, 99)).padStart(2, '0')
  if (g === 'male') return `${prefix}${randomInt(0, 4) * 2 + 1}`
  if (g === 'female') return `${prefix}${randomInt(0, 4) * 2}`
  return String(randomInt(0, 999)).padStart(3, '0')
}

function computeCheckDigit(id17: string): string {
  // 18 位身份证前 17 位校验位算法权重。
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2] as const
  const checkMap = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'] as const

  let sum = 0
  for (let i = 0; i < 17; i++) {
    const d = id17.charCodeAt(i) - 48
    sum += d * weights[i]
  }
  const remainder = sum % 11
  return checkMap[remainder]
}

function generateOne(): IdRecord {
  const region = pickRegionCode()
  const { year, month, day } = pickBirthDateParts()
  const birth = `${year}${pad2(month)}${pad2(day)}`
  const seq = buildSequenceByGender(gender.value)

  const id17 = `${region}${birth}${seq}` // 6 + 8 + 3 = 17
  const check = computeCheckDigit(id17)
  return {
    name: pickName(),
    idNo: `${id17}${check}`,
  }
}

function generateMany(count: number) {
  if (generating.value) return

  generating.value = true
  try {
    const set = new Set<string>()
    const list: IdRecord[] = []
    let attempts = 0
    const maxAttempts = count * 80

    while (list.length < count && attempts < maxAttempts) {
      const one = generateOne()
      if (!set.has(one.idNo)) {
        set.add(one.idNo)
        list.push(one)
      }
      attempts++
    }

    records.value = list
    ElMessage.success(`已生成 ${list.length} 个身份证号。`)
  } finally {
    generating.value = false
  }
}

async function copyAll() {
  if (!copyText.value.trim()) {
    ElMessage.info('暂无可复制内容。')
    return
  }
  const text = copyText.value
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板。')
  } catch {
    // 兼容：部分环境不支持 navigator.clipboard。
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

onMounted(() => {
  generateMany(DEFAULT_COUNT)
})
</script>

<template>
  <div class="id-card-page">
    <header class="id-card-page__head">
      <el-breadcrumb class="id-card-page__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-doc' } }">
          证件工具
        </el-breadcrumb-item>
        <el-breadcrumb-item>身份证生成</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="id-card-page__intro">
        <p class="id-card-page__intro-desc">
          支持按省市区、出生日期、性别、姓名与数量生成；参数不填时自动随机生成。
        </p>
      </div>
    </header>

    <section class="id-card-page__panel">
      <div class="id-card-config">
        <el-form label-width="90px" label-position="right">
          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="出生地">
                <el-cascader
                  v-model="selectedRegion"
                  :options="regionOptions"
                  :props="{ checkStrictly: false }"
                  clearable
                  filterable
                  placeholder="不填则随机"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="出生日期">
                <el-date-picker
                  v-model="birthDate"
                  type="date"
                  clearable
                  placeholder="不填则随机"
                  style="width: 100%"
                />
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

      <div class="id-card-page__toolbar">
        <el-button type="primary" :loading="generating" @click="generateMany(countInput || DEFAULT_COUNT)">
          重新生成
        </el-button>
        <el-button plain type="success" :disabled="!records.length" @click="copyAll">
          复制全部
        </el-button>
      </div>

      <div v-if="records.length" class="id-card-table-wrap">
        <table class="id-card-table" role="table" aria-label="身份证列表">
          <tbody>
            <tr v-for="(row, r) in idRows" :key="r">
              <td v-for="(item, c) in row" :key="c" class="id-card-table__cell">
                <p class="id-card-table__name">{{ item.name }}</p>
                <div class="id-card-table__value">{{ item.idNo }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="id-card-page__count">共 {{ totalCount }} 个</p>
      </div>

      <p v-else class="id-card-page__tip">
        暂无数据
      </p>

      <p class="id-card-page__tip">
        说明：顺序码末位按性别规则控制（男奇女偶），最后 1 位按身份证校验算法计算。仅用于测试/演示。
      </p>
    </section>
  </div>
</template>

<style scoped>
.id-card-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.id-card-page__head {
  margin-bottom: 4px;
}

.id-card-page__crumb {
  font-size: 13px;
}

.id-card-page__intro {
  margin-top: 18px;
  padding: 18px 20px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.id-card-page__intro-desc {
  margin: 0;
  font-size: 14px;
  color: var(--uu-text-secondary);
}

.id-card-page__panel {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px 20px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.id-card-config {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 14px 14px 2px;
  background: #fafcff;
}

.id-card-page__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.id-card-page__count {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
  text-align: right;
}

.id-card-table-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 30px;
}

.id-card-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.id-card-table__cell {
  border: 1px solid var(--el-border-color-lighter);
  padding: 10px 8px;
  text-align: center;
  vertical-align: middle;
}

.id-card-table__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 16px;
  word-break: break-all;
}

.id-card-table__name {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--uu-text-secondary);
}

.id-card-page__tip {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
}
</style>

