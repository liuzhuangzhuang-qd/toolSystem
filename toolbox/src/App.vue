<script setup lang="ts">
import SidebarMenu from './components/SidebarMenu.vue'
import TopHeader from './components/TopHeader.vue'
</script>

<template>
  <el-container class="page-root">
    <el-aside width="auto" class="aside-wrap">
      <SidebarMenu />
    </el-aside>
    <el-container direction="vertical" class="main-column">
      <el-header height="56px" class="header-wrap">
        <TopHeader />
      </el-header>
      <el-main class="main-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.page-root {
  height: 100vh;
  min-height: 600px;
  background: var(--uu-bg);
}
.aside-wrap {
  overflow: hidden;
}
.main-column {
  min-width: 0;
}
.header-wrap {
  padding: 0;
  height: 56px !important;
}
.main-area {
  padding: 24px 28px 40px;
  box-sizing: border-box;
  overflow: auto;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
