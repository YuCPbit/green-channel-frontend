<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getLedgerList, getLedgerSummary, getLedgerDetail,
  confirmDisburse, batchConfirmDisburse,
  getSubsidyBatches, getColleges, getLedgerExportUrl
} from '../../api.js'

const props = defineProps({
  userType: { type: Number, default: 4 },
  menuName: { type: String, default: '' },
  user: { type: Object, default: () => ({}) }
})

// ---- 数据状态 ----
const ledgers = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalElements = ref(0)

// ---- 筛选条件 ----
const filterBatchId = ref('')
const filterDisburseStatus = ref('')
const filterStudentName = ref('')
const filterCollegeId = ref('')

// ---- 下拉选项 ----
const batches = ref([])
const colleges = ref([])

// ---- 汇总统计 ----
const summary = ref({
  totalAmount: 0, totalCount: 0,
  pendingCount: 0, pendingAmount: 0,
  doneCount: 0, doneAmount: 0,
  failedCount: 0
})

// ---- 弹窗状态 ----
const showDisburseModal = ref(false)
const disburseTarget = ref(null)
const showBatchDisburseModal = ref(false)
const selectedIds = ref([])
const showDetailModal = ref(false)
const detailTarget = ref(null)

const totalPages = computed(() => Math.ceil(totalElements.value / pageSize.value) || 1)

onMounted(async () => {
  await Promise.all([loadBatches(), loadColleges(), doSearch()])
})

// ---- 工具函数 ----
const formatMoney = (v) => {
  if (v === null || v === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(v)
}

const formatTime = (t) => t ? t.replace('T', ' ') : '-'

const subsidyTypeLabel = (t) => ({ 1: '生活补助', 2: '路费补助', 3: '临时困难补助' }[t] || '其他')

const disburseStatusLabel = (s) => ({ 0: '待发放', 1: '已发放', 2: '发放失败' }[s] || '未知')

const disburseStatusClass = (s) => {
  if (s === 0) return 'status-0'
  if (s === 1) return 'status-1'
  return 'status-2'
}

// ---- 加载下拉数据 ----
async function loadBatches() {
  try {
    const data = await getSubsidyBatches({ page: 0, size: 100 })
    batches.value = (data && data.content) ? data.content : []
  } catch (e) { /* 忽略 */ }
}

async function loadColleges() {
  try {
    colleges.value = (await getColleges()) || []
  } catch (e) { /* 忽略 */ }
}

// ---- 查询 ----
async function doSearch() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      batchId: filterBatchId.value || undefined,
      disburseStatus: filterDisburseStatus.value !== '' ? filterDisburseStatus.value : undefined,
      studentName: filterStudentName.value || undefined,
      collegeId: filterCollegeId.value || undefined
    }
    const result = await getLedgerList(params)
    ledgers.value = result.items || []
    totalElements.value = result.total || 0

    // 加载汇总
    const s = await getLedgerSummary(filterBatchId.value || undefined)
    summary.value = s
  } catch (e) {
    error.value = e.message || '加载台账失败'
    ledgers.value = []
  } finally {
    loading.value = false
  }
}

function prevPage() { if (currentPage.value > 1) { currentPage.value--; doSearch() } }
function nextPage() { if (currentPage.value < totalPages.value) { currentPage.value++; doSearch() } }

// ---- 选择 ----
function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) { selectedIds.value.splice(idx, 1) }
  else { selectedIds.value.push(id) }
}

function selectAll() {
  if (selectedIds.value.length === ledgers.value.filter(l => l.disburseStatus === 0).length) {
    selectedIds.value = []
  } else {
    selectedIds.value = ledgers.value.filter(l => l.disburseStatus === 0).map(l => l.id)
  }
}

// ---- 发放操作 ----
function openDisburse(item) {
  disburseTarget.value = item
  showDisburseModal.value = true
}

async function doConfirmDisburse() {
  if (!disburseTarget.value) return
  try {
    await confirmDisburse(disburseTarget.value.id)
    showDisburseModal.value = false
    disburseTarget.value = null
    await doSearch()
  } catch (e) {
    alert(e.message || '发放确认失败')
  }
}

async function doConfirmBatchDisburse() {
  if (selectedIds.value.length === 0) { alert('请先选择需要发放的记录'); return }
  try {
    await batchConfirmDisburse({ ledgerIds: selectedIds.value })
    showBatchDisburseModal.value = false
    selectedIds.value = []
    await doSearch()
  } catch (e) {
    alert(e.message || '批量发放失败')
  }
}

// ---- 详情 ----
async function openDetail(item) {
  try {
    detailTarget.value = await getLedgerDetail(item.id)
    showDetailModal.value = true
  } catch (e) {
    alert(e.message || '加载详情失败')
  }
}

// ---- 导出 ----
function doExport() {
  const params = {
    batchId: filterBatchId.value || undefined,
    disburseStatus: filterDisburseStatus.value !== '' ? filterDisburseStatus.value : undefined,
    collegeId: filterCollegeId.value || undefined
  }
  window.open(getLedgerExportUrl(params), '_blank')
}
</script>

<template>
  <div class="view-container">
    <!-- 标题 -->
    <header class="view-header">
      <h2 class="view-title">资金台账</h2>
      <p class="subtitle">管理补助发放明细台账，确认发放状态，导出对账清单。</p>
    </header>

    <!-- 汇总卡片 -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">总笔数</div>
        <div class="metric-value">{{ summary.totalCount }}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">总金额</div>
        <div class="metric-value">{{ formatMoney(summary.totalAmount) }}</div>
      </div>
      <div class="metric-card pending">
        <div class="metric-label">待发放</div>
        <div class="metric-value">{{ summary.pendingCount }} 笔 / {{ formatMoney(summary.pendingAmount) }}</div>
      </div>
      <div class="metric-card done">
        <div class="metric-label">已发放</div>
        <div class="metric-value">{{ summary.doneCount }} 笔 / {{ formatMoney(summary.doneAmount) }}</div>
      </div>
      <div class="metric-card failed" v-if="summary.failedCount > 0">
        <div class="metric-label">发放失败</div>
        <div class="metric-value">{{ summary.failedCount }} 笔</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <select v-model="filterBatchId">
        <option value="">全部批次</option>
        <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchName }}</option>
      </select>
      <select v-model="filterDisburseStatus">
        <option value="">全部状态</option>
        <option :value="0">待发放</option>
        <option :value="1">已发放</option>
        <option :value="2">发放失败</option>
      </select>
      <select v-model="filterCollegeId">
        <option value="">全部学院</option>
        <option v-for="c in colleges" :key="c.id" :value="c.id">{{ c.collegeName }}</option>
      </select>
      <input v-model="filterStudentName" type="text" placeholder="学号或姓名" style="width:140px" @keyup.enter="doSearch" />
      <button class="primary-btn" @click="doSearch">查询</button>
      <button class="secondary" @click="doExport">导出Excel</button>
      <button v-if="selectedIds.length > 0" class="primary-btn" style="background:#b53f3f" @click="showBatchDisburseModal = true">
        批量发放 ({{ selectedIds.length }})
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:40px"><input type="checkbox" @change="selectAll" /></th>
            <th style="width:40px">#</th>
            <th>批次名称</th>
            <th>申请编号</th>
            <th>学号</th>
            <th>姓名</th>
            <th>学院</th>
            <th>年级</th>
            <th>补助类型</th>
            <th>审批金额</th>
            <th>发放状态</th>
            <th>发放时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="13" class="center-text">加载中……</td>
          </tr>
          <tr v-else-if="ledgers.length === 0">
            <td colspan="13" class="center-text">暂无台账记录</td>
          </tr>
          <tr v-for="(item, idx) in ledgers" :key="item.id">
            <td>
              <input type="checkbox" v-if="item.disburseStatus === 0"
                :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
            </td>
            <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
            <td><span class="text-btn" @click="openDetail(item)">{{ item.batchName }}</span></td>
            <td>{{ item.applyNo }}</td>
            <td>{{ item.studentNo }}</td>
            <td>{{ item.studentName }}</td>
            <td>{{ item.collegeName }}</td>
            <td>{{ item.grade }}</td>
            <td>{{ item.subsidyTypeName }}</td>
            <td>{{ formatMoney(item.approvedAmount) }}</td>
            <td><span class="status-badge" :class="disburseStatusClass(item.disburseStatus)">{{ disburseStatusLabel(item.disburseStatus) }}</span></td>
            <td>{{ formatTime(item.disburseTime) }}</td>
            <td>
              <button v-if="item.disburseStatus === 0" class="text-btn" @click="openDisburse(item)">确认发放</button>
              <span v-else class="text-btn" style="color:#999">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalElements > 0">
      <button :disabled="currentPage <= 1" @click="prevPage">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页（共 {{ totalElements }} 条）</span>
      <button :disabled="currentPage >= totalPages" @click="nextPage">下一页</button>
    </div>

    <!-- 发放确认弹窗 -->
    <div v-if="showDisburseModal" class="modal-overlay" @click.self="showDisburseModal = false">
      <div class="modal-card">
        <h3>确认发放</h3>
        <div class="detail-grid" style="margin-bottom:16px">
          <div><strong>学生：</strong>{{ disburseTarget?.studentName }} ({{ disburseTarget?.studentNo }})</div>
          <div><strong>金额：</strong>{{ formatMoney(disburseTarget?.approvedAmount) }}</div>
          <div><strong>批次：</strong>{{ disburseTarget?.batchName }}</div>
          <div><strong>类型：</strong>{{ disburseTarget?.subsidyTypeName }}</div>
        </div>
        <p style="color:#666;font-size:13px">确认后将标记为"已发放"，学生端可查看发放状态。</p>
        <div class="modal-actions">
          <button class="secondary" @click="showDisburseModal = false">取消</button>
          <button class="primary-btn" @click="doConfirmDisburse">确认发放</button>
        </div>
      </div>
    </div>

    <!-- 批量发放确认弹窗 -->
    <div v-if="showBatchDisburseModal" class="modal-overlay" @click.self="showBatchDisburseModal = false">
      <div class="modal-card">
        <h3>批量确认发放</h3>
        <p>确认将选中的 <strong>{{ selectedIds.length }}</strong> 条记录标记为"已发放"？</p>
        <div class="modal-actions">
          <button class="secondary" @click="showBatchDisburseModal = false">取消</button>
          <button class="primary-btn" @click="doConfirmBatchDisburse">确认发放</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-card" style="max-width:600px">
        <h3>台账详情</h3>
        <div class="detail-grid">
          <div><strong>批次：</strong>{{ detailTarget?.batchName }}</div>
          <div><strong>申请编号：</strong>{{ detailTarget?.applyNo }}</div>
          <div><strong>学号：</strong>{{ detailTarget?.studentNo }}</div>
          <div><strong>姓名：</strong>{{ detailTarget?.studentName }}</div>
          <div><strong>学院：</strong>{{ detailTarget?.collegeName }}</div>
          <div><strong>年级：</strong>{{ detailTarget?.grade }}</div>
          <div><strong>补助类型：</strong>{{ detailTarget?.subsidyTypeName }}</div>
          <div><strong>审批金额：</strong>{{ formatMoney(detailTarget?.approvedAmount) }}</div>
          <div><strong>发放状态：</strong>{{ detailTarget?.disburseStatusName }}</div>
          <div><strong>发放时间：</strong>{{ formatTime(detailTarget?.disburseTime) }}</div>
          <div><strong>银行卡号：</strong>{{ detailTarget?.bankCardNo || '未填写' }}</div>
          <div><strong>操作人：</strong>{{ detailTarget?.disburseOperatorName || '-' }}</div>
          <div><strong>备注：</strong>{{ detailTarget?.remark || '-' }}</div>
        </div>
        <div class="modal-actions">
          <button class="secondary" @click="showDetailModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { display:flex; flex-direction:column; gap:24px; }
.view-header { display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:8px; }
.view-title { margin:0; font-size:24px; color:#16352c; }
.subtitle { color:#668077; font-size:14px; margin:0; }

/* 汇总卡片 */
.metrics-grid { display:flex; gap:16px; flex-wrap:wrap; }
.metric-card { flex:1; min-width:160px; background:#fff; border-radius:14px; padding:16px 20px; box-shadow:0 2px 8px rgba(27,74,57,.06); }
.metric-label { font-size:13px; color:#668077; margin-bottom:4px; }
.metric-value { font-size:22px; font-weight:700; color:#16352c; }
.metric-card.pending .metric-value { color:#b07828; }
.metric-card.done .metric-value { color:#217a58; }
.metric-card.failed .metric-value { color:#b53f3f; }

/* 筛选栏 */
.filter-bar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.filter-bar select, .filter-bar input { padding:8px 12px; border:1px solid #d0dbd4; border-radius:10px; font-size:14px; color:#16352c; background:#fff; outline:none; }
.filter-bar select:focus, .filter-bar input:focus { border-color:#217a58; }
.primary-btn { background:#217a58; color:#fff; border:none; padding:8px 18px; border-radius:10px; font-size:14px; cursor:pointer; }
.primary-btn:hover { background:#1a6346; }
.secondary { background:#e7f1eb; color:#217a58; border:1px solid #d0dbd4; padding:8px 18px; border-radius:10px; font-size:14px; cursor:pointer; }
.secondary:hover { background:#d0e4d8; }

/* 表格 */
.table-card { background:#fff; border-radius:18px; padding:20px; box-shadow:0 2px 8px rgba(27,74,57,.04); overflow-x:auto; }
.data-table { width:100%; border-collapse:collapse; font-size:14px; }
.data-table th { text-align:left; padding:12px 8px; border-bottom:2px solid #e7f1eb; color:#50816d; font-weight:600; white-space:nowrap; }
.data-table td { padding:10px 8px; border-bottom:1px solid #f0f5f2; color:#16352c; }
.data-table tbody tr:hover { background:#f7faf7; }
.center-text { text-align:center; color:#999; padding:24px; }
.status-badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600; }
.status-0 { background:#fef5e7; color:#b07828; }
.status-1 { background:#e7f1eb; color:#217a58; }
.status-2 { background:#fce8e8; color:#b53f3f; }
.text-btn { background:none; border:none; color:#217a58; cursor:pointer; padding:2px 4px; font-size:13px; text-decoration:underline; }
.text-btn:hover { color:#1a6346; }

/* 分页 */
.pagination { display:flex; gap:12px; align-items:center; justify-content:center; }
.pagination button { padding:6px 14px; border:1px solid #d0dbd4; border-radius:8px; background:#fff; color:#217a58; cursor:pointer; font-size:13px; }
.pagination button:disabled { color:#ccc; cursor:not-allowed; }
.pagination span { color:#668077; font-size:13px; }

/* 弹窗 */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.25); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal-card { background:#fff; border-radius:24px; padding:28px; max-width:520px; width:90%; box-shadow:0 8px 32px rgba(0,0,0,.12); }
.modal-card h3 { margin:0 0 16px; font-size:18px; color:#16352c; }
.modal-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:20px; }
.detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; font-size:14px; }
.detail-grid div { color:#16352c; }
</style>
