<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Calendar } from '@element-plus/icons-vue'
import { getNoteArticles } from '../data/noteArticles'

const route = useRoute()
const router = useRouter()

const title = computed(() => (route.meta.title as string) ?? '笔记')
const kind = computed(() => (route.meta.noteKind as 'dev' | 'soft') ?? 'dev')
const articles = computed(() => getNoteArticles(kind.value))

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function padIndex(n: number) {
  return String(n + 1).padStart(2, '0')
}
</script>

<template>
  <div class="notes-list-page">
    <header class="page-head">
      <div class="page-head__row">
        <div class="page-head__lead">
          <el-button
            text
            circle
            class="page-head__back"
            aria-label="返回"
            @click="goBack"
          >
            <el-icon :size="20"><ArrowLeft /></el-icon>
          </el-button>
          <div class="page-head__titles">
            <h1 class="page-head__title">{{ title }}</h1>
            <p class="page-head__sub">共 {{ articles.length }} 篇，持续更新</p>
          </div>
        </div>
        <el-breadcrumb class="page-head__crumb" separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </header>

    <div class="list-shell">
      <ul class="article-list" role="list">
        <li
          v-for="(item, index) in articles"
          :key="item.id"
          class="article-row"
        >
          <span class="article-row__idx" aria-hidden="true">{{ padIndex(index) }}</span>
          <div class="article-row__body">
            <a href="#" class="article-row__title" @click.prevent>{{ item.title }}</a>
            <div class="article-row__meta">
              <el-avatar :size="24" class="article-row__avatar">
                {{ item.author.slice(0, 1).toUpperCase() }}
              </el-avatar>
              <span>{{ item.author }}</span>
              <span class="article-row__dot" aria-hidden="true" />
              <span class="article-row__label">投稿</span>
            </div>
          </div>
          <div class="article-row__aside">
            <time class="article-row__date" :datetime="item.date">
              <el-icon class="article-row__cal" :size="14"><Calendar /></el-icon>
              {{ item.date }}
            </time>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.notes-list-page {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* —— 页头 —— */
.page-head {
  margin-bottom: 22px;
  padding: 20px 22px 18px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(92, 103, 242, 0.06) 0%,
    rgba(255, 255, 255, 0.92) 48%,
    #fff 100%
  );
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.page-head__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.page-head__lead {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.page-head__back {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--uu-text-secondary);
}
.page-head__back:hover {
  color: var(--uu-primary);
  background: rgba(92, 103, 242, 0.08) !important;
}
.page-head__titles {
  min-width: 0;
}
.page-head__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--uu-text);
}
.page-head__sub {
  margin: 0;
  font-size: 13px;
  color: var(--uu-text-secondary);
  line-height: 1.4;
}

.page-head__crumb {
  flex-shrink: 0;
  padding-top: 6px;
  font-size: 13px;
}
.page-head__crumb :deep(.el-breadcrumb__separator) {
  margin: 0 6px;
  font-weight: 400;
  color: var(--el-border-color);
}
.page-head__crumb :deep(.el-breadcrumb__inner) {
  font-weight: 500;
}
.page-head__crumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--uu-text-secondary);
  font-weight: 400;
}

/* —— 列表容器 —— */
.list-shell {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 4px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.article-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.article-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px 18px;
  padding: 17px 20px 17px 18px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}
.article-row:last-child {
  border-bottom: none;
}
.article-row:hover {
  background: linear-gradient(90deg, rgba(92, 103, 242, 0.05) 0%, transparent 42%);
  box-shadow: inset 3px 0 0 var(--uu-primary);
}

.article-row__idx {
  font-family:
    ui-monospace,
    'Cascadia Code',
    'Segoe UI Mono',
    monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-border-color);
  letter-spacing: 0.04em;
  min-width: 28px;
  text-align: right;
  user-select: none;
}

.article-row__body {
  min-width: 0;
}

.article-row__title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--uu-text);
  text-decoration: none;
  line-height: 1.5;
  margin-bottom: 8px;
  transition: color 0.15s ease;
}
.article-row:hover .article-row__title {
  color: var(--uu-primary);
}

.article-row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--uu-text-secondary);
}
.article-row__avatar {
  flex-shrink: 0;
  --el-avatar-bg: linear-gradient(145deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
.article-row__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--el-border-color);
  opacity: 0.85;
}
.article-row__label {
  opacity: 0.85;
}

.article-row__aside {
  flex-shrink: 0;
  align-self: center;
}

.article-row__date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--uu-text-secondary);
  white-space: nowrap;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.article-row__cal {
  opacity: 0.75;
}

@media (max-width: 640px) {
  .page-head {
    padding: 16px 16px 14px;
  }
  .page-head__row {
    flex-direction: column;
    align-items: stretch;
  }
  .page-head__crumb {
    padding-top: 0;
    padding-left: 40px;
  }
  .page-head__title {
    font-size: 19px;
  }

  .article-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px 12px;
    padding: 14px 14px 14px 12px;
  }
  .article-row__idx {
    min-width: 26px;
    padding-top: 2px;
  }
  .article-row__body {
    flex: 1;
    min-width: 0;
  }
  .article-row__aside {
    flex: 1 1 100%;
    display: flex;
    justify-content: flex-end;
    padding-left: 38px;
    box-sizing: border-box;
  }
  .article-row__date {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
