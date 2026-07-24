<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  approveWorkstudyHire,
  approveWorkstudyPosition,
  approveWorkstudySalary,
  calculateWorkstudySalary,
  checkInWorkstudy,
  checkOutWorkstudy,
  confirmWorkstudyAttendance,
  confirmWorkstudySalary,
  createWorkstudyBatch,
  createWorkstudyPosition,
  deleteWorkstudyBatch,
  getMyWorkstudyAgreements,
  getMyWorkstudyApplications,
  getMyWorkstudyAttendance,
  getMyWorkstudyHires,
  getMyWorkstudySalaries,
  getPositionWorkstudyApplications,
  getWorkstudyAgreements,
  getWorkstudyAttendance,
  getWorkstudyBatches,
  getWorkstudyPositions,
  getWorkstudySalaries,
  markWorkstudySalaryPaid,
  recommendWorkstudyApplication,
  recordWorkstudyInterview,
  renewWorkstudyAgreement,
  repairWorkstudyAttendance,
  signWorkstudyAgreement,
  submitWorkstudyApply,
  submitWorkstudyPosition,
  updateWorkstudyBatchStatus
} from '../../api'

const props = defineProps({
  menuName: { type: String, default: '' },
  user: { type: Object, default: () => ({}) }
})

const loading = ref(false)
const error = ref('')
const notice = ref('')
const batches = ref([])
const positions = ref([])
const applications = ref([])
const hires = ref([])
const attendance = ref([])
const salaries = ref([])
const agreements = ref([])
const selectedPositionId = ref('')
const selectedHireId = ref('')
const moneyInputs = reactive({})
const renewalDates = reactive({})

const studentMenus = new Set([
  '勤工助学岗位', '我的勤工申请', '我的勤工考勤', '我的勤工薪酬', '我的勤工协议'
])

const section = computed(() => {
  if (props.menuName === '勤工助学批次') return 'batch'
  if (['勤工助学岗位', '勤工岗位管理', '勤工岗位审核'].includes(props.menuName)) return 'position'
  if (['我的勤工申请', '勤工面试管理', '勤工录用审批'].includes(props.menuName)) return 'application'
  if (['我的勤工考勤', '勤工考勤管理'].includes(props.menuName)) return 'attendance'
  if (['我的勤工薪酬', '勤工薪酬确认', '勤工薪酬管理'].includes(props.menuName)) return 'salary'
  if (['我的勤工协议', '勤工协议管理'].includes(props.menuName)) return 'agreement'
  return 'position'
})

const isStudentPage = computed(() => studentMenus.has(props.menuName))
const can = (permission) => (props.user?.permissions || []).includes(permission)

const batchForm = reactive({
  batchName: '', academicYear: '2026-2027', semester: 1,
  registerStartTime: '', registerEndTime: '',
  interviewStartTime: '', interviewEndTime: '',
  workStartDate: '', workEndDate: '', maxPositions: 100
})

const positionForm = reactive({
  batchId: '', positionName: '', departmentName: '', departmentId: 1,
  description: '', workLocation: '', workTimeDesc: '', maxWeeklyHours: 8,
  positionType: 1, recruitCount: 1, salaryType: 1, salaryRate: 15,
  requirements: '', contactName: '', contactPhone: ''
})

const applyForm = reactive({
  positionId: '', selfIntro: '', availableTime: '', skills: '', applyReason: ''
})

const repairForm = reactive({
  hireId: '', attendanceDate: '', checkInTime: '', checkOutTime: '', reason: ''
})

const salaryFilter = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  status: ''
})

const batchStatus = ['未开始', '报名中', '面试中', '进行中', '已结束']
const positionStatus = ['草稿', '待审核', '已上架', '已下架', '审核不通过']
const applyStatus = { 1: '已报名', 2: '面试中', 3: '待录用审批', 4: '已录用', 5: '未录用' }
const attendanceStatus = { 1: '正常/待确认', 2: '迟到', 3: '早退', 4: '请假', 5: '旷工', 6: '补卡待审批', 7: '补卡已通过' }
const salaryStatus = { 1: '待部门确认', 2: '待学校审批', 3: '已审批', 4: '已发放' }
const agreementStatus = { 0: '待签署', 1: '已签署', 2: '已到期', 3: '已续签' }

async function execute(action, successMessage) {
  loading.value = true
  error.value = ''
  notice.value = ''
  try {
    await action()
    if (successMessage) notice.value = successMessage
  } catch (requestError) {
    error.value = requestError.message || '操作失败'
    throw requestError
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await execute(async () => {
    if (section.value === 'batch') {
      batches.value = await getWorkstudyBatches()
    } else if (section.value === 'position') {
      batches.value = await getWorkstudyBatches()
      positions.value = await getWorkstudyPositions()
    } else if (section.value === 'application') {
      if (isStudentPage.value) {
        applications.value = await getMyWorkstudyApplications()
      } else {
        positions.value = await getWorkstudyPositions()
        if (!selectedPositionId.value && positions.value.length) {
          selectedPositionId.value = positions.value[0].id
        }
        await loadPositionApplications()
      }
    } else if (section.value === 'attendance') {
      if (isStudentPage.value) {
        hires.value = await getMyWorkstudyHires()
        attendance.value = await getMyWorkstudyAttendance()
        if (!selectedHireId.value && hires.value.length) selectedHireId.value = hires.value[0].id
        if (!repairForm.hireId && hires.value.length) repairForm.hireId = hires.value[0].id
      } else {
        attendance.value = await getWorkstudyAttendance()
      }
    } else if (section.value === 'salary') {
      salaries.value = isStudentPage.value
        ? await getMyWorkstudySalaries()
        : await getWorkstudySalaries({ status: salaryFilter.status })
    } else if (section.value === 'agreement') {
      agreements.value = isStudentPage.value
        ? await getMyWorkstudyAgreements()
        : await getWorkstudyAgreements()
    }
  })
}

async function loadPositionApplications() {
  if (!selectedPositionId.value) {
    applications.value = []
    return
  }
  applications.value = await getPositionWorkstudyApplications(selectedPositionId.value)
}

async function createBatch() {
  await execute(async () => {
    await createWorkstudyBatch({ ...batchForm })
    Object.assign(batchForm, { batchName: '', registerStartTime: '', registerEndTime: '' })
    batches.value = await getWorkstudyBatches()
  }, '批次已创建')
}

async function changeBatchStatus(batch, status) {
  await execute(async () => {
    await updateWorkstudyBatchStatus(batch.id, status)
    batches.value = await getWorkstudyBatches()
  }, '批次状态已更新')
}

async function removeBatch(batch) {
  if (!window.confirm(`确认删除批次“${batch.batchName}”吗？`)) return
  await execute(async () => {
    await deleteWorkstudyBatch(batch.id)
    batches.value = await getWorkstudyBatches()
  }, '批次已删除')
}

async function createPosition() {
  await execute(async () => {
    await createWorkstudyPosition({ ...positionForm, batchId: Number(positionForm.batchId) })
    positionForm.positionName = ''
    positionForm.description = ''
    positions.value = await getWorkstudyPositions()
  }, '岗位草稿已创建')
}

async function positionAction(action, message) {
  await execute(async () => {
    await action()
    positions.value = await getWorkstudyPositions()
  }, message)
}

function startApply(position) {
  applyForm.positionId = position.id
  applyForm.selfIntro = ''
  applyForm.availableTime = ''
  applyForm.skills = ''
  applyForm.applyReason = ''
}

async function submitApplication() {
  await execute(async () => {
    await submitWorkstudyApply({ ...applyForm, positionId: Number(applyForm.positionId) })
    applyForm.positionId = ''
  }, '岗位申请已提交')
}

async function interview(applyId, status) {
  await execute(async () => {
    await recordWorkstudyInterview(applyId, status)
    await loadPositionApplications()
  }, '面试结果已更新')
}

async function recommend(item) {
  const recommendation = window.prompt('请输入辅导员推荐意见', item.tutorRecommend || '')
  if (recommendation === null || !recommendation.trim()) return
  await execute(async () => {
    await recommendWorkstudyApplication(item.id, recommendation.trim())
    await loadPositionApplications()
  }, '推荐意见已保存')
}

async function approveHire(item) {
  await execute(async () => {
    await approveWorkstudyHire(item.id)
    await loadPositionApplications()
  }, '录用审批已通过，协议已自动生成')
}

async function checkIn() {
  await execute(async () => {
    await checkInWorkstudy(selectedHireId.value, 1, '网页定位演示')
    attendance.value = await getMyWorkstudyAttendance()
  }, '签到成功')
}

async function checkOut(item) {
  await execute(async () => {
    await checkOutWorkstudy(item.id)
    attendance.value = await getMyWorkstudyAttendance()
  }, '签退成功')
}

async function repairAttendance() {
  await execute(async () => {
    await repairWorkstudyAttendance({ ...repairForm })
    attendance.value = await getMyWorkstudyAttendance()
    repairForm.reason = ''
  }, '补卡申请已提交')
}

async function confirmAttendance(item) {
  await execute(async () => {
    await confirmWorkstudyAttendance(item.id)
    attendance.value = await getWorkstudyAttendance()
  }, '考勤已确认')
}

async function calculateSalary() {
  await execute(async () => {
    const result = await calculateWorkstudySalary(salaryFilter.year, salaryFilter.month)
    notice.value = result
    salaries.value = await getWorkstudySalaries({ status: salaryFilter.status })
  })
}

async function salaryAction(action, message) {
  await execute(async () => {
    await action()
    salaries.value = await getWorkstudySalaries({ status: salaryFilter.status })
  }, message)
}

async function signAgreement(item) {
  await execute(async () => {
    await signWorkstudyAgreement(item.id)
    agreements.value = await getMyWorkstudyAgreements()
  }, '协议签署成功')
}

async function renewAgreement(item) {
  await execute(async () => {
    await renewWorkstudyAgreement(item.id, renewalDates[item.id])
    agreements.value = await getWorkstudyAgreements()
  }, '协议续签成功')
}

watch(() => props.menuName, refresh)
onMounted(refresh)
</script>

<template>
  <div class="workstudy-center">
    <div class="section-heading">
      <div>
        <p class="eyebrow">WORK-STUDY</p>
        <h2>{{ menuName }}</h2>
      </div>
      <button class="secondary compact" :disabled="loading" @click="refresh">刷新</button>
    </div>

    <p v-if="notice" class="notice">{{ notice }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="section === 'batch'">
      <form v-if="can('workstudy:batch:create')" class="panel form-grid" @submit.prevent="createBatch">
        <h3>创建招聘批次</h3>
        <label>批次名称<input v-model.trim="batchForm.batchName" required /></label>
        <label>学年<input v-model.trim="batchForm.academicYear" required /></label>
        <label>学期<select v-model.number="batchForm.semester"><option :value="1">第一学期</option><option :value="2">第二学期</option></select></label>
        <label>报名开始<input v-model="batchForm.registerStartTime" type="datetime-local" required /></label>
        <label>报名结束<input v-model="batchForm.registerEndTime" type="datetime-local" required /></label>
        <label>面试开始<input v-model="batchForm.interviewStartTime" type="datetime-local" required /></label>
        <label>面试结束<input v-model="batchForm.interviewEndTime" type="datetime-local" required /></label>
        <label>上岗开始<input v-model="batchForm.workStartDate" type="date" required /></label>
        <label>上岗结束<input v-model="batchForm.workEndDate" type="date" required /></label>
        <label>全校岗位上限<input v-model.number="batchForm.maxPositions" type="number" min="1" required /></label>
        <button :disabled="loading">创建批次</button>
      </form>

      <div class="card-list">
        <article v-for="batch in batches" :key="batch.id" class="panel">
          <div class="row-between">
            <div><h3>{{ batch.batchName }}</h3><p>{{ batch.academicYear }} · 第{{ batch.semester }}学期</p></div>
            <span class="status">{{ batchStatus[batch.status] }}</span>
          </div>
          <p>报名：{{ batch.registerStartTime }} 至 {{ batch.registerEndTime }}</p>
          <div class="actions">
            <button v-if="batch.status === 0 && can('workstudy:batch:update')" @click="changeBatchStatus(batch, 1)">开启报名</button>
            <button v-if="batch.status === 1 && can('workstudy:batch:update')" @click="changeBatchStatus(batch, 2)">进入面试</button>
            <button v-if="batch.status === 2 && can('workstudy:batch:update')" @click="changeBatchStatus(batch, 3)">开始上岗</button>
            <button v-if="[1,2,3].includes(batch.status) && can('workstudy:batch:update')" class="secondary" @click="changeBatchStatus(batch, 4)">结束批次</button>
            <button v-if="batch.status === 0 && can('workstudy:batch:delete')" class="danger" @click="removeBatch(batch)">删除</button>
          </div>
        </article>
      </div>
    </template>

    <template v-else-if="section === 'position'">
      <form v-if="can('workstudy:position:publish') && menuName === '勤工岗位管理'" class="panel form-grid" @submit.prevent="createPosition">
        <h3>新建岗位草稿</h3>
        <label>所属批次<select v-model="positionForm.batchId" required><option value="">请选择</option><option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batchName }}</option></select></label>
        <label>岗位名称<input v-model.trim="positionForm.positionName" required /></label>
        <label>用工部门<input v-model.trim="positionForm.departmentName" required /></label>
        <label>工作地点<input v-model.trim="positionForm.workLocation" required /></label>
        <label>招聘人数<input v-model.number="positionForm.recruitCount" type="number" min="1" required /></label>
        <label>时薪（元）<input v-model.number="positionForm.salaryRate" type="number" min="12" step="0.01" required /></label>
        <label>每周工时<input v-model.number="positionForm.maxWeeklyHours" type="number" min="1" max="8" required /></label>
        <label>岗位类型<select v-model.number="positionForm.positionType"><option :value="1">固定岗</option><option :value="2">临时岗</option></select></label>
        <label>联系人<input v-model.trim="positionForm.contactName" required /></label>
        <label>联系电话<input v-model.trim="positionForm.contactPhone" required /></label>
        <label class="wide">工作时间<input v-model.trim="positionForm.workTimeDesc" required /></label>
        <label class="wide">岗位描述<textarea v-model.trim="positionForm.description" required /></label>
        <label class="wide">岗位要求<textarea v-model.trim="positionForm.requirements" /></label>
        <button :disabled="loading">保存草稿</button>
      </form>

      <div class="position-grid">
        <article v-for="position in positions" :key="position.id" class="panel position-card">
          <div class="row-between"><h3>{{ position.positionName }}</h3><span class="status">{{ positionStatus[position.status] }}</span></div>
          <p>{{ position.departmentName }} · {{ position.workLocation }}</p>
          <p>{{ position.description }}</p>
          <div class="metrics">
            <span>¥{{ position.salaryRate }}/小时</span>
            <span>{{ position.maxWeeklyHours }}小时/周</span>
            <span>名额 {{ position.hiredCount || 0 }}/{{ position.recruitCount }}</span>
          </div>
          <div class="actions">
            <button v-if="isStudentPage && position.status === 2" @click="startApply(position)">申请岗位</button>
            <button v-if="position.status === 0 && can('workstudy:position:submit')" @click="positionAction(() => submitWorkstudyPosition(position.id), '已提交审核')">提交审核</button>
            <button v-if="position.status === 1 && can('workstudy:position:approve')" @click="positionAction(() => approveWorkstudyPosition(position.id, true), '岗位已通过并上架')">审核通过</button>
            <button v-if="position.status === 1 && can('workstudy:position:approve')" class="danger" @click="positionAction(() => approveWorkstudyPosition(position.id, false, '资料不完整'), '岗位已驳回')">驳回</button>
          </div>
        </article>
      </div>

      <form v-if="applyForm.positionId" class="panel form-grid apply-panel" @submit.prevent="submitApplication">
        <h3>提交岗位申请（岗位 #{{ applyForm.positionId }}）</h3>
        <label class="wide">自我介绍<textarea v-model.trim="applyForm.selfIntro" required /></label>
        <label>可工作时间<input v-model.trim="applyForm.availableTime" required /></label>
        <label>特长/经历<input v-model.trim="applyForm.skills" /></label>
        <label class="wide">申请理由<textarea v-model.trim="applyForm.applyReason" required /></label>
        <button :disabled="loading">确认提交</button>
        <button type="button" class="secondary" @click="applyForm.positionId = ''">取消</button>
      </form>
    </template>

    <template v-else-if="section === 'application'">
      <div v-if="!isStudentPage" class="toolbar">
        <label>岗位<select v-model="selectedPositionId" @change="loadPositionApplications"><option v-for="p in positions" :key="p.id" :value="p.id">{{ p.positionName }}（#{{ p.id }}）</option></select></label>
      </div>
      <div class="card-list">
        <article v-for="item in applications" :key="item.id" class="panel">
          <div class="row-between"><h3>申请 {{ item.applyNo || `#${item.id}` }}</h3><span class="status">{{ applyStatus[item.status] }}</span></div>
          <p>学生 #{{ item.studentId }} · 岗位 #{{ item.positionId }}</p>
          <p>{{ item.selfIntro }}</p>
          <p>可工作时间：{{ item.availableTime || '未填写' }}　特长：{{ item.skills || '未填写' }}</p>
          <p v-if="item.tutorRecommend">辅导员意见：{{ item.tutorRecommend }}</p>
          <div class="actions">
            <button v-if="can('workstudy:apply:tutor-recommend') && item.status === 1" @click="recommend(item)">填写推荐</button>
            <button v-if="can('workstudy:apply:interview') && item.interviewStatus === 0" @click="interview(item.id, 1)">标记已面试</button>
            <button v-if="can('workstudy:apply:interview') && [0,1].includes(item.interviewStatus)" @click="interview(item.id, 2)">面试通过</button>
            <button v-if="can('workstudy:apply:interview') && [0,1].includes(item.interviewStatus)" class="danger" @click="interview(item.id, 3)">面试不通过</button>
            <button v-if="can('workstudy:hire:approve') && item.status === 3" @click="approveHire(item)">批准录用</button>
          </div>
        </article>
        <p v-if="!applications.length" class="empty">暂无申请记录。</p>
      </div>
    </template>

    <template v-else-if="section === 'attendance'">
      <div v-if="isStudentPage" class="panel">
        <h3>今日打卡</h3>
        <div class="toolbar">
          <label>在岗记录<select v-model="selectedHireId"><option v-for="h in hires" :key="h.id" :value="h.id">录用 #{{ h.id }} · 岗位 #{{ h.positionId }}</option></select></label>
          <button :disabled="loading || !selectedHireId" @click="checkIn">签到</button>
        </div>
      </div>

      <form v-if="isStudentPage" class="panel form-grid" @submit.prevent="repairAttendance">
        <h3>补打卡申请</h3>
        <label>在岗记录<select v-model="repairForm.hireId" required><option v-for="h in hires" :key="h.id" :value="h.id">录用 #{{ h.id }}</option></select></label>
        <label>考勤日期<input v-model="repairForm.attendanceDate" type="date" required /></label>
        <label>签到时间<input v-model="repairForm.checkInTime" type="datetime-local" required /></label>
        <label>签退时间<input v-model="repairForm.checkOutTime" type="datetime-local" required /></label>
        <label class="wide">补卡原因<textarea v-model.trim="repairForm.reason" required /></label>
        <button :disabled="loading">提交补卡</button>
      </form>

      <div class="table-wrap panel">
        <table>
          <thead><tr><th>日期</th><th>学生/录用</th><th>签到</th><th>签退</th><th>工时</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in attendance" :key="item.id">
              <td>{{ item.attendanceDate }}</td><td>#{{ item.studentId }} / #{{ item.hireId }}</td>
              <td>{{ item.checkInTime || '-' }}</td><td>{{ item.checkOutTime || '-' }}</td>
              <td>{{ item.workHours ?? '-' }}</td><td>{{ attendanceStatus[item.status] }}</td>
              <td>
                <button v-if="isStudentPage && !item.checkOutTime && item.status === 1" class="compact" @click="checkOut(item)">签退</button>
                <button v-if="!isStudentPage && !item.confirmedBy && [1,6].includes(item.status)" class="compact" @click="confirmAttendance(item)">确认</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else-if="section === 'salary'">
      <div v-if="!isStudentPage" class="toolbar panel">
        <label>年份<input v-model.number="salaryFilter.year" type="number" /></label>
        <label>月份<input v-model.number="salaryFilter.month" type="number" min="1" max="12" /></label>
        <label>状态<select v-model="salaryFilter.status" @change="refresh"><option value="">全部</option><option v-for="(label, code) in salaryStatus" :key="code" :value="code">{{ label }}</option></select></label>
        <button v-if="can('workstudy:salary:calculate')" @click="calculateSalary">核算本月薪酬</button>
      </div>
      <div class="table-wrap panel">
        <table>
          <thead><tr><th>年月</th><th>学生</th><th>工时</th><th>系统金额</th><th>确认/最终金额</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in salaries" :key="item.id">
              <td>{{ item.salaryYear }}-{{ String(item.salaryMonth).padStart(2, '0') }}</td><td>#{{ item.studentId }}</td>
              <td>{{ item.totalWorkHours }}</td><td>¥{{ item.calculatedAmount }}</td>
              <td>¥{{ item.confirmedAmount ?? '-' }} / ¥{{ item.finalAmount ?? '-' }}</td><td>{{ salaryStatus[item.status] }}</td>
              <td>
                <div v-if="!isStudentPage" class="inline-action">
                  <input v-if="item.status === 1 && can('workstudy:salary:dept-confirm')" v-model="moneyInputs[item.id]" type="number" step="0.01" :placeholder="item.calculatedAmount" />
                  <button v-if="item.status === 1 && can('workstudy:salary:dept-confirm')" class="compact" @click="salaryAction(() => confirmWorkstudySalary(item.id, moneyInputs[item.id] || item.calculatedAmount), '部门已确认')">部门确认</button>
                  <input v-if="item.status === 2 && can('workstudy:salary:school-approve')" v-model="moneyInputs[item.id]" type="number" step="0.01" :placeholder="item.confirmedAmount" />
                  <button v-if="item.status === 2 && can('workstudy:salary:school-approve')" class="compact" @click="salaryAction(() => approveWorkstudySalary(item.id, moneyInputs[item.id] || item.confirmedAmount), '学校已审批')">学校审批</button>
                  <button v-if="item.status === 3 && can('workstudy:salary:mark-paid')" class="compact" @click="salaryAction(() => markWorkstudySalaryPaid(item.id), '已标记发放')">标记发放</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else-if="section === 'agreement'">
      <div class="card-list">
        <article v-for="item in agreements" :key="item.id" class="panel">
          <div class="row-between"><h3>{{ item.agreementNo }}</h3><span class="status">{{ agreementStatus[item.signStatus] }}</span></div>
          <p>学生 #{{ item.studentId }} · 岗位 #{{ item.positionId }} · 录用 #{{ item.hireId }}</p>
          <p>有效期：{{ item.startDate }} 至 {{ item.endDate }}　续签 {{ item.renewCount || 0 }} 次</p>
          <details><summary>查看协议正文</summary><pre>{{ item.templateContent }}</pre></details>
          <div class="actions">
            <button v-if="isStudentPage && item.signStatus === 0" @click="signAgreement(item)">在线确认签署</button>
            <template v-if="!isStudentPage && [1,3].includes(item.signStatus)">
              <input v-model="renewalDates[item.id]" type="date" :min="item.endDate" />
              <button @click="renewAgreement(item)">续签</button>
            </template>
          </div>
        </article>
        <p v-if="!agreements.length" class="empty">暂无协议。</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.workstudy-center { display: grid; gap: 18px; color: #183d31; }
.section-heading, .row-between, .toolbar, .actions, .metrics, .inline-action {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.section-heading, .row-between { justify-content: space-between; }
h2, h3, p { margin-top: 0; }
.eyebrow { margin-bottom: 4px; color: #328063; font-size: 12px; letter-spacing: .12em; }
.panel { padding: 20px; border: 1px solid #dbe9e3; border-radius: 14px; background: #fff; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.form-grid h3, .form-grid .wide { grid-column: 1 / -1; }
label { display: grid; gap: 6px; font-size: 13px; color: #507266; }
input, select, textarea { width: 100%; box-sizing: border-box; border: 1px solid #c8dcd4; border-radius: 8px; padding: 9px 10px; background: #fff; }
textarea { min-height: 80px; resize: vertical; }
button { border: 0; border-radius: 8px; padding: 9px 14px; background: #217a58; color: white; cursor: pointer; }
button:disabled { opacity: .55; cursor: wait; }
button.secondary { background: #e8f1ed; color: #245b48; }
button.danger { background: #a94442; }
button.compact { padding: 6px 10px; font-size: 12px; }
.card-list, .position-grid { display: grid; gap: 14px; }
.position-grid { grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); }
.position-card { transition: transform .15s ease, box-shadow .15s ease; }
.position-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(26, 79, 60, .09); }
.metrics { color: #386b59; font-size: 13px; margin: 14px 0; }
.status { padding: 4px 9px; border-radius: 999px; background: #e6f3ed; color: #1f6b4d; font-size: 12px; white-space: nowrap; }
.notice, .error { padding: 11px 14px; border-radius: 9px; margin: 0; }
.notice { background: #e8f6ee; color: #17653f; }
.error { background: #fff0ef; color: #a13c39; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
th, td { padding: 11px 9px; border-bottom: 1px solid #e5eeea; text-align: left; font-size: 13px; vertical-align: top; }
th { color: #4f7165; background: #f6faf8; }
.inline-action input { width: 110px; }
.empty { color: #799087; text-align: center; padding: 24px; }
details { margin: 12px 0; }
summary { cursor: pointer; color: #217a58; }
pre { white-space: pre-wrap; padding: 14px; border-radius: 8px; background: #f6faf8; font-family: inherit; line-height: 1.65; }
@media (max-width: 720px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-grid h3, .form-grid .wide { grid-column: auto; }
}
</style>
