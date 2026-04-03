<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarMenu from './components/SidebarMenu.vue'
import TopHeader from './components/TopHeader.vue'

const route = useRoute()
const isChatLayout = computed(() => route.meta.layout === 'chat')
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
      <el-main class="main-area" :class="{ 'main-area--chat': isChatLayout }">
        <div
          class="main-area__body"
          :class="{ 'main-area__body--fill': isChatLayout }"
        >
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component
                :is="Component"
                :class="{ 'main-route-view--fill': isChatLayout }"
              />
            </transition>
          </router-view>
        </div>
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
  min-height: 0;
  flex: 1;
}
.header-wrap {
  padding: 0;
  height: 56px !important;
  flex-shrink: 0;
}
.main-area {
  padding: 24px 28px 40px;
  box-sizing: border-box;
  overflow: auto;
  width: 100%;
  flex: 1;
  min-height: 0;
}
.main-area--chat {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.main-area__body {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}
.main-area__body--fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-route-view--fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
