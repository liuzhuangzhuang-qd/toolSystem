<script setup lang="ts">
import { ref } from 'vue'
import { Search, Moon, Sunny, Bell, Setting } from '@element-plus/icons-vue'

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
    <div class="header-side header-side--left" aria-hidden="true" />
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
