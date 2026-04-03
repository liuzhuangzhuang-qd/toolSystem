<script setup lang="ts">
import { ref } from 'vue'
import { Search, Moon, Sunny, Bell, Setting } from '@element-plus/icons-vue'
import { useRuntimeInfo } from '../composables/useRuntimeInfo'

const { localUrl, lanIp, networkUrl, publicIp, loading } = useRuntimeInfo()

const keyword = ref('')
const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function onSearch() {
  if (keyword.value.trim()) {
    // placeholder
  }
}
</script>

<template>
  <div class="top-header">
    <div class="header-side header-side--left">
      <div class="runtime-info" title="开发服务器 Local / 局域网 IP / 公网出口">
        <span class="runtime-info__seg">
          <span class="runtime-info__k">Local</span>
          <a :href="localUrl" class="runtime-info__link" target="_blank" rel="noreferrer">{{
            localUrl
          }}</a>
        </span>
        <span v-if="lanIp" class="runtime-info__dot" aria-hidden="true">·</span>
        <span v-if="lanIp" class="runtime-info__seg">
          <span class="runtime-info__k">IP</span>
          <span class="runtime-info__val">{{ lanIp }}</span>
          <a
            v-if="networkUrl"
            :href="networkUrl"
            class="runtime-info__link"
            target="_blank"
            rel="noreferrer"
          >Network</a>
        </span>
        <span class="runtime-info__dot" aria-hidden="true">·</span>
        <span class="runtime-info__seg">
          <span class="runtime-info__k">公网</span>
          <span class="runtime-info__val">
            <template v-if="loading">…</template>
            <template v-else>{{ publicIp ?? '—' }}</template>
          </span>
        </span>
      </div>
    </div>
    <div class="search-wrap">
      <el-input
        v-model="keyword"
        class="search-input"
        placeholder="搜索工具、文章..."
        clearable
        @keyup.enter="onSearch"
      >
        <template #append>
          <el-button type="primary" class="search-btn" @click="onSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </template>
      </el-input>
    </div>
    <div class="header-side header-side--right">
      <div class="actions">
        <el-tooltip content="深色模式" placement="bottom">
          <el-button text circle @click="toggleTheme">
            <el-icon :size="20">
              <Moon v-if="!isDark" />
              <Sunny v-else />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="通知" placement="bottom">
          <el-button text circle>
            <el-icon :size="20"><Bell /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="设置" placement="bottom">
          <el-button text circle>
            <el-icon :size="20"><Setting /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-header {
  display: grid;
  grid-template-columns: 1fr minmax(200px, 520px) 1fr;
  align-items: center;
  gap: 16px;
  height: 100%;
  padding: 0 20px 0 24px;
  box-sizing: border-box;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04), 0 4px 14px rgba(15, 23, 42, 0.06);
}
.header-side {
  min-width: 0;
}
.header-side--left {
  display: flex;
  align-items: center;
  min-width: 0;
}
.runtime-info {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 6px;
  font-size: 11px;
  line-height: 1.35;
  color: var(--el-text-color-secondary, #909399);
  max-width: 100%;
  min-width: 0;
}
.runtime-info__seg {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 3px 6px;
  min-width: 0;
}
.runtime-info__dot {
  opacity: 0.45;
  user-select: none;
}
.runtime-info__k {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--uu-text-secondary, #909399);
}
.runtime-info__k::after {
  content: ':';
  margin-left: 1px;
  font-weight: 500;
}
.runtime-info__val {
  color: var(--uu-text, #303133);
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}
.runtime-info__link {
  color: var(--el-color-primary, #5c67f2);
  text-decoration: none;
  font-weight: 500;
}
.runtime-info__link:hover {
  text-decoration: underline;
}
.header-side--right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.search-wrap {
  width: 100%;
  max-width: 520px;
  justify-self: center;
}
.search-input :deep(.el-input-group__append) {
  padding: 0;
  background: transparent;
  box-shadow: none;
}
.search-btn {
  --el-button-bg-color: #5c67f2;
  --el-button-border-color: #5c67f2;
  --el-button-hover-bg-color: #4a54d9;
  --el-button-hover-border-color: #4a54d9;
  border-radius: 0 4px 4px 0;
  margin: 0;
  padding: 0 16px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
