<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import ToolGrid from '../../../components/ToolGrid.vue'
import { getCategoryById } from '../../../data/tools'

const props = defineProps<{
  id: string
}>()

const router = useRouter()

const category = computed(() => getCategoryById(props.id))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="category-page">
    <div class="category-page__toolbar">
      <el-button text circle class="back-btn" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </el-button>
      <h1 class="category-page__title">{{ category?.title ?? '工具分类' }}</h1>
      <router-link to="/" class="category-page__home">回首页</router-link>
    </div>

    <ToolGrid v-if="category && category.tools.length" :tools="category.tools" />

    <el-empty v-else description="未找到该分类或暂无工具" />
  </div>
</template>

<style scoped>
.category-page {
  width: 100%;
}
.category-page__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.back-btn {
  flex-shrink: 0;
}
.category-page__title {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--uu-text);
  min-width: 0;
}
.category-page__home {
  font-size: 14px;
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}
.category-page__home:hover {
  opacity: 0.88;
}
</style>
