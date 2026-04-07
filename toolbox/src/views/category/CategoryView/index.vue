<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import ToolGrid from '../../../components/ToolGrid.vue'
import { getCategoryById } from '../../../data/tools'

const props = defineProps<{
  id: string
}>()

const router = useRouter()

const category = computed(() => getCategoryById(props.id))
const statusFilter = ref<'all' | 'developed' | 'undeveloped'>('all')
const filteredTools = computed(() => {
  if (!category.value) return []
  if (statusFilter.value === 'developed') return category.value.tools.filter((t) => !!t.routeName)
  if (statusFilter.value === 'undeveloped') return category.value.tools.filter((t) => !t.routeName)
  return category.value.tools
})

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
      <el-radio-group v-model="statusFilter" size="small" class="category-page__filter">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="developed">已开发</el-radio-button>
        <el-radio-button label="undeveloped">未开发</el-radio-button>
      </el-radio-group>
      <router-link to="/" class="category-page__home">回首页</router-link>
    </div>

    <ToolGrid v-if="category && filteredTools.length" :tools="filteredTools" :status-filter="statusFilter" />

    <el-empty v-else :description="category ? '当前筛选下暂无工具' : '未找到该分类或暂无工具'" />
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
.category-page__filter {
  margin-left: auto;
}
</style>
