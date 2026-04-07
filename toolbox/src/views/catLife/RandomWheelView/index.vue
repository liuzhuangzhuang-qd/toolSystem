<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputText = ref(['火锅', '烧烤', '麻辣烫', '米线', '盖饭', '面条'].join('\n'))
const spinning = ref(false)
const rotationDeg = ref(0)
const selectedIndex = ref<number | null>(null)

const options = computed(() =>
  inputText.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean),
)

const wheelBackground = computed(() => {
  const n = options.value.length
  if (!n) return '#f5f7fa'
  const palette = ['#2f63e8', '#ff8f86', '#8ff98f', '#f7e9c6', '#e8b5f4', '#9aff9a']
  const parts: string[] = []
  for (let i = 0; i < n; i += 1) {
    const start = i * (360 / n)
    const end = (i + 1) * (360 / n)
    const color = palette[i % palette.length]
    parts.push(`${color} ${start}deg ${end}deg`)
  }
  return `conic-gradient(from -90deg, ${parts.join(', ')})`
})

const selectedText = computed(() => {
  if (selectedIndex.value === null) return ''
  return options.value[selectedIndex.value] ?? ''
})

function labelStyle(i: number): Record<string, string> {
  const n = options.value.length
  if (!n) return {}
  // 与 conic-gradient(from -90deg) 的扇区方向保持一致，避免文字落在分割线上
  const angle = -180 + (i + 0.5) * (360 / n)
  const rad = (angle * Math.PI) / 180
  // 文本固定在圆心到外圈的中点位置
  const radius = 30
  const x = 50 + radius * Math.cos(rad)
  const y = 50 + radius * Math.sin(rad)
  const fontSize = n <= 6 ? 28 : n <= 8 ? 22 : n <= 10 ? 18 : 14
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
    fontSize: `${fontSize}px`,
  }
}

function radialText(text: string): string {
  return text.split('').join('\n')
}

function clearAll() {
  inputText.value = ''
  selectedIndex.value = null
}

function normalize(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function spinWheel() {
  if (spinning.value) return
  const n = options.value.length
  if (n < 2) {
    ElMessage.warning('请至少输入 2 个选项，每行一个。')
    return
  }

  spinning.value = true
  selectedIndex.value = null

  const idx = Math.floor(Math.random() * n)
  const seg = 360 / n
  // conic-gradient(from -90deg): 第 i 扇区中心角（CSS 角度系，0°在正上方，顺时针为正）
  const segmentCenterCssDeg = -90 + (idx + 0.5) * seg
  // 让该中心转到正上方指针（0°）：segmentCenter + rotate ≡ 0 (mod 360)
  const desiredMod = normalize(-segmentCenterCssDeg)
  const currentMod = normalize(rotationDeg.value)
  const alignDelta = normalize(desiredMod - currentMod)
  const turns = 6 + Math.floor(Math.random() * 4)

  rotationDeg.value += turns * 360 + alignDelta

  window.setTimeout(() => {
    selectedIndex.value = idx
    spinning.value = false
    ElMessage.success(`结果：${options.value[idx]}`)
  }, 4200)
}
</script>

<template>
  <div class="wheel-view">
    <header class="wheel-view__head">
      <el-breadcrumb class="wheel-view__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ name: 'category', params: { id: 'cat-life' } }">生活工具</el-breadcrumb-item>
        <el-breadcrumb-item>随机转盘</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="wheel-view__intro-card">
        <p class="wheel-view__intro-desc">自己添加转盘数据（每行一个），点击开始后会随机指向一个选项。</p>
      </div>
    </header>

    <section class="wheel-view__panel">
      <div class="wheel-view__left">
        <p class="wheel-view__title">转盘选项（每行一个）</p>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="14"
          resize="vertical"
          placeholder="例如：\n火锅\n烧烤\n麻辣烫"
        />
        <div class="wheel-view__actions">
          <el-button type="danger" plain @click="clearAll">清空</el-button>
          <el-button type="primary" :loading="spinning" @click="spinWheel">
            {{ spinning ? '转动中...' : '开始转动' }}
          </el-button>
        </div>
      </div>

      <div class="wheel-view__right">
        <div class="wheel-wrap">
          <div class="wheel-pointer" />
          <div
            class="wheel-disc"
            :style="{
              background: wheelBackground,
              transform: `rotate(${rotationDeg}deg)`,
              transition: spinning ? 'transform 4.2s cubic-bezier(0.18, 0.84, 0.15, 1)' : 'none',
            }"
          >
            <div
              v-for="(item, i) in options"
              :key="`wheel-label-${item}-${i}`"
              class="wheel-label"
              :style="labelStyle(i)"
            >
              {{ radialText(item) }}
            </div>
          </div>
          <div class="wheel-center">转盘</div>
        </div>

        <p class="wheel-view__result" :class="{ 'wheel-view__result--active': !!selectedText }">
          {{ selectedText ? `随机结果：${selectedText}` : '点击“开始转动”获取结果' }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wheel-view { display: flex; flex-direction: column; gap: 16px; }
.wheel-view__head { margin-bottom: 4px; }
.wheel-view__crumb { font-size: 13px; }
.wheel-view__intro-card { margin-top: 20px; padding: 14px 16px; border-radius: 10px; background: #fff; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
.wheel-view__intro-desc { margin: 0; font-size: 16px; color: var(--uu-text-secondary); line-height: 1.6; }
.wheel-view__panel { background: #fff; border-radius: 16px; padding: 18px 20px 20px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06); border: 1px solid var(--el-border-color-lighter); display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.wheel-view__left { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.wheel-view__title { margin: 0; font-size: 14px; font-weight: 600; color: var(--uu-text); }
.wheel-view__actions { display: flex; gap: 10px; justify-content: flex-end; }
.wheel-view__right { min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.wheel-wrap { position: relative; width: min(360px, 90%); aspect-ratio: 1 / 1; }
.wheel-disc { position: relative; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #d8d8d8; box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06); overflow: hidden; }
.wheel-label { position: absolute; color: #101010; font-weight: 500; line-height: 1.05; pointer-events: none; white-space: pre-line; text-align: center; transform-origin: center center; letter-spacing: 1px; }
.wheel-pointer { position: absolute; left: 50%; top: -10px; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 18px solid #ff2e2e; z-index: 3; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2)); }
.wheel-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border-radius: 999px; background: #fff; border: 1px solid #d8d8d8; display: grid; place-items: center; font-size: 0; color: transparent; z-index: 2; box-shadow: none; }
.wheel-view__result { margin: 0; font-size: 15px; color: var(--uu-text-secondary); }
.wheel-view__result--active { color: var(--el-color-success); font-weight: 600; }
.wheel-view__chips { width: 100%; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.wheel-view__chip { max-width: 100%; }

@media (max-width: 980px) {
  .wheel-view__panel { grid-template-columns: 1fr; }
}
</style>
