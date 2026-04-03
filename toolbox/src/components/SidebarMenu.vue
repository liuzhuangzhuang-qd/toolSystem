<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { menuKeyToPath, pathToMenuKey } from '../utils/menuRoute'
import {
  House,
  Clock,
  TrendCharts,
  EditPen,
  DataAnalysis,
  Picture,
  Monitor,
  PieChart,
  OfficeBuilding,
  Coffee,
  Cpu,
  Notebook,
  Document,
  Fold,
  Expand,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const activeKey = computed(() => pathToMenuKey(route.path))
const isCollapse = ref(false)

function onMenuSelect(index: string) {
  router.push(menuKeyToPath(index))
}
</script>

<template>
  <div class="sidebar" :class="{ collapsed: isCollapse }">
    <div class="brand" :class="{ 'brand--collapsed': isCollapse }">
      <div class="logo" aria-hidden="true">W</div>
      <span v-show="!isCollapse" class="title">工具箱</span>
      <el-tooltip
        :content="isCollapse ? '展开菜单' : '收起菜单'"
        placement="right"
      >
        <el-button
          class="fold-btn"
          text
          circle
          :icon="isCollapse ? Expand : Fold"
          @click="isCollapse = !isCollapse"
        />
      </el-tooltip>
    </div>

    <el-scrollbar class="menu-scroll">
      <el-menu
        :default-active="activeKey"
        :collapse="isCollapse"
        :collapse-transition="false"
        class="side-menu"
        @select="onMenuSelect"
      >
        <el-menu-item index="home">
          <el-icon><House /></el-icon>
          <template #title>主页</template>
        </el-menu-item>
        <el-menu-item index="latest">
          <el-icon><Clock /></el-icon>
          <template #title>最新发布</template>
        </el-menu-item>
        <el-menu-item index="trending">
          <el-icon><TrendCharts /></el-icon>
          <template #title>热度排行</template>
        </el-menu-item>

        <div v-show="!isCollapse" class="section-label">工具分类</div>
        <el-menu-item index="cat-text">
          <el-icon><EditPen /></el-icon>
          <template #title>文本工具</template>
        </el-menu-item>
        <el-menu-item index="cat-num">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数字工具</template>
        </el-menu-item>
        <el-menu-item index="cat-img">
          <el-icon><Picture /></el-icon>
          <template #title>图片工具</template>
        </el-menu-item>
        <el-menu-item index="cat-doc">
          <el-icon><Document /></el-icon>
          <template #title>证件工具</template>
        </el-menu-item>
        <el-menu-item index="cat-code">
          <el-icon><Monitor /></el-icon>
          <template #title>编程相关</template>
        </el-menu-item>
        <el-menu-item index="cat-chart">
          <el-icon><PieChart /></el-icon>
          <template #title>图表工具</template>
        </el-menu-item>
        <el-menu-item index="cat-office">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>办公工具</template>
        </el-menu-item>
        <el-menu-item index="cat-life">
          <el-icon><Coffee /></el-icon>
          <template #title>生活工具</template>
        </el-menu-item>
        <el-menu-item index="cat-ai">
          <el-icon><Cpu /></el-icon>
          <template #title>AI 工具</template>
        </el-menu-item>

        <div v-show="!isCollapse" class="section-label">学习笔记</div>
        <el-menu-item index="notes-dev">
          <el-icon><Notebook /></el-icon>
          <template #title>开发杂记</template>
        </el-menu-item>
        <el-menu-item index="notes-soft">
          <el-icon><Document /></el-icon>
          <template #title>软件推荐</template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-right: 1px solid var(--el-border-color-lighter);
  box-shadow: 4px 0 24px rgba(15, 23, 42, 0.06);
  transition: width 0.2s ease;
  width: 240px;
}
.sidebar.collapsed {
  width: 72px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.brand--collapsed {
  flex-direction: column;
  gap: 10px;
  padding: 12px 8px 14px;
}
.brand--collapsed .fold-btn {
  margin-left: 0;
}
.logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #5c67f2 0%, #8b5cf6 45%, #ec4899 100%);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.title {
  font-weight: 600;
  font-size: 16px;
  color: var(--uu-text);
  flex: 1;
  white-space: nowrap;
}
.fold-btn {
  margin-left: auto;
}
.menu-scroll {
  flex: 1;
  padding: 8px 0;
}
.side-menu {
  border-right: none;
  --el-menu-item-height: 44px;
  width: 100%;
}
.side-menu.el-menu--collapse {
  width: 100%;
}
.section-label {
  padding: 12px 20px 6px;
  font-size: 12px;
  color: var(--uu-text-secondary);
  letter-spacing: 0.5px;
}
</style>
