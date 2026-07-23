<script setup>
import { onMounted, ref, computed } from 'vue'
import {
  getTutorApplyTypes,
  getTutorReviewList,
  getTutorDisburseList,
  getTutorDisburseSummary,
  getTutorApplicationDetail,
  submitTutorReview,
  getTutorStatistics,
  disburseTutorApplication,
  batchDisburseTutorApplications,
  getTutorLedgerSummary,
  getTutorLedgerDetail,
  downloadTutorLedgerExcel
} from '../../api'

const props = defineProps({ userType: Number, menuName: String, user: Object })

// ---- 通用 ----
const applyTypes = ref([])
const statistics = ref(null)
const disburseSummary = ref(null)

// ---- 审批 Tab ----
const applies = ref([])
const loading = ref(false)
const error = ref('')
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const filterStatus = ref('')
const filterTypeId = ref('')
const filterUrgency = ref('')

// ---- 资金发放 Tab ----
const disburseItems = ref([])
const disburseLoading = ref(false)
const disburseError = ref('')
const disburseTotal = ref(0)
const disbursePage = ref(1)
const disbursePageSize = ref(20)
const disburseFilterStatus = ref('')
const disburseFilterType = ref('')

// ---- 批量下发 ----
const selectedIds = ref(new Set())
const selectAll = ref(false)
const batchLoading = ref(false)

// ---- 台账 ----
const ledgerSummary = ref([])
const ledgerLoading = ref(false)
const ledgerDateStart = ref('')
const ledgerDateEnd = ref('')
const ledgerDetailModal = ref(false)
const ledgerDetailItems = ref([])
const ledgerDetailTotal = ref(0)
const ledgerDetailTitle = ref('')
const ledgerDetailPage = ref(1)
const ledgerSelectedKeys = ref(new Set())
const ledgerSelectAll = ref(false)
const ledgerExporting = ref(false)

// ---- 弹窗 ----
const reviewTarget = ref(null)
const reviewForm = ref({ action: 1, comment: '' })
const reviewing = ref(false)
const detailTarget = ref(null)
const detailLoading = ref(false)

// ---- 当前激活的 Tab ----
const activeTab = ref('review')

// ---- 标签/格式化 ----
const statusLabel = (s) => ({ 1: '草稿', 2: '待学院审批', 3: '待学校审批', 4: '已通过', 5: '已驳回' }[s] || '未知')
const statusClass = (s) => {
  if (s === 4) return 'status-0'
  if (s === 2 || s === 3) return 'status-1'
  if (s === 5) return 'status-2'
  return 'status-3'
}
const urgencyLabel = (u) => ({ 1: '普通', 2: '紧急', 3: '特急' }[u] || '普通')
const urgencyClass = (u) => u === 3 ? 'urgency-3' : (u === 2 ? 'urgency-2' : 'urgency-1')
const disburseLabel = (d) => ({ 0: '-', 1: '待下发', 2: '已下发' }[d] || '-')
const disburseClass = (d) => d === 2 ? 'disburse-ok' : (d === 1 ? 'disburse-wait' : '')
const actionLabel = (a) => ({ 1: '通过', 2: '驳回', 3: '转交', 4: '备案' }[a] || '未知')
const reviewerRoleLabel = (r) => r === 2 ? '学院管理员' : (r === 3 ? '学校资助中心' : '未知')
const formatTime = (t) => t ? t.replace('T', ' ') : '-'
const formatMoney = (v) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(v)
const povertyLabel = (p) => ({ 1: '特别困难', 2: '困难', 3: '一般困难', 4: '不困难' }[p] || '-')
const totalPages = computed(() => Math.max(1, Math.ceil(totalElements.value / pageSize.value)))
const disburseTotalPages = computed(() => Math.max(1, Math.ceil(disburseTotal.value / disbursePageSize.value)))
const selectableItems = computed(() => disburseItems.value.filter(a => a.disburseStatus === 1))

const isSchool = computed(() => props.userType === 4)
const isCollege = computed(() => props.userType === 3)
const defaultStatus = computed(() => isSchool.value ? 3 : 2)

onMounted(() => {
  if (!filterStatus.value) filterStatus.value = defaultStatus.value
  loadApplyTypes(); loadStatistics()
  if (activeTab.value === 'review') loadApplies()
  else loadDisburseList()
})

async function loadApplyTypes() {
  try { applyTypes.value = await getTutorApplyTypes() } catch (e) { /* nop */ }
}

async function loadStatistics() {
  try { statistics.value = await getTutorStatistics() } catch (e) { /* nop */ }
  if (isSchool.value) {
    try { disburseSummary.value = await getTutorDisburseSummary() } catch (e) { /* nop */ }
  }
}

// ==================== 审批 Tab ====================

async function loadApplies() {
  loading.value = true; error.value = ''
  try {
    const data = await getTutorReviewList({
      status: filterStatus.value || undefined,
      typeId: filterTypeId.value || undefined,
      urgency: filterUrgency.value || undefined,
      page: currentPage.value, size: pageSize.value
    })
    applies.value = data.items || []; totalElements.value = data.total || 0
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

function reviewPrevPage() { if (currentPage.value > 1) { currentPage.value--; loadApplies() } }
function reviewNextPage() { if (currentPage.value < totalPages.value) { currentPage.value++; loadApplies() } }

function openReview(apply) {
  reviewTarget.value = apply
  reviewForm.value = { action: 1, comment: '' }
}

async function handleSubmitReview() {
  if ((reviewForm.value.action === 2) && !reviewForm.value.comment.trim()) {
    alert('驳回时必须填写审核意见'); return
  }
  reviewing.value = true
  try {
    await submitTutorReview({ applicationId: reviewTarget.value.id, action: reviewForm.value.action, comment: reviewForm.value.comment || null })
    reviewTarget.value = null
    await loadApplies(); await loadStatistics()
  } catch (e) { alert('操作失败：' + e.message) } finally { reviewing.value = false }
}

// ==================== 资金发放 Tab ====================

async function loadDisburseList() {
  disburseLoading.value = true; disburseError.value = ''
  try {
    const data = await getTutorDisburseList({
      disburseStatus: disburseFilterStatus.value || undefined,
      typeId: disburseFilterType.value || undefined,
      page: disbursePage.value, size: disbursePageSize.value
    })
    disburseItems.value = data.items || []; disburseTotal.value = data.total || 0
    selectedIds.value = new Set(); selectAll.value = false
  } catch (e) { disburseError.value = e.message } finally { disburseLoading.value = false }
}

function disbursePrevPage() { if (disbursePage.value > 1) { disbursePage.value--; loadDisburseList() } }
function disburseNextPage() { if (disbursePage.value < disburseTotalPages.value) { disbursePage.value++; loadDisburseList() } }

function toggleSelectAll() {
  if (selectAll.value) {
    selectableItems.value.forEach(a => selectedIds.value.add(a.id))
  } else {
    selectableItems.value.forEach(a => selectedIds.value.delete(a.id))
  }
}

function toggleOne(id) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

async function handleDisburse(apply) {
  if (!confirm(`确认为「${apply.title}」下发资金 ${formatMoney(apply.amount)} 吗？`)) return
  try {
    await disburseTutorApplication(apply.id)
    await loadDisburseList(); await loadStatistics()
  } catch (e) { alert('下发失败：' + e.message) }
}

async function handleBatchDisburse() {
  if (selectedIds.value.size === 0) { alert('请先勾选要下发的申请'); return }
  if (!confirm(`确认批量下发 ${selectedIds.value.size} 笔资金吗？`)) return
  batchLoading.value = true
  try {
    const result = await batchDisburseTutorApplications([...selectedIds.value])
    alert(`成功下发 ${result.count} 笔`)
    await loadDisburseList(); await loadStatistics()
  } catch (e) { alert('批量下发失败：' + e.message) } finally { batchLoading.value = false }
}

// ==================== 通用 ====================

async function openDetail(apply) {
  detailLoading.value = true
  try { detailTarget.value = await getTutorApplicationDetail(apply.id) } catch (e) { alert('加载详情失败：' + e.message) } finally { detailLoading.value = false }
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'review') loadApplies()
  else if (tab === 'disburse') loadDisburseList()
  else if (tab === 'ledger') loadLedgerSummary()
}

// ==================== 台账 ====================

function ledgerRowKey(row) { return row.collegeId + ':' + row.typeId }

async function loadLedgerSummary() {
  ledgerLoading.value = true
  try {
    ledgerSummary.value = await getTutorLedgerSummary({
      startDate: ledgerDateStart.value || undefined,
      endDate: ledgerDateEnd.value || undefined
    })
    ledgerSelectedKeys.value = new Set(); ledgerSelectAll.value = false
  } catch (e) { /* 非关键 */ } finally { ledgerLoading.value = false }
}

function toggleLedgerSelectAll() {
  if (ledgerSelectAll.value) {
    ledgerSummary.value.forEach(r => ledgerSelectedKeys.value.add(ledgerRowKey(r)))
  } else {
    ledgerSelectedKeys.value = new Set()
  }
}

function toggleLedgerRow(row) {
  const key = ledgerRowKey(row)
  if (ledgerSelectedKeys.value.has(key)) ledgerSelectedKeys.value.delete(key)
  else ledgerSelectedKeys.value.add(key)
}

function getSelectedLedgerFilters() {
  if (ledgerSelectedKeys.value.size === 0) return {}
  const collegeIds = []; const typeIds = []
  for (const key of ledgerSelectedKeys.value) {
    const [c, t] = key.split(':')
    if (!collegeIds.includes(c)) collegeIds.push(c)
    if (!typeIds.includes(t)) typeIds.push(t)
  }
  // 多选时逐个组合导出不太方便，直接传全部勾选对应的 collegeId 和 typeId 组合
  // 简化：有勾选就全量导出（筛选已在日期范围内）
  return {} // 全量导出，日期范围已限制
}

async function openLedgerDetail(collegeId, typeId, title) {
  ledgerDetailTitle.value = title
  ledgerDetailPage.value = 1
  try {
    const data = await getTutorLedgerDetail({
      collegeId, typeId,
      startDate: ledgerDateStart.value || undefined,
      endDate: ledgerDateEnd.value || undefined,
      page: 1, size: 50
    })
    ledgerDetailItems.value = data.items || []
    ledgerDetailTotal.value = data.total || 0
  } catch (e) { alert('加载明细失败：' + e.message) }
  ledgerDetailModal.value = true
}

async function exportLedger() {
  ledgerExporting.value = true
  try {
    // 如果勾选了特定行，按勾选的 collegeId+typeId 组合筛选导出
    let filters = {}
    if (ledgerSelectedKeys.value.size > 0) {
      const collegeIds = [...new Set([...ledgerSelectedKeys.value].map(k => k.split(':')[0]))]
      const typeIds = [...new Set([...ledgerSelectedKeys.value].map(k => k.split(':')[1]))]
      filters = { collegeIds, typeIds }
    }
    await downloadTutorLedgerExcel({
      startDate: ledgerDateStart.value || undefined,
      endDate: ledgerDateEnd.value || undefined,
      ...filters
    })
  } catch (e) { alert('导出失败：' + e.message) } finally { ledgerExporting.value = false }
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h2 class="view-title">{{ isSchool ? '事务审批（学校）' : '事务审批（学院）' }}</h2>
        <p class="subtitle">{{ isSchool ? '审批辅导员提交的事务申请，管理资金下发' : '审核本学院辅导员提交的事务申请' }}</p>
      </div>
    </header>

    <!-- 统计卡片 -->
    <div v-if="statistics" class="stat-row">
      <div class="stat-card" :class="{ 'stat-active': activeTab === 'review' }" @click="switchTab('review')">
        <span class="stat-num">{{ statistics.total || 0 }}</span>
        <span class="stat-desc">申请总数</span>
      </div>
      <div class="stat-card stat-warn" :class="{ 'stat-active': activeTab === 'review' }" @click="switchTab('review')">
        <span class="stat-num">{{ (statistics.pendingCollege || 0) + (statistics.pendingSchool || 0) }}</span>
        <span class="stat-desc">待审批</span>
      </div>
      <div class="stat-card stat-ok" :class="{ 'stat-active': activeTab === 'review' }" @click="switchTab('review')">
        <span class="stat-num">{{ statistics.approved || 0 }}</span>
        <span class="stat-desc">已通过</span>
      </div>
      <div class="stat-card stat-err" :class="{ 'stat-active': activeTab === 'review' }" @click="switchTab('review')">
        <span class="stat-num">{{ statistics.rejected || 0 }}</span>
        <span class="stat-desc">已驳回</span>
      </div>
      <template v-if="isSchool && disburseSummary">
        <div class="stat-card stat-disburse" :class="{ 'stat-active': activeTab === 'disburse' }" @click="switchTab('disburse')">
          <span class="stat-num">{{ disburseSummary.pendingCount || 0 }}</span>
          <span class="stat-desc">待下发</span>
        </div>
        <div class="stat-card stat-disbursed" :class="{ 'stat-active': activeTab === 'disburse' }" @click="switchTab('disburse')">
          <span class="stat-num">{{ disburseSummary.disbursedCount || 0 }}</span>
          <span class="stat-desc">已下发</span>
        </div>
      </template>
    </div>

    <!-- Tab 切换（仅学校端显示资金发放/台账 Tab） -->
    <div v-if="isSchool" class="tab-bar">
      <button :class="['tab-btn', { active: activeTab === 'review' }]" @click="switchTab('review')">
        审批工作台
        <span v-if="(statistics?.pendingCollege || 0) + (statistics?.pendingSchool || 0) > 0" class="tab-badge">{{ (statistics?.pendingCollege || 0) + (statistics?.pendingSchool || 0) }}</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'disburse' }]" @click="switchTab('disburse')">
        资金发放
        <span v-if="disburseSummary?.pendingCount > 0" class="tab-badge">{{ disburseSummary?.pendingCount }}</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'ledger' }]" @click="switchTab('ledger')">
        台账导出
      </button>
    </div>

    <!-- ==================== 审批工作台 ==================== -->
    <template v-if="activeTab === 'review'">
      <div class="filter-bar">
        <select v-model="filterTypeId" class="gc-select" @change="currentPage=1;loadApplies()">
          <option value="">全部类型</option>
          <option v-for="t in applyTypes" :key="t.id" :value="t.id">{{ t.typeName }}</option>
        </select>
        <select v-model="filterStatus" class="gc-select" @change="currentPage=1;loadApplies()">
          <option value="">全部状态</option>
          <option :value="2">待学院审批</option>
          <option :value="3">待学校审批</option>
          <option :value="4">已通过</option>
          <option :value="5">已驳回</option>
        </select>
        <select v-model="filterUrgency" class="gc-select" @change="currentPage=1;loadApplies()">
          <option value="">全部紧急程度</option>
          <option :value="1">普通</option>
          <option :value="2">紧急</option>
          <option :value="3">特急</option>
        </select>
        <button class="secondary" @click="currentPage=1;loadApplies()">查询</button>
      </div>
      <p v-if="error" class="error-message">{{ error }}</p>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>编号</th><th>标题</th><th>类型</th><th>辅导员</th><th>金额</th><th>紧急</th><th>状态</th><th>下发</th><th>提交时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="10" class="center-text">加载中…</td></tr>
            <tr v-else-if="!applies.length"><td colspan="10" class="center-text">暂无待审批申请</td></tr>
            <tr v-for="a in applies" :key="a.id" v-else>
              <td class="no-wrap">{{ a.applyNo }}</td>
              <td>{{ a.title }}</td>
              <td>{{ a.typeName }}</td>
              <td>{{ a.tutorName }}</td>
              <td class="money-cell">{{ a.amount ? formatMoney(a.amount) : '-' }}</td>
              <td><span :class="urgencyClass(a.urgency)">{{ urgencyLabel(a.urgency) }}</span></td>
              <td><span class="status-badge" :class="statusClass(a.status)">{{ statusLabel(a.status) }}</span></td>
              <td>
                <span v-if="a.disburseStatus && a.disburseStatus > 0" class="disburse-badge" :class="disburseClass(a.disburseStatus)">{{ disburseLabel(a.disburseStatus) }}</span>
                <span v-else>-</span>
              </td>
              <td class="no-wrap">{{ formatTime(a.submitTime || a.applyTime) }}</td>
              <td class="no-wrap">
                <button class="text-btn" @click="openDetail(a)">详情</button>
                <button v-if="a.status === 2 || a.status === 3" class="text-btn edit-btn" @click="openReview(a)">审核</button>
                <button v-if="isSchool && a.status === 4 && a.disburseStatus === 1" class="text-btn disburse-btn" @click="handleDisburse(a)">下发</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalElements>0" class="pagination">
        <button :disabled="currentPage<=1" @click="reviewPrevPage">上一页</button>
        <span>第 {{ currentPage }} / {{ totalPages }} 页（{{ totalElements }} 条）</span>
        <button :disabled="currentPage>=totalPages" @click="reviewNextPage">下一页</button>
      </div>
    </template>

    <!-- ==================== 资金发放 ==================== -->
    <template v-if="activeTab === 'disburse'">
      <!-- 金额汇总 -->
      <div v-if="disburseSummary" class="amount-summary">
        <span>待下发总金额 <strong>{{ formatMoney(disburseSummary.pendingAmount || 0) }}</strong></span>
        <span class="sep">|</span>
        <span>已下发总金额 <strong>{{ formatMoney(disburseSummary.disbursedAmount || 0) }}</strong></span>
      </div>

      <div class="filter-bar">
        <select v-model="disburseFilterStatus" class="gc-select" @change="disbursePage=1;loadDisburseList()">
          <option value="">全部下发状态</option>
          <option :value="1">待下发</option>
          <option :value="2">已下发</option>
        </select>
        <select v-model="disburseFilterType" class="gc-select" @change="disbursePage=1;loadDisburseList()">
          <option value="">全部类型</option>
          <option v-for="t in applyTypes" :key="t.id" :value="t.id">{{ t.typeName }}</option>
        </select>
        <button class="secondary" @click="disbursePage=1;loadDisburseList()">查询</button>
        <button v-if="selectedIds.size > 0" class="batch-disburse-btn" :disabled="batchLoading" @click="handleBatchDisburse">
          {{ batchLoading ? '下发中…' : `批量下发（${selectedIds.size}）` }}
        </button>
      </div>
      <p v-if="disburseError" class="error-message">{{ disburseError }}</p>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:36px"><input type="checkbox" v-model="selectAll" @change="toggleSelectAll" title="全选待下发" /></th>
              <th>编号</th><th>标题</th><th>类型</th><th>辅导员</th><th>金额</th><th>下发状态</th><th>下发时间</th><th>提交时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="disburseLoading"><td colspan="10" class="center-text">加载中…</td></tr>
            <tr v-else-if="!disburseItems.length"><td colspan="10" class="center-text">暂无涉及资金的申请</td></tr>
            <tr v-for="a in disburseItems" :key="a.id" v-else :class="{ 'row-done': a.disburseStatus === 2 }">
              <td>
                <input v-if="a.disburseStatus === 1" type="checkbox" :checked="selectedIds.has(a.id)" @change="toggleOne(a.id)" />
              </td>
              <td class="no-wrap">{{ a.applyNo }}</td>
              <td>{{ a.title }}</td>
              <td>{{ a.typeName }}</td>
              <td>{{ a.tutorName }}</td>
              <td class="money-cell">{{ a.amount ? formatMoney(a.amount) : '-' }}</td>
              <td><span class="disburse-badge" :class="disburseClass(a.disburseStatus)">{{ disburseLabel(a.disburseStatus) }}</span></td>
              <td class="no-wrap">{{ a.disburseTime ? formatTime(a.disburseTime) : '-' }}</td>
              <td class="no-wrap">{{ formatTime(a.submitTime || a.applyTime) }}</td>
              <td class="no-wrap">
                <button class="text-btn" @click="openDetail(a)">详情</button>
                <button v-if="a.disburseStatus === 1" class="text-btn disburse-btn" @click="handleDisburse(a)">下发</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="disburseTotal>0" class="pagination">
        <button :disabled="disbursePage<=1" @click="disbursePrevPage">上一页</button>
        <span>第 {{ disbursePage }} / {{ disburseTotalPages }} 页（{{ disburseTotal }} 条）</span>
        <button :disabled="disbursePage>=disburseTotalPages" @click="disburseNextPage">下一页</button>
      </div>

    </template>

    <!-- ==================== 台账导出 ==================== -->
    <template v-if="activeTab === 'ledger'">
      <div class="filter-bar">
        <input type="date" v-model="ledgerDateStart" style="border:1px solid #cbdad0;border-radius:8px;padding:7px 10px;font-size:13px" />
        <span style="color:#9ca3af;display:flex;align-items:center">至</span>
        <input type="date" v-model="ledgerDateEnd" style="border:1px solid #cbdad0;border-radius:8px;padding:7px 10px;font-size:13px" />
        <button class="secondary" @click="loadLedgerSummary">查询</button>
        <button v-if="ledgerSelectedKeys.size > 0" class="batch-disburse-btn" :disabled="ledgerExporting" @click="exportLedger">
          {{ ledgerExporting ? '导出中…' : `导出选中（${ledgerSelectedKeys.size}）` }}
        </button>
        <button v-else @click="exportLedger" style="background:#6366f1;border:0;border-radius:10px;padding:10px 20px;color:white;font-weight:600;cursor:pointer" :disabled="ledgerExporting">
          {{ ledgerExporting ? '导出中…' : '导出Excel' }}
        </button>
      </div>

      <div v-if="ledgerSummary.length" class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:36px"><input type="checkbox" v-model="ledgerSelectAll" @change="toggleLedgerSelectAll" title="全选" /></th>
              <th>学院</th><th>类型</th><th>申请笔数</th><th>申请金额</th><th>已下发笔数</th><th>已下发金额</th><th>待下发笔数</th><th>待下发金额</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in ledgerSummary" :key="idx">
              <td><input type="checkbox" :checked="ledgerSelectedKeys.has(ledgerRowKey(row))" @change="toggleLedgerRow(row)" /></td>
              <td>{{ row.collegeName }}</td>
              <td>{{ row.typeName }}</td>
              <td>{{ row.totalCount }}</td>
              <td class="money-cell">{{ formatMoney(row.totalAmount) }}</td>
              <td>{{ row.disbursedCount }}</td>
              <td class="money-cell">{{ formatMoney(row.disbursedAmount) }}</td>
              <td>{{ row.pendingCount }}</td>
              <td class="money-cell">{{ formatMoney(row.pendingAmount) }}</td>
              <td><button class="text-btn" @click="openLedgerDetail(row.collegeId, row.typeId, row.collegeName + ' - ' + row.typeName)">明细</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!ledgerLoading" style="color:#9ca3af;margin-top:12px">暂无台账数据，请设置时间段后查询</p>
    </template>

    <!-- ==================== 审核弹窗 ==================== -->
    <div v-if="reviewTarget" class="modal-overlay" @click.self="reviewTarget=null">
      <div class="modal-card" style="max-width:560px">
        <h3>{{ isSchool ? '学校审批' : '学院审批' }}</h3>
        <div style="margin-bottom:16px">
          <p><strong>申请编号：</strong>{{ reviewTarget.applyNo }}</p>
          <p><strong>标题：</strong>{{ reviewTarget.title }}</p>
          <p><strong>类型：</strong>{{ reviewTarget.typeName }}</p>
          <p><strong>辅导员：</strong>{{ reviewTarget.tutorName }}</p>
          <p v-if="reviewTarget.amount"><strong>金额：</strong>{{ formatMoney(reviewTarget.amount) }}</p>
          <p><strong>紧急程度：</strong><span :class="urgencyClass(reviewTarget.urgency)">{{ urgencyLabel(reviewTarget.urgency) }}</span></p>
          <p style="white-space:pre-wrap;margin-top:8px"><strong>事由：</strong>{{ reviewTarget.description }}</p>
        </div>
        <label>审核动作</label>
        <select v-model="reviewForm.action" class="gc-select" style="width:100%;margin-bottom:12px">
          <option :value="1">通过</option>
          <option :value="2">驳回</option>
          <option :value="3">转交</option>
          <option v-if="isSchool" :value="4">备案（直接通过）</option>
        </select>
        <label>审核意见 <span v-if="reviewForm.action===2||reviewForm.action===3" style="color:red">*</span></label>
        <textarea v-model.trim="reviewForm.comment" placeholder="请输入审核意见" rows="3" style="width:100%;margin-bottom:16px;border:1px solid #cbdad0;border-radius:12px;padding:10px 14px;font:inherit" />
        <div style="display:flex;gap:12px;justify-content:flex-end">
          <button class="secondary" @click="reviewTarget=null">取消</button>
          <button :disabled="reviewing" @click="handleSubmitReview">{{ reviewing ? '提交中…' : '确认审核' }}</button>
        </div>
      </div>
    </div>

    <!-- ==================== 台账明细弹窗 ==================== -->
    <div v-if="ledgerDetailModal" class="modal-overlay" @click.self="ledgerDetailModal=false">
      <div class="modal-card" style="max-width:800px">
        <h3>明细：{{ ledgerDetailTitle }}</h3>
        <div class="table-card" style="margin-top:12px;max-height:55vh;overflow-y:auto">
          <table class="data-table">
            <thead><tr><th>编号</th><th>标题</th><th>辅导员</th><th>金额</th><th>下发状态</th><th>下发时间</th><th>提交时间</th></tr></thead>
            <tbody>
              <tr v-if="!ledgerDetailItems.length"><td colspan="7" class="center-text">暂无明细</td></tr>
              <tr v-for="d in ledgerDetailItems" :key="d.id">
                <td class="no-wrap">{{ d.applyNo }}</td>
                <td>{{ d.title }}</td>
                <td>{{ d.tutorName }}</td>
                <td class="money-cell">{{ formatMoney(d.amount) }}</td>
                <td><span class="disburse-badge" :class="disburseClass(d.disburseStatus)">{{ disburseLabel(d.disburseStatus) }}</span></td>
                <td class="no-wrap">{{ d.disburseTime ? formatTime(d.disburseTime) : '-' }}</td>
                <td class="no-wrap">{{ formatTime(d.submitTime) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="margin-top:8px;color:#9ca3af;font-size:13px">共 {{ ledgerDetailTotal }} 条</p>
        <div style="text-align:right;margin-top:12px">
          <button @click="ledgerDetailModal=false">关闭</button>
        </div>
      </div>
    </div>

    <!-- ==================== 详情弹窗 ==================== -->
    <div v-if="detailTarget" class="modal-overlay" @click.self="detailTarget=null">
      <div class="modal-card" style="max-width:720px">
        <h3>申请详情</h3>
        <div v-if="detailLoading"><p>加载中…</p></div>
        <div v-else>
          <div class="detail-grid">
            <p><strong>编号：</strong>{{ detailTarget.applyNo }}</p>
            <p><strong>类型：</strong>{{ detailTarget.typeName }}</p>
            <p><strong>标题：</strong>{{ detailTarget.title }}</p>
            <p><strong>状态：</strong><span class="status-badge" :class="statusClass(detailTarget.status)">{{ statusLabel(detailTarget.status) }}</span></p>
            <p><strong>辅导员：</strong>{{ detailTarget.tutorName }}</p>
            <p><strong>紧急程度：</strong>{{ urgencyLabel(detailTarget.urgency) }}</p>
            <p v-if="detailTarget.amount"><strong>金额：</strong>{{ formatMoney(detailTarget.amount) }}</p>
            <p v-if="detailTarget.disburseStatus && detailTarget.disburseStatus > 0">
              <strong>下发：</strong><span class="disburse-badge" :class="disburseClass(detailTarget.disburseStatus)">{{ disburseLabel(detailTarget.disburseStatus) }}</span>
            </p>
            <p v-if="detailTarget.disburseTime"><strong>下发时间：</strong>{{ formatTime(detailTarget.disburseTime) }}</p>
            <p><strong>提交时间：</strong>{{ formatTime(detailTarget.submitTime || detailTarget.applyTime) }}</p>
          </div>
          <div style="margin-top:16px">
            <strong>事由：</strong>
            <p style="white-space:pre-wrap;margin-top:8px;color:#374151">{{ detailTarget.description }}</p>
          </div>
          <div v-if="detailTarget.students && detailTarget.students.length" style="margin-top:16px">
            <strong>关联学生：</strong>
            <ul style="margin-top:8px;padding-left:20px">
              <li v-for="stu in detailTarget.students" :key="stu.studentId">{{ stu.studentName }}（{{ stu.studentNo }}） - {{ stu.collegeName }} - {{ povertyLabel(stu.povertyLevel) }}</li>
            </ul>
          </div>
          <div v-if="detailTarget.reviews && detailTarget.reviews.length" style="margin-top:24px">
            <strong>审批记录：</strong>
            <div class="timeline">
              <div v-for="(r, idx) in detailTarget.reviews" :key="idx" class="timeline-item">
                <div class="timeline-dot" :class="r.action === 1 || r.action === 4 ? 'dot-pass' : 'dot-reject'"></div>
                <div>
                  <p><strong>{{ r.reviewerName }}</strong>（{{ reviewerRoleLabel(r.reviewerRole) }}）- {{ actionLabel(r.action) }}</p>
                  <p v-if="r.comment" style="color:#6b7280">{{ r.comment }}</p>
                  <p class="timeline-time">{{ formatTime(r.reviewTime) }}</p>
                </div>
              </div>
              <div v-if="detailTarget.disburseTime" class="timeline-item">
                <div class="timeline-dot dot-disburse"></div>
                <div>
                  <p><strong>资金已下发</strong></p>
                  <p class="timeline-time">{{ formatTime(detailTarget.disburseTime) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;gap:12px;justify-content:flex-end">
          <button v-if="isSchool && detailTarget.status === 4 && detailTarget.disburseStatus === 1" @click="handleDisburse(detailTarget); detailTarget=null">确认下发</button>
          <button class="secondary" @click="detailTarget=null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Tab 切换 ===== */
.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; background: #eef3f0; border-radius: 10px; padding: 4px; width: fit-content; }
.tab-btn {
  border: 0; border-radius: 8px; padding: 10px 20px;
  background: transparent; color: #6b7280; font-weight: 600; font-size: 14px;
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
}
.tab-btn.active { background: white; color: #16352c; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.tab-btn:hover:not(.active) { color: #374151; }
.tab-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; border-radius: 10px;
  background: #dc2626; color: white; font-size: 11px; font-weight: 700; padding: 0 6px;
}

/* ===== 汇总金额条 ===== */
.amount-summary {
  background: white; border-radius: 10px; padding: 12px 20px; margin-bottom: 16px;
  display: flex; gap: 16px; align-items: center; font-size: 14px; color: #6b7280;
  border: 1px solid rgba(25,89,66,.08);
}
.amount-summary strong { color: #16352c; }
.sep { color: #cbdad0; }

/* ===== 统计卡片可点击 ===== */
.stat-card { cursor: default; }
.stat-card.stat-active { cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
.stat-card.stat-active:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }

/* ===== 下拉框美化 ===== */
select.gc-select {
  appearance: none; -webkit-appearance: none;
  border: 1px solid #cbdad0; border-radius: 10px;
  padding: 9px 36px 9px 14px;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23668077' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center;
  font: inherit; font-size: 14px; color: #16352c; cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
select.gc-select:focus { outline: none; border-color: #217a58; box-shadow: 0 0 0 3px rgba(33,122,88,.12); }

/* ===== 标签与样式 ===== */
.disburse-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.disburse-wait { background: #fef3c7; color: #92400e; }
.disburse-ok { background: #d1fae5; color: #065f46; }
.disburse-btn { color: #6366f1 !important; }
.money-cell { font-variant-numeric: tabular-nums; white-space: nowrap; }
.no-wrap { white-space: nowrap; }
.row-done { opacity: .55; }
.dot-disburse { background: #6366f1; }

.view-container { width: 100%; }
.view-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.view-title { margin: 0 0 4px 0; font-size: 24px; }
.stat-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-card {
  background: white; border-radius: 12px; padding: 16px 24px; border: 1px solid rgba(25,89,66,.08);
  display: flex; flex-direction: column; gap: 4px; min-width: 120px;
}
.stat-num { font-size: 24px; font-weight: 700; }
.stat-desc { font-size: 13px; color: #6b7280; }
.stat-warn .stat-num { color: #d97706; }
.stat-ok .stat-num { color: #059669; }
.stat-err .stat-num { color: #dc2626; }
.stat-disburse .stat-num { color: #6366f1; }
.stat-disbursed .stat-num { color: #059669; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.batch-disburse-btn {
  margin-left: auto; border: 0; border-radius: 10px; padding: 10px 20px;
  background: #6366f1; color: white; font-weight: 600; font-size: 14px; cursor: pointer;
}
.batch-disburse-btn:disabled { opacity: .6; cursor: wait; }
.table-card { background: white; border-radius: 12px; border: 1px solid rgba(25,89,66,.08); overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { background: #f3f8f5; font-weight: 600; padding: 12px 14px; text-align: left; border-bottom: 1px solid #cbdad0; white-space: nowrap; }
.data-table td { padding: 12px 14px; border-bottom: 1px solid #edf4ef; }
.center-text { text-align: center; color: #9ca3af; }
.status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.status-0 { background: #d1fae5; color: #065f46; }
.status-1 { background: #fef3c7; color: #92400e; }
.status-2 { background: #fee2e2; color: #991b1b; }
.status-3 { background: #e5e7eb; color: #6b7280; }
.text-btn { background: none; border: 0; color: #217a58; cursor: pointer; font-weight: 600; padding: 2px 8px; }
.edit-btn { color: #6366f1; }
.error-message { color: #dc2626; font-size: 14px; margin-bottom: 12px; }
.pagination { display: flex; justify-content: center; gap: 16px; align-items: center; margin-top: 16px; font-size: 14px; }
.pagination button { background: #217a58; color: white; border: 0; padding: 8px 16px; border-radius: 8px; font-size: 13px; }
.pagination button:disabled { opacity: .5; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: grid; place-items: center; z-index: 100; }
.modal-card { background: white; border-radius: 16px; padding: 32px; width: min(100%, 560px); max-height: 85vh; overflow-y: auto; box-shadow: 0 16px 48px rgba(0,0,0,.2); }
.modal-card h3 { margin-bottom: 16px; font-size: 20px; }
.modal-card label { display: block; font-weight: 600; margin-bottom: 4px; font-size: 14px; }
.modal-card input, .modal-card textarea { font: inherit; }
.modal-card button.secondary { background: #e5e7eb; color: #374151; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.timeline { margin-top: 8px; }
.timeline-item { display: flex; gap: 12px; padding: 8px 0; border-left: 2px solid #cbdad0; padding-left: 16px; position: relative; }
.timeline-dot { position: absolute; left: -6px; top: 12px; width: 10px; height: 10px; border-radius: 50%; }
.dot-pass { background: #217a58; }
.dot-reject { background: #9b2226; }
.timeline-time { font-size: 12px; color: #9ca3af; }
.urgency-1 { color: #6b7280; }
.urgency-2 { color: #d97706; font-weight: 600; }
.urgency-3 { color: #dc2626; font-weight: 700; }
</style>
