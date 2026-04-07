<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ToolCard } from '../data/tools'

const props = withDefaults(defineProps<{
  tools: ToolCard[]
  showNew?: boolean
  statusFilter?: 'all' | 'developed' | 'undeveloped'
}>(), {
  statusFilter: 'all',
})

const filteredTools = computed(() => {
  if (props.statusFilter === 'developed') return props.tools.filter((t) => !!t.routeName)
  if (props.statusFilter === 'undeveloped') return props.tools.filter((t) => !t.routeName)
  return props.tools
})
</script>

<template>
  <el-row :gutter="24" class="tools-row">
    <el-col
      v-for="(tool, i) in filteredTools"
      :key="`${tool.title}-${i}`"
      :xs="24"
      :sm="12"
      :md="12"
      :lg="6"
      class="stretch-col"
    >
      <component
        :is="tool.routeName ? RouterLink : 'div'"
        v-bind="tool.routeName ? { to: { name: tool.routeName } } : {}"
        class="tool-card-root"
      >
        <el-card shadow="never" class="tool-card card-elevated">
          <el-tag
            v-if="showNew"
            class="badge-new"
            size="small"
            effect="plain"
            type="info"
            >New</el-tag>
          <el-tag
            class="badge-status"
            size="small"
            effect="plain"
            :type="tool.routeName ? 'success' : 'info'"
            :class="{ 'badge-status--undeveloped': !tool.routeName }"
          >
            {{ tool.routeName ? '已开发' : '暂未开发' }}
          </el-tag>
          <div class="tool-body">
            <div class="tool-thumb" :style="{ background: tool.thumb }">
              <span class="tool-emoji">{{ tool.icon }}</span>
            </div>
            <div class="tool-info">
              <div class="tool-name">{{ tool.title }}</div>
              <p class="tool-desc">{{ tool.desc }}</p>
            </div>
          </div>
        </el-card>
      </component>
    </el-col>
  </el-row>
</template>

<style scoped>
.tool-card-root {
  display: block;
  height: 100%;
  text-decoration: none;
  color: inherit;
  outline: none;
}

.tool-card {
  position: relative;
}

.badge-status {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

.badge-status--undeveloped {
  opacity: 0.75;
}
</style>
