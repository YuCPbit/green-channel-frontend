<script setup>
import { computed, onMounted, ref } from 'vue'
import { getMyEvaluations } from '../../api'

const props = defineProps({
  userType: Number,
  menuName: String,
  user: Object
})

// 评价列表与分页
const evaluations = ref([])
const loading = ref(false)
const error = ref('')
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 筛选条件
const filterEvalYear = ref('')
const filterEvalMonth = ref('')

const scoreLabel = (score) => {
  if (score === 1) return '1分 - 很差'
  if (score === 2) return '2分 - 较差'
  if (score === 3) return '3分 - 一般'
  if (score === 4) return '4分 - 良好'
  if (score === 5) return '5分 - 优秀'
  return '未知'
}

const scoreBadgeClass = (score) => {
  if (score >= 4) return 'status-0'
  if (score === 3) return 'status-1'
  return 'status-2'
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalElements.value / pageSize.value)))

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    years.push(y)
  }
  return years
})

const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

async function loadEvaluations() {
  loading.value = true
  error.value = ''
  try {
    const data = await getMyEvaluations({
      evalYear: filterEvalYear.value || undefined,
      evalMonth: filterEvalMonth.value || undefined,
      page: currentPage.value,
      size: pageSize.value
    })
    evaluations.value = data.content || []
    totalElements.value = data.totalElements || 0
  } catch (e) {
    error.value = e.message
    evaluations.value = []
  } finally {
    loading.value = false
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadEvaluations()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadEvaluations()
  }
}

function formatTime(time) {
  if (!time) return '-'
  return time.replace('T', ' ')
}

// 计算平均评分
const averageScore = computed(() => {
  if (!evaluations.value.length) return null
  const total = evaluations.value.reduce((sum, e) => sum + (e.score || 0), 0)
  return (total / evaluations.value.length).toFixed(1)
})

onMounted(() => {
  loadEvaluations()
})
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h2 class="view-title">我的工作评价</h2>
        <p class="subtitle">查看您在勤工助学岗位上的月度工作评价</p>
      </div>
    </header>

    <!-- 评分概览卡片 -->
    <div v-if="evaluations.length && !loading" class="metrics-grid">
      <div class="metric-card">
        <span class="metric-value">{{ evaluations.length }}</span>
        <span class="metric-label">累计评价次数</span>
      </div>
      <div class="metric-card">
        <span class="metric-value">{{ averageScore }}</span>
        <span class="metric-label">平均评分</span>
      </div>
      <div class="metric-card">
        <span class="metric-value" :class="averageScore >= 3 ? 'score-ok' : 'score-warn'">
          {{ averageScore >= 3 ? '正常' : '偏低' }}
        </span>
        <span class="metric-label">综合评价</span>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <select v-model="filterEvalYear" @change="currentPage = 1; loadEvaluations()">
        <option value="">全部年份</option>
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
      </select>
      <select v-model="filterEvalMonth" @change="currentPage = 1; loadEvaluations()">
        <option value="">全部月份</option>
        <option v-for="m in monthOptions" :key="m" :value="m">{{ m }}月</option>
      </select>
      <button class="secondary" @click="currentPage = 1; loadEvaluations()">查询</button>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>评价年月</th>
            <th>岗位名称</th>
            <th>用工部门</th>
            <th>评分</th>
            <th>评语</th>
            <th>评价时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="center-text">加载中…</td>
          </tr>
          <tr v-else-if="!evaluations.length">
            <td colspan="6" class="center-text">暂无评价记录</td>
          </tr>
          <tr v-for="item in evaluations" :key="item.id" v-else>
            <td>{{ item.evalYear }}年{{ item.evalMonth }}月</td>
            <td>{{ item.positionName || '-' }}</td>
            <td>{{ item.departmentName || '-' }}</td>
            <td>
              <span class="status-badge" :class="scoreBadgeClass(item.score)">
                {{ scoreLabel(item.score) }}
              </span>
            </td>
            <td class="comment-cell">{{ item.comment || '-' }}</td>
            <td>{{ formatTime(item.evalTime) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="totalElements > 0" class="pagination">
      <button :disabled="currentPage <= 1" @click="prevPage">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页（{{ totalElements }} 条）</span>
      <button :disabled="currentPage >= totalPages" @click="nextPage">下一页</button>
    </div>
  </div>
</template>

<style scoped>
.view-container { display: flex; flex-direction: column; gap: 24px; }
.view-header { display: flex; justify-content: space-between; align-items: flex-end; }
.view-title { margin: 0 0 8px; font-size: 24px; }
.subtitle { margin: 0; color: #668077; font-size: 14px; }

/* 评分概览 */
.metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.metric-card { background: #fff; border-radius: 18px; padding: 24px; box-shadow: 0 4px 12px rgba(27,74,57,.04); display: flex; flex-direction: column; gap: 8px; align-items: center; }
.metric-value { font-size: 28px; font-weight: 700; color: #16352c; }
.metric-label { font-size: 13px; color: #668077; }
.score-ok { color: #217a58; }
.score-warn { color: #b53f3f; }

/* 筛选栏 */
.filter-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.filter-bar select { border: 1px solid #cbdad0; border-radius: 12px; padding: 10px 14px; outline: none; background: #fbfdfb; font: inherit; min-width: 120px; }
.filter-bar select:focus { border-color: #217a58; box-shadow: 0 0 0 3px rgba(33, 122, 88, .12); }

.error-message { color: #b53f3f; margin: 0; font-size: 14px; }
.center-text { text-align: center; color: #999; padding: 32px !important; }

/* 分页 */
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; font-size: 14px; color: #50816d; }
.pagination button { padding: 8px 16px; border-radius: 10px; border: 1px solid #cbdad0; background: #fff; cursor: pointer; font: inherit; }
.pagination button:disabled { opacity: .4; cursor: not-allowed; }

/* 表格卡片样式 */
.table-card { background: #fff; border-radius: 18px; padding: 20px; box-shadow: 0 4px 12px rgba(27,74,57,.04); overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
.data-table th { padding: 14px 16px; color: #50816d; font-weight: 600; border-bottom: 2px solid #edf4ef; white-space: nowrap; }
.data-table td { padding: 16px; border-bottom: 1px solid #edf4ef; color: #16352c; }
.data-table tbody tr:hover { background: #fbfdfb; }
.comment-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 状态标签 */
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.status-0 { background: #e7f1eb; color: #217a58; }
.status-1 { background: #fff3e0; color: #b86e00; }
.status-2 { background: #fce8e8; color: #b53f3f; }
</style>
