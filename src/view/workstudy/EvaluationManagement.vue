<script setup>
import { computed, onMounted, ref } from 'vue'
import { getEvaluationList, submitEvaluation, updateEvaluation, deleteEvaluation, getActiveHires } from '../../api'

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

// 在岗录用列表（评价表单下拉选择）
const activeHires = ref([])

// 创建/编辑弹窗
const showModal = ref(false)
const editTarget = ref(null)
const form = ref({ hireId: '', studentId: '', evalYear: '', evalMonth: '', score: '', comment: '' })
const saving = ref(false)

// 详情弹窗
const showDetail = ref(false)
const detailTarget = ref(null)

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

// 年份选项（当前年及前后各2年）
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
    const data = await getEvaluationList({
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

async function loadActiveHires() {
  try {
    activeHires.value = await getActiveHires()
  } catch (e) {
    activeHires.value = []
  }
}

function onHireChange() {
  const hire = activeHires.value.find(h => h.hireId == form.value.hireId)
  if (hire) {
    form.value.studentId = hire.studentId
  }
}

function resetForm() {
  form.value = { hireId: '', studentId: '', evalYear: '', evalMonth: '', score: '', comment: '' }
  editTarget.value = null
}

function openCreate() {
  resetForm()
  loadActiveHires()
  showModal.value = true
}

function openEdit(evalItem) {
  editTarget.value = evalItem
  form.value = {
    hireId: evalItem.hireId || '',
    studentId: evalItem.studentId || '',
    evalYear: evalItem.evalYear || '',
    evalMonth: evalItem.evalMonth || '',
    score: evalItem.score || '',
    comment: evalItem.comment || ''
  }
  showModal.value = true
}

async function submitForm() {
  saving.value = true
  try {
    const payload = {
      hireId: Number(form.value.hireId),
      studentId: Number(form.value.studentId),
      evalYear: Number(form.value.evalYear),
      evalMonth: Number(form.value.evalMonth),
      score: Number(form.value.score),
      comment: form.value.comment || null
    }
    if (editTarget.value) {
      await updateEvaluation({ id: editTarget.value.id, score: payload.score, comment: payload.comment })
    } else {
      await submitEvaluation(payload)
    }
    showModal.value = false
    resetForm()
    await loadEvaluations()
  } catch (e) {
    alert('操作失败：' + e.message)
  } finally {
    saving.value = false
  }
}

async function handleDelete(evalItem) {
  if (!confirm(`确定要删除学生「${evalItem.studentName}」的 ${evalItem.evalYear}年${evalItem.evalMonth}月 评价吗？`)) return
  try {
    await deleteEvaluation(evalItem.id)
    await loadEvaluations()
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}

function openDetail(evalItem) {
  detailTarget.value = evalItem
  showDetail.value = true
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

onMounted(() => {
  loadEvaluations()
})
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h2 class="view-title">工作评价管理</h2>
        <p class="subtitle">对在岗勤工助学学生进行月度工作评价</p>
      </div>
      <button class="primary-btn" @click="openCreate">+ 提交评价</button>
    </header>

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
            <th>学生姓名</th>
            <th>学号</th>
            <th>岗位</th>
            <th>用工部门</th>
            <th>评价年月</th>
            <th>评分</th>
            <th>评语</th>
            <th>评价时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="center-text">加载中…</td>
          </tr>
          <tr v-else-if="!evaluations.length">
            <td colspan="9" class="center-text">暂无评价数据</td>
          </tr>
          <tr v-for="item in evaluations" :key="item.id" v-else>
            <td>{{ item.studentName || '-' }}</td>
            <td>{{ item.studentNo || '-' }}</td>
            <td>{{ item.positionName || '-' }}</td>
            <td>{{ item.departmentName || '-' }}</td>
            <td>{{ item.evalYear }}年{{ item.evalMonth }}月</td>
            <td>
              <span class="status-badge" :class="scoreBadgeClass(item.score)">
                {{ scoreLabel(item.score) }}
              </span>
            </td>
            <td class="comment-cell">{{ item.comment || '-' }}</td>
            <td>{{ formatTime(item.evalTime) }}</td>
            <td>
              <button class="text-btn" @click="openDetail(item)">详情</button>
              <button class="text-btn edit-btn" @click="openEdit(item)">编辑</button>
              <button class="text-btn edit-btn" @click="handleDelete(item)">删除</button>
            </td>
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

    <!-- 创建/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card">
        <h3>{{ editTarget ? '编辑评价' : '提交评价' }}</h3>
        <form @submit.prevent="submitForm">
          <label v-if="!editTarget">选择在岗学生
            <select v-model="form.hireId" required @change="onHireChange">
              <option value="">-- 请选择 --</option>
              <option v-for="h in activeHires" :key="h.hireId" :value="h.hireId">
                {{ h.studentName }} ({{ h.studentNo }}) - {{ h.positionName }} @ {{ h.departmentName }}
              </option>
            </select>
          </label>
          <div class="form-row">
            <label>评价年份
              <select v-model="form.evalYear" required :disabled="!!editTarget">
                <option value="">-- 请选择 --</option>
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
              </select>
            </label>
            <label>评价月份
              <select v-model="form.evalMonth" required :disabled="!!editTarget">
                <option value="">-- 请选择 --</option>
                <option v-for="m in monthOptions" :key="m" :value="m">{{ m }}月</option>
              </select>
            </label>
          </div>
          <label>评分（1-5分）
            <select v-model="form.score" required>
              <option value="">-- 请选择 --</option>
              <option :value="5">5分 - 优秀</option>
              <option :value="4">4分 - 良好</option>
              <option :value="3">3分 - 一般</option>
              <option :value="2">2分 - 较差</option>
              <option :value="1">1分 - 很差</option>
            </select>
          </label>
          <label>评语（选填，最多500字）
            <textarea v-model="form.comment" maxlength="500" rows="3" placeholder="请输入对学生的评价…"></textarea>
          </label>
          <div class="modal-actions">
            <button type="button" class="secondary" @click="showModal = false">取消</button>
            <button type="submit" :disabled="saving">{{ saving ? '保存中…' : '确认保存' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal-card">
        <h3>评价详情</h3>
        <div class="detail-grid" v-if="detailTarget">
          <div class="detail-item">
            <span class="detail-label">学生姓名</span>
            <span>{{ detailTarget.studentName || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">学号</span>
            <span>{{ detailTarget.studentNo || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">岗位</span>
            <span>{{ detailTarget.positionName || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">用工部门</span>
            <span>{{ detailTarget.departmentName || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">评价年月</span>
            <span>{{ detailTarget.evalYear }}年{{ detailTarget.evalMonth }}月</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">评分</span>
            <span class="status-badge" :class="scoreBadgeClass(detailTarget.score)">
              {{ scoreLabel(detailTarget.score) }}
            </span>
          </div>
          <div class="detail-item" style="grid-column: 1 / -1;">
            <span class="detail-label">评语</span>
            <span>{{ detailTarget.comment || '无' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">评价时间</span>
            <span>{{ formatTime(detailTarget.evalTime) }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { display: flex; flex-direction: column; gap: 24px; }
.view-header { display: flex; justify-content: space-between; align-items: flex-end; }
.view-title { margin: 0 0 8px; font-size: 24px; }
.subtitle { margin: 0; color: #668077; font-size: 14px; }

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

/* 按钮 */
.text-btn { background: transparent; border: none; color: #217a58; padding: 0 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
.text-btn:hover { text-decoration: underline; }
.edit-btn { color: #668077; }

/* 弹窗样式 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: grid; place-items: center; z-index: 100; backdrop-filter: blur(4px); }
.modal-card { background: #fff; width: 100%; max-width: 540px; padding: 32px; border-radius: 24px; box-shadow: 0 24px 80px rgba(0,0,0,.2); max-height: 90vh; overflow-y: auto; }
.modal-card h3 { margin: 0 0 24px; font-size: 20px; }
.modal-card label { display: block; margin-bottom: 16px; color: #50816d; font-size: 13px; font-weight: 600; }
.modal-card input,
.modal-card select,
.modal-card textarea { width: 100%; border: 1px solid #cbdad0; border-radius: 12px; padding: 12px 14px; outline: none; background: #fbfdfb; font: inherit; margin-top: 6px; box-sizing: border-box; }
.modal-card input:focus,
.modal-card select:focus,
.modal-card textarea:focus { border-color: #217a58; box-shadow: 0 0 0 3px rgba(33, 122, 88, .12); }
.modal-card textarea { resize: vertical; font-family: inherit; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }

/* 详情网格 */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-label { color: #668077; font-size: 12px; font-weight: 600; }
</style>
