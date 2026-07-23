<script setup>
import { onMounted, ref, computed } from 'vue'
import {
  getTutorApplyTypes,
  getMyTutorApplications,
  createTutorApplication,
  updateTutorApplication,
  submitTutorDraft,
  getTutorApplicationDetail,
  searchTutorStudents
} from '../../api'

const props = defineProps({ userType: Number, menuName: String, user: Object })

const applies = ref([])
const loading = ref(false)
const error = ref('')
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const filterStatus = ref('')
const filterTypeId = ref('')

const applyTypes = ref([])

// 新建/编辑弹窗
const showModal = ref(false)
const editTarget = ref(null)
const form = ref({ typeId: '', title: '', description: '', amount: '', urgency: 1, studentIds: [], formData: '' })
const saving = ref(false)

// 详情弹窗
const detailTarget = ref(null)
const detailLoading = ref(false)

// 学生搜索
const studentKeyword = ref('')
const studentResults = ref([])
const selectedStudents = ref([])
const searchingStudents = ref(false)

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

onMounted(() => { loadApplyTypes(); loadApplies() })

async function loadApplyTypes() {
  try { applyTypes.value = await getTutorApplyTypes() } catch (e) { /* 非关键 */ }
}

async function loadApplies() {
  loading.value = true; error.value = ''
  try {
    const data = await getMyTutorApplications({ status: filterStatus.value || undefined, typeId: filterTypeId.value || undefined, page: currentPage.value, size: pageSize.value })
    applies.value = data.items || []; totalElements.value = data.total || 0
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

function prevPage() { if (currentPage.value > 1) { currentPage.value--; loadApplies() } }
function nextPage() { if (currentPage.value < totalPages.value) { currentPage.value++; loadApplies() } }

function getActiveType(typeId) {
  return applyTypes.value.find(t => t.id === typeId)
}

function openCreate() {
  editTarget.value = null; selectedStudents.value = []; studentResults.value = []; studentKeyword.value = ''
  form.value = { typeId: applyTypes.value.length > 0 ? applyTypes.value[0].id : '', title: '', description: '', amount: '', urgency: 1, studentIds: [], formData: '' }
  showModal.value = true
}

function openEdit(apply) {
  editTarget.value = apply; selectedStudents.value = (apply.students || []).map(s => ({ studentId: s.studentId, studentName: s.studentName, studentNo: s.studentNo, povertyLevel: s.povertyLevel }))
  studentResults.value = []; studentKeyword.value = ''
  form.value = {
    typeId: apply.typeId, title: apply.title, description: apply.description,
    amount: apply.amount || '', urgency: apply.urgency || 1,
    studentIds: (apply.students || []).map(s => s.studentId), formData: apply.formData || ''
  }
  showModal.value = true
}

function onTypeChange() {
  const type = getActiveType(form.value.typeId)
  if (type && type.needAmount === 0) form.value.amount = ''
  if (type && type.needStudent === 0) { form.value.studentIds = []; selectedStudents.value = [] }
}

async function searchStudents() {
  if (!studentKeyword.value.trim()) { studentResults.value = []; return }
  searchingStudents.value = true
  try { studentResults.value = await searchTutorStudents(studentKeyword.value.trim()) } catch (e) { alert('搜索学生失败：' + e.message) } finally { searchingStudents.value = false }
}

function addStudent(stu) {
  if (!selectedStudents.value.find(s => s.studentId === stu.studentId)) {
    selectedStudents.value.push(stu)
  }
  form.value.studentIds = selectedStudents.value.map(s => s.studentId)
  studentResults.value = []; studentKeyword.value = ''
}

function removeStudent(stu) {
  selectedStudents.value = selectedStudents.value.filter(s => s.studentId !== stu.studentId)
  form.value.studentIds = selectedStudents.value.map(s => s.studentId)
}

async function submitForm() {
  saving.value = true
  try {
    const payload = {
      typeId: Number(form.value.typeId),
      title: form.value.title,
      description: form.value.description,
      amount: form.value.amount ? Number(form.value.amount) : null,
      urgency: form.value.urgency,
      studentIds: form.value.studentIds,
      formData: form.value.formData || null
    }

    if (editTarget.value) {
      await updateTutorApplication(editTarget.value.id, payload)
    } else {
      await createTutorApplication(payload)
    }
    showModal.value = false
    await loadApplies()
  } catch (e) { alert('操作失败：' + e.message) } finally { saving.value = false }
}

async function handleSubmitDraft(apply) {
  if (!confirm('确认提交此申请吗？提交后将进入审批流程。')) return
  try {
    await submitTutorDraft(apply.id)
    await loadApplies()
  } catch (e) { alert('提交失败：' + e.message) }
}

async function openDetail(apply) {
  detailLoading.value = true
  try { detailTarget.value = await getTutorApplicationDetail(apply.id) } catch (e) { alert('加载详情失败：' + e.message) } finally { detailLoading.value = false }
}

const currentType = computed(() => getActiveType(form.value.typeId))
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <h2 class="view-title">事务申请</h2>
        <p class="subtitle">发起和管理您的事务性申请，追踪资金下发状态</p>
      </div>
      <button @click="openCreate">+ 发起申请</button>
    </header>

    <!-- 筛选 -->
    <div class="filter-bar">
      <select v-model="filterTypeId" class="gc-select" @change="currentPage=1;loadApplies()">
        <option value="">全部类型</option>
        <option v-for="t in applyTypes" :key="t.id" :value="t.id">{{ t.typeName }}</option>
      </select>
      <select v-model="filterStatus" class="gc-select" @change="currentPage=1;loadApplies()">
        <option value="">全部状态</option>
        <option :value="1">草稿</option>
        <option :value="2">待学院审批</option>
        <option :value="3">待学校审批</option>
        <option :value="4">已通过</option>
        <option :value="5">已驳回</option>
      </select>
      <button class="secondary" @click="currentPage=1;loadApplies()">查询</button>
    </div>
    <p v-if="error" class="error-message">{{ error }}</p>

    <!-- 申请列表 -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>申请编号</th><th>标题</th><th>类型</th><th>金额</th><th>资金下发</th><th>紧急程度</th><th>状态</th><th>提交时间</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="9" class="center-text">加载中…</td></tr>
          <tr v-else-if="!applies.length"><td colspan="9" class="center-text">暂无申请记录</td></tr>
          <tr v-for="a in applies" :key="a.id" v-else>
            <td>{{ a.applyNo }}</td>
            <td>{{ a.title }}</td>
            <td>{{ a.typeName }}</td>
            <td>{{ a.amount ? formatMoney(a.amount) : '-' }}</td>
            <td><span v-if="a.disburseStatus && a.disburseStatus > 0" class="disburse-badge" :class="disburseClass(a.disburseStatus)">{{ disburseLabel(a.disburseStatus) }}</span><span v-else>-</span></td>
            <td><span :class="urgencyClass(a.urgency)">{{ urgencyLabel(a.urgency) }}</span></td>
            <td><span class="status-badge" :class="statusClass(a.status)">{{ statusLabel(a.status) }}</span></td>
            <td>{{ formatTime(a.submitTime || a.applyTime) }}</td>
            <td>
              <button class="text-btn" @click="openDetail(a)">详情</button>
              <button v-if="a.status === 1 || a.status === 5" class="text-btn edit-btn" @click="openEdit(a)">编辑</button>
              <button v-if="a.status === 1" class="text-btn edit-btn" @click="handleSubmitDraft(a)">提交</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalElements>0" class="pagination">
      <button :disabled="currentPage<=1" @click="prevPage">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页（{{ totalElements }} 条）</span>
      <button :disabled="currentPage>=totalPages" @click="nextPage">下一页</button>
    </div>

    <!-- 新建/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal-card" style="max-width:640px">
        <h3>{{ editTarget ? '编辑申请' : '发起事务申请' }}</h3>

        <label>申请类型</label>
        <select v-model="form.typeId" class="gc-select" style="width:100%;margin-bottom:12px" @change="onTypeChange">
          <option value="">请选择</option>
          <option v-for="t in applyTypes" :key="t.id" :value="t.id">{{ t.typeName }}</option>
        </select>

        <label>申请标题 <span style="color:red">*</span></label>
        <input v-model.trim="form.title" placeholder="请输入申请标题" style="width:100%;margin-bottom:12px" />

        <label>申请事由 <span style="color:red">*</span></label>
        <textarea v-model.trim="form.description" placeholder="请详细说明申请事由" rows="4" style="width:100%;margin-bottom:12px;border:1px solid #cbdad0;border-radius:12px;padding:10px 14px;font:inherit" />

        <label v-if="currentType && currentType.needAmount === 1">申请金额（元）</label>
        <input v-if="currentType && currentType.needAmount === 1" v-model="form.amount" type="number" min="0" step="0.01" placeholder="请输入金额" class="amount-input" style="width:100%;margin-bottom:12px" />

        <label>紧急程度</label>
        <select v-model="form.urgency" class="gc-select" style="width:100%;margin-bottom:12px">
          <option :value="1">普通</option>
          <option :value="2">紧急</option>
          <option :value="3">特急</option>
        </select>

        <!-- 关联学生 -->
        <div v-if="currentType && currentType.needStudent === 1" style="margin-bottom:12px">
          <label>关联学生 <span style="color:red">*</span></label>
          <div v-if="selectedStudents.length" class="student-tags">
            <span v-for="stu in selectedStudents" :key="stu.studentId" class="student-tag">
              {{ stu.studentName }}({{ stu.studentNo }})
              <button class="tag-remove" @click="removeStudent(stu)">×</button>
            </span>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <input v-model.trim="studentKeyword" placeholder="搜索所管学生（姓名/学号）" @keyup.enter="searchStudents" style="flex:1" />
            <button :disabled="searchingStudents" @click="searchStudents" style="white-space:nowrap">{{ searchingStudents ? '搜索中…' : '搜索' }}</button>
          </div>
          <div v-if="studentResults.length" class="student-dropdown">
            <div v-for="stu in studentResults" :key="stu.studentId" class="student-row" @click="addStudent(stu)">
              <span>{{ stu.studentName }}（{{ stu.studentNo }}） - {{ stu.collegeName }} {{ stu.className }} - {{ povertyLabel(stu.povertyLevel) }}</span>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-top:16px;justify-content:flex-end">
          <button class="secondary" @click="showModal=false">取消</button>
          <button :disabled="saving || !form.title || !form.description" @click="submitForm">{{ saving ? '保存中…' : '保存' }}</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="detailTarget" class="modal-overlay" @click.self="detailTarget=null">
      <div class="modal-card" style="max-width:720px">
        <h3>申请详情</h3>
        <div v-if="detailLoading"><p>加载中…</p></div>
        <div v-else>
          <div class="detail-grid">
            <p><strong>申请编号：</strong>{{ detailTarget.applyNo }}</p>
            <p><strong>申请类型：</strong>{{ detailTarget.typeName }}</p>
            <p><strong>标题：</strong>{{ detailTarget.title }}</p>
            <p><strong>状态：</strong><span class="status-badge" :class="statusClass(detailTarget.status)">{{ statusLabel(detailTarget.status) }}</span></p>
            <p><strong>紧急程度：</strong>{{ urgencyLabel(detailTarget.urgency) }}</p>
            <p v-if="detailTarget.amount"><strong>金额：</strong>{{ formatMoney(detailTarget.amount) }}</p>
            <p v-if="detailTarget.disburseStatus && detailTarget.disburseStatus > 0">
              <strong>资金下发：</strong><span class="disburse-badge" :class="disburseClass(detailTarget.disburseStatus)">{{ disburseLabel(detailTarget.disburseStatus) }}</span>
            </p>
            <p v-if="detailTarget.disburseTime"><strong>下发时间：</strong>{{ formatTime(detailTarget.disburseTime) }}</p>
            <p><strong>辅导员：</strong>{{ detailTarget.tutorName }}</p>
            <p><strong>提交时间：</strong>{{ formatTime(detailTarget.submitTime || detailTarget.applyTime) }}</p>
          </div>

          <div style="margin-top:16px">
            <strong>申请事由：</strong>
            <p style="white-space:pre-wrap;margin-top:8px;color:#374151">{{ detailTarget.description }}</p>
          </div>

          <!-- 关联学生 -->
          <div v-if="detailTarget.students && detailTarget.students.length" style="margin-top:16px">
            <strong>关联学生：</strong>
            <ul style="margin-top:8px;padding-left:20px">
              <li v-for="stu in detailTarget.students" :key="stu.studentId">{{ stu.studentName }}（{{ stu.studentNo }}） - {{ stu.collegeName }} - {{ povertyLabel(stu.povertyLevel) }}</li>
            </ul>
          </div>

          <!-- 审核时间轴 -->
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
              <!-- 资金下发记录 -->
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
        <div style="margin-top:16px;text-align:right">
          <button @click="detailTarget=null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 下拉框美化 ===== */
select.gc-select {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid #cbdad0;
  border-radius: 10px;
  padding: 9px 36px 9px 14px;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23668077' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center;
  font: inherit;
  font-size: 14px;
  color: #16352c;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
select.gc-select:focus {
  outline: none;
  border-color: #217a58;
  box-shadow: 0 0 0 3px rgba(33, 122, 88, .12);
}
select.gc-select option {
  background: white;
  color: #16352c;
  padding: 8px;
}

/* ===== 金额输入框去上下键 ===== */
.amount-input {
  -moz-appearance: textfield;
}
.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ===== 资金下发标签 ===== */
.disburse-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.disburse-wait { background: #fef3c7; color: #92400e; }
.disburse-ok { background: #d1fae5; color: #065f46; }

/* ===== 发放时间轴线 ===== */
.dot-disburse { background: #6366f1; }

.student-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.student-tag {
  display: inline-flex; align-items: center; gap: 2px;
  background: #e6f0eb; padding: 4px 10px; border-radius: 8px; font-size: 13px;
}
.tag-remove {
  background: none; border: 0; color: #9b2226; cursor: pointer; font-size: 16px; padding: 0 2px; border-radius: 4px;
}
.student-dropdown {
  border: 1px solid #cbdad0; border-radius: 8px; max-height: 160px; overflow-y: auto; margin-top: 4px;
}
.student-row {
  padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #edf4ef; font-size: 13px;
}
.student-row:hover { background: #e6f0eb; }
.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.timeline { margin-top: 8px; }
.timeline-item {
  display: flex; gap: 12px; padding: 8px 0; border-left: 2px solid #cbdad0; padding-left: 16px; position: relative;
}
.timeline-dot {
  position: absolute; left: -6px; top: 12px;
  width: 10px; height: 10px; border-radius: 50%;
}
.dot-pass { background: #217a58; }
.dot-reject { background: #9b2226; }
.timeline-time { font-size: 12px; color: #9ca3af; }
.urgency-1 { color: #6b7280; }
.urgency-2 { color: #d97706; font-weight: 600; }
.urgency-3 { color: #dc2626; font-weight: 700; }

/* 复用项目中已有的样式类 */
.view-container { width: 100%; }
.view-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.view-title { margin: 0 0 4px 0; font-size: 24px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.filter-bar input { border: 1px solid #cbdad0; border-radius: 8px; padding: 8px 12px; background: white; }
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
</style>
