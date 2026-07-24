<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  changeAidPlanStatus,
  createAidPlan,
  createAppeal,
  createSatisfactionSurvey,
  estimateAidPlan,
  getAidPlans,
  getMyAppeals,
  getPendingAppeals,
  getSatisfactionSurveySummary,
  getSatisfactionSurveys,
  handleAppeal,
  publishSatisfactionSurvey,
  resubmitAppeal,
  submitSatisfactionSurvey
} from '../../api'

const props = defineProps({
  menuName: { type: String, default: '' }
})

const mode = computed(() => {
  if (props.menuName === '资助方案管理') return 'plan'
  if (props.menuName === '我的申诉') return 'myAppeal'
  if (props.menuName === '申诉处理') return 'appealReview'
  if (props.menuName === '问卷管理') return 'surveyAdmin'
  return 'surveyStudent'
})

const loading = ref(false)
const error = ref('')
const notice = ref('')
const plans = ref([])
const appeals = ref([])
const surveys = ref([])
const surveyAnswers = reactive({})

const planForm = reactive({
  planName: '',
  fundSource: '',
  amountMode: 'FIXED',
  fixedAmount: 1000,
  minAmount: null,
  maxAmount: null,
  quotaLimit: 100,
  validStart: '',
  validEnd: '',
  conditionExpression: ''
})

const appealForm = reactive({
  sourceType: 'SUBSIDY',
  sourceApplyId: '',
  reason: '',
  attachmentIds: []
})

const surveyForm = reactive({
  title: '',
  targetType: 'ALL',
  targetBatchId: null,
  startDate: '',
  endDate: ''
})

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (mode.value === 'plan') plans.value = await getAidPlans()
    if (mode.value === 'myAppeal') appeals.value = await getMyAppeals()
    if (mode.value === 'appealReview') appeals.value = await getPendingAppeals()
    if (mode.value === 'surveyAdmin' || mode.value === 'surveyStudent') {
      surveys.value = await getSatisfactionSurveys()
      for (const item of surveys.value) {
        surveyAnswers[item.id] ||= { score: 5, suggestion: '' }
      }
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function submitPlan() {
  await run(async () => {
    const payload = {
      ...planForm,
      fixedAmount: planForm.amountMode === 'FIXED' ? Number(planForm.fixedAmount) : null,
      minAmount: planForm.amountMode === 'RANGE' ? Number(planForm.minAmount) : null,
      maxAmount: planForm.amountMode === 'RANGE' ? Number(planForm.maxAmount) : null,
      quotaLimit: Number(planForm.quotaLimit)
    }
    await createAidPlan(payload)
    notice.value = '方案草稿已创建'
    await load()
  })
}

async function planAction(item, action) {
  await run(async () => {
    if (action === 'estimate') {
      const result = await estimateAidPlan(item.id)
      notice.value = `预计符合 ${result.estimatedMatchedStudents} 人，名额覆盖 ${result.estimatedCoverage} 人`
      return
    }
    await changeAidPlanStatus(item.id, action)
    notice.value = action === 'publish' ? '方案已发布' : '方案已下线'
    await load()
  })
}

async function submitAppeal() {
  await run(async () => {
    await createAppeal({
      ...appealForm,
      sourceApplyId: Number(appealForm.sourceApplyId)
    })
    appealForm.sourceApplyId = ''
    appealForm.reason = ''
    notice.value = '申诉已提交'
    await load()
  })
}

async function reviewAppeal(item, action) {
  const conclusion = window.prompt('请输入调查结论或处理说明')
  if (!conclusion) return
  await run(async () => {
    await handleAppeal(item.id, { action, conclusion })
    notice.value = '申诉处理状态已更新'
    await load()
  })
}

async function supplementAppeal(item) {
  const reason = window.prompt('请填写补充后的申诉理由', item.reason)
  if (!reason) return
  await run(async () => {
    await resubmitAppeal(item.id, { reason, attachmentIds: [] })
    notice.value = '申诉已补充并重新提交'
    await load()
  })
}

async function submitSurveyConfig() {
  await run(async () => {
    await createSatisfactionSurvey(surveyForm)
    notice.value = '问卷草稿已创建'
    await load()
  })
}

async function publishSurvey(item) {
  await run(async () => {
    await publishSatisfactionSurvey(item.id)
    notice.value = '问卷已发布'
    await load()
  })
}

async function showSummary(item) {
  await run(async () => {
    const summary = await getSatisfactionSurveySummary(item.id)
    const words = Object.entries(summary.keywords || {}).slice(0, 8)
      .map(([word, count]) => `${word}(${count})`).join('、') || '暂无'
    notice.value = `答卷 ${summary.response_count} 份，平均 ${summary.average_score} 分；高频词：${words}`
  })
}

async function submitAnswer(item) {
  await run(async () => {
    await submitSatisfactionSurvey(item.id, surveyAnswers[item.id])
    notice.value = '感谢反馈，答卷已提交'
    await load()
  })
}

async function run(action) {
  error.value = ''
  notice.value = ''
  try {
    await action()
  } catch (e) {
    error.value = e.message
  }
}

function statusText(status, kind) {
  if (kind === 'plan') return ['草稿', '已发布', '已下线'][status] || status
  if (kind === 'appeal') return ({ 1: '待受理', 2: '处理中', 3: '申诉成立', 4: '申诉驳回', 5: '退回补充' })[status] || status
  return ['草稿', '已发布', '已结束'][status] || status
}
</script>

<template>
  <div class="support-page">
    <header>
      <h2>{{ menuName }}</h2>
      <p>资助方案、异议处理与服务满意度闭环。</p>
    </header>
    <p v-if="error" class="message error">{{ error }}</p>
    <p v-if="notice" class="message ok">{{ notice }}</p>
    <p v-if="loading">正在加载…</p>

    <template v-if="mode === 'plan'">
      <form class="card form-grid" @submit.prevent="submitPlan">
        <h3>新建方案草稿</h3>
        <input v-model.trim="planForm.planName" required placeholder="方案名称" />
        <input v-model.trim="planForm.fundSource" required placeholder="资金来源" />
        <select v-model="planForm.amountMode">
          <option value="FIXED">固定金额</option>
          <option value="RANGE">金额区间</option>
        </select>
        <input v-if="planForm.amountMode === 'FIXED'" v-model.number="planForm.fixedAmount" min="0.01" step="0.01" type="number" placeholder="固定金额" />
        <template v-else>
          <input v-model.number="planForm.minAmount" min="0" step="0.01" type="number" placeholder="最低金额" />
          <input v-model.number="planForm.maxAmount" min="0" step="0.01" type="number" placeholder="最高金额" />
        </template>
        <input v-model.number="planForm.quotaLimit" required min="1" type="number" placeholder="名额上限" />
        <input v-model="planForm.validStart" required type="date" />
        <input v-model="planForm.validEnd" required type="date" />
        <textarea v-model.trim="planForm.conditionExpression" placeholder="准入条件，例如：建档立卡=是 AND 无挂科"></textarea>
        <button type="submit">保存草稿</button>
      </form>
      <div class="card" v-for="item in plans" :key="item.id">
        <div class="row"><strong>{{ item.plan_name }}</strong><span>{{ statusText(item.status, 'plan') }}</span></div>
        <p>{{ item.fund_source }} · 名额 {{ item.quota_limit }} · {{ item.valid_start }} 至 {{ item.valid_end }}</p>
        <div class="actions">
          <button v-if="item.status === 0" @click="planAction(item, 'estimate')">试运行估算</button>
          <button v-if="item.status === 0" @click="planAction(item, 'publish')">发布</button>
          <button v-if="item.status === 1" @click="planAction(item, 'offline')">下线</button>
        </div>
      </div>
    </template>

    <template v-if="mode === 'myAppeal'">
      <form class="card form-grid" @submit.prevent="submitAppeal">
        <h3>提交申诉</h3>
        <select v-model="appealForm.sourceType">
          <option value="SUBSIDY">困难补助</option>
          <option value="GIFT">爱心大礼包</option>
        </select>
        <input v-model="appealForm.sourceApplyId" required min="1" type="number" placeholder="原申请 ID" />
        <textarea v-model.trim="appealForm.reason" required placeholder="申诉理由与补充说明"></textarea>
        <button type="submit">提交申诉</button>
      </form>
      <div class="card" v-for="item in appeals" :key="item.id">
        <div class="row"><strong>{{ item.appeal_no }}</strong><span>{{ statusText(item.status, 'appeal') }}</span></div>
        <p>{{ item.source_type }} #{{ item.source_apply_id }}：{{ item.reason }}</p>
        <p v-if="item.conclusion">处理结论：{{ item.conclusion }}</p>
        <button v-if="item.status === 5" @click="supplementAppeal(item)">补充后重新提交</button>
      </div>
    </template>

    <template v-if="mode === 'appealReview'">
      <div class="card" v-for="item in appeals" :key="item.id">
        <div class="row"><strong>{{ item.student_name }}（{{ item.student_no }}）</strong><span>{{ statusText(item.status, 'appeal') }}</span></div>
        <p>{{ item.source_type }} #{{ item.source_apply_id }}：{{ item.reason }}</p>
        <div class="actions">
          <button v-if="item.status === 1" @click="reviewAppeal(item, 'ACCEPT')">受理</button>
          <button @click="reviewAppeal(item, 'UPHOLD')">申诉成立</button>
          <button @click="reviewAppeal(item, 'REJECT')">驳回申诉</button>
          <button @click="reviewAppeal(item, 'RETURN')">退回补充</button>
        </div>
      </div>
      <p v-if="!loading && appeals.length === 0">当前没有待处理申诉。</p>
    </template>

    <template v-if="mode === 'surveyAdmin'">
      <form class="card form-grid" @submit.prevent="submitSurveyConfig">
        <h3>新建满意度问卷</h3>
        <input v-model.trim="surveyForm.title" required placeholder="问卷标题" />
        <select v-model="surveyForm.targetType">
          <option value="ALL">全部资助业务</option>
          <option value="GIFT">绿色通道</option>
          <option value="SUBSIDY">困难补助</option>
        </select>
        <input v-model="surveyForm.startDate" required type="date" />
        <input v-model="surveyForm.endDate" required type="date" />
        <button type="submit">保存草稿</button>
      </form>
      <div class="card" v-for="item in surveys" :key="item.id">
        <div class="row"><strong>{{ item.title }}</strong><span>{{ statusText(item.status, 'survey') }}</span></div>
        <p>{{ item.start_date }} 至 {{ item.end_date }} · {{ item.target_type }}</p>
        <div class="actions">
          <button v-if="item.status === 0" @click="publishSurvey(item)">发布</button>
          <button @click="showSummary(item)">查看汇总</button>
        </div>
      </div>
    </template>

    <template v-if="mode === 'surveyStudent'">
      <div class="card" v-for="item in surveys" :key="item.id">
        <div class="row"><strong>{{ item.title }}</strong><span>{{ item.submitted_score ? '已提交' : '待填写' }}</span></div>
        <template v-if="!item.submitted_score">
          <label>满意度（1-5 分）<input v-model.number="surveyAnswers[item.id].score" min="1" max="5" type="number" /></label>
          <textarea v-model.trim="surveyAnswers[item.id].suggestion" placeholder="您的建议（选填）"></textarea>
          <button @click="submitAnswer(item)">提交反馈</button>
        </template>
        <p v-else>您的评分：{{ item.submitted_score }} 分</p>
      </div>
      <p v-if="!loading && surveys.length === 0">当前没有开放中的问卷。</p>
    </template>
  </div>
</template>

<style scoped>
.support-page { display: grid; gap: 16px; color: #16372c; }
header p, .card p { color: #60786f; }
.card { padding: 18px; border: 1px solid #dce9e3; border-radius: 16px; background: #fff; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.form-grid h3, .form-grid textarea, .form-grid button { grid-column: 1 / -1; }
input, select, textarea { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 1px solid #c8d9d1; border-radius: 10px; font: inherit; }
textarea { min-height: 86px; resize: vertical; }
button { width: fit-content; padding: 9px 16px; border: 0; border-radius: 10px; background: #177b57; color: #fff; cursor: pointer; }
.row, .actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.actions { justify-content: flex-start; flex-wrap: wrap; }
.message { padding: 10px 14px; border-radius: 10px; }
.error { background: #fff1f0; color: #b42318; }
.ok { background: #ecfdf3; color: #067647; }
@media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } }
</style>
