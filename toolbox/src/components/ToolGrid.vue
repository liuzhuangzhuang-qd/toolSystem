<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { ToolCard } from '../data/tools'

defineProps<{
  tools: ToolCard[]
  showNew?: boolean
}>()
</script>

<template>
  <el-row :gutter="24" class="tools-row">
    <el-col
      v-for="(tool, i) in tools"
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
</style>
