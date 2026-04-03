<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => (route.meta.title as string) ?? '页面')
</script>

<template>
  <div class="placeholder-page">
    <h2 class="placeholder-page__title">{{ title }}</h2>
    <p class="placeholder-page__hint">内容建设中，敬请期待。</p>
    <router-link to="/" class="placeholder-page__back">返回首页</router-link>
  </div>
</template>

<style scoped>
.placeholder-page {
  padding: 24px 8px 40px;
  text-align: center;
}
.placeholder-page__title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--uu-text);
}
.placeholder-page__hint {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--uu-text-secondary);
}
.placeholder-page__back {
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}
.placeholder-page__back:hover {
  opacity: 0.88;
}
</style>
