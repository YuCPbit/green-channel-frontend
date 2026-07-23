<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  getSubsidyBatches, getAllocationSummary, getAllocationList, allocateQuota, getColleges, getGrades,
  getLedgerList, getLedgerSummary, getLedgerDetail,
  confirmDisburse, batchConfirmDisburse, getLedgerExportUrl
} from '../../api'

const props = defineProps({
  userType: { type: Number, default: 4 },
  menuName: { type: String, default: '' },
  user: { type: Object, default: () => ({}) }
})

// ---- 视图模式 ----
const isSchool = computed(() => props.userType === 4)
const isCollege = computed(() => props.userType === 3)

const viewTitle = computed(() => isSchool.value ? '资金管理看板' : '学院额度管理')
const viewSubtitle = computed(() =>
  isSchool.value
    ? '实时监控全校资金池，向各学院下发额度'
    : '查看本院可用额度并向各年级分配'
)

// ---- Tab 切换（仅学校端） ----
const currentTab = ref('quota')

// ---- 批次选择 ----
const batches = ref([])
const selectedBatchId = ref(null)

// ---- 额度汇总 ----
const loading = ref(false)
const error = ref('')
const summary = ref({ totalAmount: 0, allocatedAmount: 0, availableAmount: 0 })

// ---- 分配明细 ----
const allocationItems = ref([])

// ---- 分配弹窗 ----
const showModal = ref(false)
const form = ref({ targetId: null, targetName: '', amount: '' })
const saving = ref(false)

// 学院/年级选项
const collegeOptions = ref([])
const gradeOptions = ref([])

const currentBatchStatus = computed(() => {
  const batch = batches.value.find(b => b.id === selectedBatchId.value)
  return batch ? batch.status : null
})

const targetLabel = computed(() => (isSchool.value ? '目标学院' : '目标年级'))

// ---- 格式化 ----
const formatMoney = (val) => {
  const num = Number(val) || 0
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(num)
}
const formatTime = (t) => t ? t.replace('T', ' ') : '-'

// ---- 分配金额上下限 ----
const maxAllocationAmount = computed(() => {
  if (isSchool.value) {
    const currentAmount = getTargetAmount(form.value.targetId)
    return summary.value.availableAmount + currentAmount
  }
  if (currentBatchStatus.value === 0) return summary.value.totalAmount
  return summary.value.availableAmount
})

const minAllocationAmount = computed(() => {
  const currentAmount = getTargetAmount(form.value.targetId)
  if (isSchool.value) return Math.max(0.01, currentAmount)
  if (currentBatchStatus.value === 0) return 0.01
  return Math.max(0.01, currentAmount)
})

// ---- 加载批次列表 ----
async function loadBatches() {
  try {
    const data = await getSubsidyBatches({ size: 50 })
    batches.value = (data && data.content) ? data.content : []
    if (batches.value.length && !selectedBatchId.value) {
      selectedBatchId.value = batches.value[0].id
    }
  } catch (e) {
    console.error('加载批次列表失败', e)
  }
}

// ---- 加载学院和年级列表 ----
async function loadCollegeOptions() {
  try {
    const data = await getColleges()
    collegeOptions.value = (data || []).map(c => ({ id: c.id, name: c.collegeName }))
  } catch (e) {
    console.error('加载学院列表失败', e)
  }
}

async function loadGradeOptions() {
  try {
    const data = await getGrades()
    gradeOptions.value = (data || []).map(g => ({ id: g, name: g + '级' }))
  } catch (e) {
    console.error('加载年级列表失败', e)
  }
}

// ---- 加载汇总 ----
async function loadSummary() {
  if (!selectedBatchId.value) return
  loading.value = true
  error.value = ''
  try {
    const data = await getAllocationSummary(selectedBatchId.value, {
      userType: props.userType,
      collegeId: props.user?.collegeId
    })
    summary.value = {
      totalAmount: data.totalAmount || 0,
      allocatedAmount: data.allocatedAmount || 0,
      availableAmount: data.availableAmount || 0
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// ---- 加载分配明细 ----
async function loadAllocations() {
  if (!selectedBatchId.value) return
  try {
    const targetType = isSchool.value ? 1 : 2
    allocationItems.value = await getAllocationList(selectedBatchId.value, targetType)
  } catch (e) {
    console.error('加载分配明细失败', e)
    allocationItems.value = []
  }
}

function getTargetAmount(targetId) {
  const item = allocationItems.value.find(a => a.targetId === targetId)
  return item ? item.amount : 0
}

// ---- 分配操作 ----
async function submitAllocation() {
  if (!form.value.targetId || !form.value.amount) {
    alert('请完整填写目标对象和金额')
    return
  }
  if (Number(form.value.amount) <= 0) {
    alert('金额必须大于0')
    return
  }
  saving.value = true
  try {
    await allocateQuota(
      {
        batchId: selectedBatchId.value,
        targetType: isSchool.value ? 1 : 2,
        targetId: Number(form.value.targetId),
        amount: Number(form.value.amount)
      },
      {
        userType: props.userType,
        id: props.user?.id,
        collegeId: props.user?.collegeId
      }
    )
    showModal.value = false
    await Promise.all([loadSummary(), loadAllocations()])
  } catch (e) {
    alert('分配失败：' + e.message)
  } finally {
    saving.value = false
  }
}

// ===================== 台账 Tab 功能 =====================

// ---- 台账数据 ----
const ledgers = ref([])
const ledgerLoading = ref(false)
const ledgerError = ref('')
const ledgerPage = ref(1)
const ledgerPageSize = ref(20)
const ledgerTotal = ref(0)

const ledgerFilterBatchId = ref('')
const ledgerFilterStatus = ref('')
const ledgerFilterStudentName = ref('')
const ledgerFilterCollegeId = ref('')

const ledgerSummary = ref({
  totalAmount: 0, totalCount: 0,
  pendingCount: 0, pendingAmount: 0,
  doneCount: 0, doneAmount: 0,
  failedCount: 0
})

// ---- 台账弹窗 ----
const showDisburseModal = ref(false)
const disburseTarget = ref(null)
const showBatchDisburseModal = ref(false)
const ledgerSelectedIds = ref([])
const showLedgerDetailModal = ref(false)
const ledgerDetailTarget = ref(null)

const ledgerTotalPages = computed(() => Math.ceil(ledgerTotal.value / ledgerPageSize.value) || 1)

// ---- 台账工具函数 ----
const subsidyTypeLabel = (t) => ({ 1: '生活补助', 2: '路费补助', 3: '临时困难补助' }[t] || '其他')
const disburseStatusLabel = (s) => ({ 0: '待发放', 1: '已发放', 2: '发放失败' }[s] || '未知')
const disburseStatusClass = (s) => {
  if (s === 0) return 'status-pending'
  if (s === 1) return 'status-done'
  return 'status-failed'
}

// ---- 台账数据加载 ----
async function loadLedgerSummary() {
  try {
    const s = await getLedgerSummary(ledgerFilterBatchId.value || undefined)
    ledgerSummary.value = s
  } catch (e) { /* non-critical */ }
}

async function searchLedgers() {
  ledgerLoading.value = true
  ledgerError.value = ''
  try {
    const params = {
      page: ledgerPage.value,
      size: ledgerPageSize.value,
      batchId: ledgerFilterBatchId.value || undefined,
      disburseStatus: ledgerFilterStatus.value !== '' ? Number(ledgerFilterStatus.value) : undefined,
      studentName: ledgerFilterStudentName.value || undefined,
      collegeId: ledgerFilterCollegeId.value || undefined
    }
    const result = await getLedgerList(params)
    ledgers.value = result.items || []
    ledgerTotal.value = result.total || 0
    await loadLedgerSummary()
  } catch (e) {
    ledgerError.value = e.message || '加载台账失败'
    ledgers.value = []
  } finally {
    ledgerLoading.value = false
  }
}

function prevLedgerPage() { if (ledgerPage.value > 1) { ledgerPage.value--; searchLedgers() } }
function nextLedgerPage() { if (ledgerPage.value < ledgerTotalPages.value) { ledgerPage.value++; searchLedgers() } }

function toggleLedgerSelect(id) {
  const idx = ledgerSelectedIds.value.indexOf(id)
  if (idx >= 0) { ledgerSelectedIds.value.splice(idx, 1) }
  else { ledgerSelectedIds.value.push(id) }
}

function selectAllLedgers() {
  const pending = ledgers.value.filter(l => l.disburseStatus === 0)
  if (ledgerSelectedIds.value.length === pending.length) {
    ledgerSelectedIds.value = []
  } else {
    ledgerSelectedIds.value = pending.map(l => l.id)
  }
}

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
    await searchLedgers()
  } catch (e) {
    alert(e.message || '发放确认失败')
  }
}

async function doBatchDisburse() {
  if (ledgerSelectedIds.value.length === 0) { alert('请先选择需要发放的记录'); return }
  try {
    await batchConfirmDisburse({ ledgerIds: ledgerSelectedIds.value })
    showBatchDisburseModal.value = false
    ledgerSelectedIds.value = []
    await searchLedgers()
  } catch (e) {
    alert(e.message || '批量发放失败')
  }
}

async function openLedgerDetail(item) {
  try {
    ledgerDetailTarget.value = await getLedgerDetail(item.id)
    showLedgerDetailModal.value = true
  } catch (e) {
    alert(e.message || '加载详情失败')
  }
}

function doLedgerExport() {
  const params = {
    batchId: ledgerFilterBatchId.value || undefined,
    disburseStatus: ledgerFilterStatus.value !== '' ? Number(ledgerFilterStatus.value) : undefined,
    collegeId: ledgerFilterCollegeId.value || undefined
  }
  window.open(getLedgerExportUrl(params), '_blank')
}

// 切换到台账 Tab 时首次加载
watch(currentTab, (tab) => {
  if (tab === 'ledger' && ledgers.value.length === 0 && !ledgerLoading.value) {
    searchLedgers()
  }
})

// ---- 生命周期 ----
onMounted(async () => {
  await loadBatches()
  await Promise.all([loadSummary(), loadAllocations(), loadCollegeOptions(), loadGradeOptions()])
})

watch(selectedBatchId, () => {
  Promise.all([loadSummary(), loadAllocations()])
})
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h2 class="view-title">{{ viewTitle }}</h2>
        <p class="subtitle">{{ viewSubtitle }}</p>
      </div>
      <div class="header-right">
        <select v-model="selectedBatchId" class="batch-select">
          <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchName }}</option>
        </select>
      </div>
    </header>

    <!-- Tab 切换栏（仅学校端） -->
    <div v-if="isSchool" class="tab-bar">
      <button class="tab-btn" :class="{ active: currentTab === 'quota' }" @click="currentTab = 'quota'">额度管理</button>
      <button class="tab-btn" :class="{ active: currentTab === 'ledger' }" @click="currentTab = 'ledger'">资金台账</button>
    </div>

    <!-- ==================== 额度管理 Tab ==================== -->
    <template v-if="currentTab === 'quota'">
      <p v-if="error" class="error-message">{{ error }}</p>

      <div class="metrics-grid">
        <div class="metric-card">
          <span class="eyebrow">{{ isSchool ? '全校总额度' : '学院总额度' }}</span>
          <div class="value">{{ formatMoney(summary.totalAmount) }}</div>
        </div>
        <div class="metric-card">
          <span class="eyebrow">已下发额度</span>
          <div class="value text-warning">{{ formatMoney(summary.allocatedAmount) }}</div>
        </div>
        <div class="metric-card highlight">
          <span class="eyebrow">当前可用余额</span>
          <div class="value text-success">{{ formatMoney(summary.availableAmount) }}</div>
        </div>
      </div>

      <div class="table-card">
        <div v-if="loading" class="center-text">加载中…</div>
        <div v-else>
          <template v-if="isSchool">
            <table class="data-table">
              <thead>
                <tr><th>学院</th><th>分配总额</th><th>操作</th></tr>
              </thead>
              <tbody>
                <tr v-if="!collegeOptions.length"><td colspan="3" class="center-text">暂无学院数据</td></tr>
                <tr v-for="college in collegeOptions" :key="college.id">
                  <td><strong>{{ college.name }}</strong></td>
                  <td>{{ formatMoney(getTargetAmount(college.id)) }}</td>
                  <td><button class="text-btn" @click="form.targetId = college.id; form.targetName = college.name; showModal = true">下发额度</button></td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-if="isCollege">
            <table class="data-table">
              <thead>
                <tr><th>年级</th><th>分配总额</th><th>操作</th></tr>
              </thead>
              <tbody>
                <tr v-if="!gradeOptions.length"><td colspan="3" class="center-text">暂无年级数据</td></tr>
                <tr v-for="grade in gradeOptions" :key="grade.id">
                  <td><strong>{{ grade.name }}</strong></td>
                  <td>{{ formatMoney(getTargetAmount(grade.id)) }}</td>
                  <td><button class="text-btn" @click="form.targetId = grade.id; form.targetName = grade.name; showModal = true">下发额度</button></td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>

      <!-- 下发额度弹窗 -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card">
          <h3>下发额度</h3>
          <p class="modal-subtitle">当前可用余额：<strong>{{ formatMoney(summary.availableAmount) }}</strong></p>
          <form @submit.prevent="submitAllocation">
            <p class="target-display">{{ targetLabel }}：<strong>{{ form.targetName }}</strong></p>
            <label>下拨金额 (元)
              <input type="number" v-model="form.amount" required :min="minAllocationAmount" step="0.01" :max="maxAllocationAmount" placeholder="请输入金额" />
            </label>
            <div class="modal-actions">
              <button type="button" class="secondary" @click="showModal = false">取消</button>
              <button type="submit" :disabled="saving">{{ saving ? '提交中…' : '确认下发' }}</button>
            </div>
          </form>
        </div>
      </div>
    </template>

    <!-- ==================== 资金台账 Tab ==================== -->
    <template v-if="currentTab === 'ledger' && isSchool">
      <!-- 汇总卡片 -->
      <div class="metrics-grid">
        <div class="metric-card"><div class="metric-label">总笔数</div><div class="metric-value">{{ ledgerSummary.totalCount }}</div></div>
        <div class="metric-card"><div class="metric-label">总金额</div><div class="metric-value">{{ formatMoney(ledgerSummary.totalAmount) }}</div></div>
        <div class="metric-card pending"><div class="metric-label">待发放</div><div class="metric-value">{{ ledgerSummary.pendingCount }} 笔 / {{ formatMoney(ledgerSummary.pendingAmount) }}</div></div>
        <div class="metric-card done"><div class="metric-label">已发放</div><div class="metric-value">{{ ledgerSummary.doneCount }} 笔 / {{ formatMoney(ledgerSummary.doneAmount) }}</div></div>
        <div class="metric-card failed" v-if="ledgerSummary.failedCount > 0"><div class="metric-label">发放失败</div><div class="metric-value">{{ ledgerSummary.failedCount }} 笔</div></div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <select v-model="ledgerFilterBatchId" @change="ledgerPage = 1; searchLedgers()">
          <option value="">全部批次</option>
          <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchName }}</option>
        </select>
        <select v-model="ledgerFilterStatus" @change="ledgerPage = 1; searchLedgers()">
          <option value="">全部状态</option>
          <option value="0">待发放</option>
          <option value="1">已发放</option>
          <option value="2">发放失败</option>
        </select>
        <select v-model="ledgerFilterCollegeId" @change="ledgerPage = 1; searchLedgers()">
          <option value="">全部学院</option>
          <option v-for="c in collegeOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="ledgerFilterStudentName" type="text" placeholder="学号或姓名" style="width:140px" @keyup.enter="searchLedgers" />
        <button class="primary-btn" @click="ledgerPage = 1; searchLedgers()">查询</button>
        <button class="secondary" @click="doLedgerExport">导出Excel</button>
        <button v-if="ledgerSelectedIds.length > 0" class="primary-btn" style="background:#b53f3f" @click="showBatchDisburseModal = true">
          批量发放 ({{ ledgerSelectedIds.length }})
        </button>
      </div>

      <p v-if="ledgerError" class="error-message">{{ ledgerError }}</p>

      <!-- 表格 -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:40px"><input type="checkbox" @change="selectAllLedgers" /></th>
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
            <tr v-if="ledgerLoading"><td colspan="13" class="center-text">加载中……</td></tr>
            <tr v-else-if="ledgers.length === 0"><td colspan="13" class="center-text">暂无台账记录</td></tr>
            <tr v-for="(item, idx) in ledgers" :key="item.id" v-else>
              <td>
                <input type="checkbox" v-if="item.disburseStatus === 0" :checked="ledgerSelectedIds.includes(item.id)" @change="toggleLedgerSelect(item.id)" />
              </td>
              <td>{{ (ledgerPage - 1) * ledgerPageSize + idx + 1 }}</td>
              <td><span class="text-btn" @click="openLedgerDetail(item)">{{ item.batchName }}</span></td>
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
      <div class="pagination" v-if="ledgerTotal > 0">
        <button :disabled="ledgerPage <= 1" @click="prevLedgerPage">上一页</button>
        <span>第 {{ ledgerPage }} / {{ ledgerTotalPages }} 页（共 {{ ledgerTotal }} 条）</span>
        <button :disabled="ledgerPage >= ledgerTotalPages" @click="nextLedgerPage">下一页</button>
      </div>

      <!-- 单笔发放弹窗 -->
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

      <!-- 批量发放弹窗 -->
      <div v-if="showBatchDisburseModal" class="modal-overlay" @click.self="showBatchDisburseModal = false">
        <div class="modal-card">
          <h3>批量确认发放</h3>
          <p>确认将选中的 <strong>{{ ledgerSelectedIds.length }}</strong> 条记录标记为"已发放"？</p>
          <div class="modal-actions">
            <button class="secondary" @click="showBatchDisburseModal = false">取消</button>
            <button class="primary-btn" @click="doBatchDisburse">确认发放</button>
          </div>
        </div>
      </div>

      <!-- 详情弹窗 -->
      <div v-if="showLedgerDetailModal" class="modal-overlay" @click.self="showLedgerDetailModal = false">
        <div class="modal-card" style="max-width:600px">
          <h3>台账详情</h3>
          <div class="detail-grid">
            <div><strong>批次：</strong>{{ ledgerDetailTarget?.batchName }}</div>
            <div><strong>申请编号：</strong>{{ ledgerDetailTarget?.applyNo }}</div>
            <div><strong>学号：</strong>{{ ledgerDetailTarget?.studentNo }}</div>
            <div><strong>姓名：</strong>{{ ledgerDetailTarget?.studentName }}</div>
            <div><strong>学院：</strong>{{ ledgerDetailTarget?.collegeName }}</div>
            <div><strong>年级：</strong>{{ ledgerDetailTarget?.grade }}</div>
            <div><strong>补助类型：</strong>{{ ledgerDetailTarget?.subsidyTypeName }}</div>
            <div><strong>审批金额：</strong>{{ formatMoney(ledgerDetailTarget?.approvedAmount) }}</div>
            <div><strong>发放状态：</strong>{{ ledgerDetailTarget?.disburseStatusName }}</div>
            <div><strong>发放时间：</strong>{{ formatTime(ledgerDetailTarget?.disburseTime) }}</div>
            <div><strong>银行卡号：</strong>{{ ledgerDetailTarget?.bankCardNo || '未填写' }}</div>
            <div><strong>操作人：</strong>{{ ledgerDetailTarget?.disburseOperatorName || '-' }}</div>
            <div><strong>备注：</strong>{{ ledgerDetailTarget?.remark || '-' }}</div>
          </div>
          <div class="modal-actions">
            <button class="secondary" @click="showLedgerDetailModal = false">关闭</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.view-container { display: flex; flex-direction: column; gap: 24px; }
.view-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
.view-title { margin: 0 0 8px; font-size: 24px; }
.subtitle { margin: 0; color: #668077; font-size: 14px; }

.header-right { display: flex; gap: 12px; align-items: center; }
.batch-select {
  border: 1px solid #cbdad0; border-radius: 12px; padding: 10px 14px;
  outline: none; background: #fbfdfb; font: inherit;
}
.batch-select:focus { border-color: #217a58; box-shadow: 0 0 0 3px rgba(33, 122, 88, .12); }

.error-message { color: #b53f3f; margin: 0; font-size: 14px; }
.center-text { text-align: center; color: #999; padding: 32px !important; }

/* Tab 栏 */
.tab-bar { display: flex; gap: 4px; background: #edf4ef; border-radius: 12px; padding: 4px; width: fit-content; }
.tab-btn { padding: 8px 20px; border: none; border-radius: 10px; background: transparent; color: #50816d; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; }
.tab-btn.active { background: #fff; color: #16352c; box-shadow: 0 2px 8px rgba(27,74,57,.08); }
.tab-btn:hover:not(.active) { background: rgba(255,255,255,.5); }

/* 指标卡片 */
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.metric-card { background: #fff; padding: 24px; border-radius: 18px; box-shadow: 0 4px 12px rgba(27,74,57,.04); border: 1px solid rgba(25, 89, 66, .05); }
.metric-card.highlight { background: #f1f7f3; border-color: #cbdad0; }
.metric-card .eyebrow { color: #50816d; font-size: 13px; font-weight: 700; letter-spacing: .1em; display: block; margin-bottom: 8px; }
.metric-card .value { font-size: 28px; font-weight: 700; color: #16352c; }
.metric-card .metric-label { font-size: 13px; color: #668077; margin-bottom: 4px; }
.metric-card .metric-value { font-size: 22px; font-weight: 700; color: #16352c; }
.metric-card.pending .metric-value { color: #b07828; }
.metric-card.done .metric-value { color: #217a58; }
.metric-card.failed .metric-value { color: #b53f3f; }

.text-success { color: #217a58; font-weight: 600; }
.text-warning { color: #d97706; }

/* 表格 */
.table-card { background: #fff; border-radius: 18px; padding: 20px; box-shadow: 0 4px 12px rgba(27,74,57,.04); overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
.data-table th { padding: 14px 16px; color: #50816d; font-weight: 600; border-bottom: 2px solid #edf4ef; white-space: nowrap; }
.data-table td { padding: 16px; border-bottom: 1px solid #edf4ef; color: #16352c; }
.data-table tbody tr:hover { background: #fbfdfb; }

/* 按钮 */
.text-btn { background: transparent; border: none; color: #217a58; padding: 0 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
.text-btn:hover { text-decoration: underline; }
.primary-btn { background: #217a58; color: #fff; border: none; padding: 8px 18px; border-radius: 10px; font-size: 14px; cursor: pointer; }
.primary-btn:hover { background: #1a6346; }
.secondary { background: #e7f1eb; color: #217a58; border: 1px solid #d0dbd4; padding: 8px 18px; border-radius: 10px; font-size: 14px; cursor: pointer; }
.secondary:hover { background: #d0e4d8; }

/* 筛选栏 */
.filter-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.filter-bar select, .filter-bar input { padding: 8px 12px; border: 1px solid #d0dbd4; border-radius: 10px; font-size: 14px; color: #16352c; background: #fff; outline: none; }
.filter-bar select:focus, .filter-bar input:focus { border-color: #217a58; }

/* 分页 */
.pagination { display: flex; gap: 12px; align-items: center; justify-content: center; }
.pagination button { padding: 6px 14px; border: 1px solid #d0dbd4; border-radius: 8px; background: #fff; color: #217a58; cursor: pointer; font-size: 13px; }
.pagination button:disabled { color: #ccc; cursor: not-allowed; }
.pagination span { color: #668077; font-size: 13px; }

/* 弹窗 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: grid; place-items: center; z-index: 100; backdrop-filter: blur(4px); }
.modal-card { background: #fff; width: 100%; max-width: 440px; padding: 32px; border-radius: 24px; box-shadow: 0 24px 80px rgba(0,0,0,.2); max-height: 90vh; overflow-y: auto; }
.modal-card h3 { margin: 0 0 8px; font-size: 20px; }
.modal-subtitle { margin: 0 0 20px; color: #668077; font-size: 14px; }
.modal-card label { display: block; margin-bottom: 16px; color: #50816d; font-size: 13px; font-weight: 600; }
.modal-card .target-display { margin: 0 0 16px; color: #16352c; font-size: 14px; }
.modal-card input, .modal-card select { width: 100%; border: 1px solid #cbdad0; border-radius: 12px; padding: 12px 14px; outline: none; background: #fbfdfb; font: inherit; margin-top: 6px; box-sizing: border-box; }
.modal-card input:focus, .modal-card select:focus { border-color: #217a58; box-shadow: 0 0 0 3px rgba(33, 122, 88, .12); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 14px; }
.detail-grid div { color: #16352c; }

/* 状态标签 */
.status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.status-pending { background: #fef5e7; color: #b07828; }
.status-done { background: #e7f1eb; color: #217a58; }
.status-failed { background: #fce8e8; color: #b53f3f; }

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type='number'] { -moz-appearance: textfield; }
</style>
