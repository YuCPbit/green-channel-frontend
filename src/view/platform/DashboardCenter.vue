<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getDashboardCollegeCompare,
  getDashboardStats,
  getDashboardSubsidyStructure,
  getDashboardWorkstudy,
  getSubsidyApplies,
  previewCustomReport,
  exportCustomReport
} from '../../api'

const props = defineProps({ menuName: String })
const loading = ref(false)
const error = ref('')
const stats = ref({})
const collegeRows = ref([])
const structureRows = ref([])
const workstudyRows = ref([])
const reportRows = ref([])
const reportType = ref('student-list')

const isCollegeReport = computed(() => props.menuName === '学院报表')
const statEntries = computed(() => Object.entries(stats.value || {}).filter(([, value]) => typeof value !== 'object'))

function labels(row) {
  return Object.keys(row || {})
}

function reportRequest() {
  if (reportType.value === 'student-list') {
    return {
      module: 'base',
      reportType: 'student-list',
      templateName: '学生资助清单',
      fields: ['student_no', 'name', 'gender', 'poverty_level', 'college_name', 'apply_amount', 'approved_amount', 'apply_status'],
      filters: {}
    }
  }
  return {
    module: 'workstudy',
    reportType: reportType.value,
    templateName: `勤工助学-${reportType.value}`,
    fields: [],
    filters: {}
  }
}

async function previewReport() {
  error.value = ''
  try {
    reportRows.value = await previewCustomReport(reportRequest())
  } catch (e) {
    error.value = e.message
  }
}

async function exportReport() {
  error.value = ''
  try {
    await exportCustomReport(reportRequest(), `${reportRequest().templateName}.xlsx`)
  } catch (e) {
    error.value = e.message
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (isCollegeReport.value) {
      const result = await getSubsidyApplies({ page: 1, size: 100 })
      const items = result.items || result.records || []
      const byStatus = items.reduce((map, item) => {
        const key = item.statusName || `状态 ${item.status}`
        map[key] = (map[key] || 0) + 1
        return map
      }, {})
      stats.value = { 当前学院申请数: result.total ?? items.length, 待处理数: items.filter((item) => [1, 2, 3].includes(item.status)).length }
      collegeRows.value = Object.entries(byStatus).map(([status, count]) => ({ status, count }))
      structureRows.value = items.slice(0, 30)
      return
    }
    const [core, colleges, structure, workstudy] = await Promise.all([
      getDashboardStats('base'),
      getDashboardCollegeCompare(),
      getDashboardSubsidyStructure(),
      getDashboardWorkstudy('position-stats')
    ])
    stats.value = core || {}
    collegeRows.value = colleges || []
    structureRows.value = structure || []
    workstudyRows.value = workstudy || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="dashboard-center">
    <div class="heading">
      <div><h2>{{ isCollegeReport ? '学院资助报表' : '全校资助数据看板' }}</h2><p>数据直接读取业务服务，刷新可获取最新结果。</p></div>
      <button class="secondary" :disabled="loading" @click="load">{{ loading ? '刷新中…' : '刷新数据' }}</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="stats">
      <article v-for="[key, value] in statEntries" :key="key"><span>{{ key }}</span><strong>{{ value ?? '-' }}</strong></article>
    </div>

    <section v-if="collegeRows.length">
      <h3>{{ isCollegeReport ? '申请状态分布' : '学院对比' }}</h3>
      <div class="table-wrap"><table><thead><tr><th v-for="key in labels(collegeRows[0])" :key="key">{{ key }}</th></tr></thead>
        <tbody><tr v-for="(row,index) in collegeRows" :key="index"><td v-for="key in labels(collegeRows[0])" :key="key">{{ row[key] ?? '-' }}</td></tr></tbody></table></div>
    </section>
    <section v-if="structureRows.length">
      <h3>{{ isCollegeReport ? '申请明细（前 30 条）' : '补助结构' }}</h3>
      <div class="table-wrap"><table><thead><tr><th v-for="key in labels(structureRows[0]).slice(0,8)" :key="key">{{ key }}</th></tr></thead>
        <tbody><tr v-for="(row,index) in structureRows" :key="index"><td v-for="key in labels(structureRows[0]).slice(0,8)" :key="key">{{ row[key] ?? '-' }}</td></tr></tbody></table></div>
    </section>
    <section v-if="workstudyRows.length">
      <h3>勤工助学岗位统计</h3>
      <div class="table-wrap"><table><thead><tr><th v-for="key in labels(workstudyRows[0])" :key="key">{{ key }}</th></tr></thead>
        <tbody><tr v-for="(row,index) in workstudyRows" :key="index"><td v-for="key in labels(workstudyRows[0])" :key="key">{{ row[key] ?? '-' }}</td></tr></tbody></table></div>
    </section>
    <section v-if="!isCollegeReport" class="report-builder">
      <div class="heading">
        <div><h3>统计报表与导出</h3><p>选择标准模板后可先预览，再导出带表头的 Excel。</p></div>
        <div class="report-actions">
          <select v-model="reportType">
            <option value="student-list">学生资助清单</option>
            <option value="position-stat">勤工岗位统计</option>
            <option value="student-stat">勤工学生统计</option>
            <option value="salary-stat">勤工薪酬统计</option>
            <option value="position-detail">勤工岗位明细</option>
          </select>
          <button class="secondary" @click="previewReport">预览</button>
          <button @click="exportReport">导出 Excel</button>
        </div>
      </div>
      <div v-if="reportRows.length" class="table-wrap"><table>
        <thead><tr><th v-for="key in labels(reportRows[0])" :key="key">{{ key }}</th></tr></thead>
        <tbody><tr v-for="(row,index) in reportRows.slice(0,50)" :key="index"><td v-for="key in labels(reportRows[0])" :key="key">{{ row[key] ?? '-' }}</td></tr></tbody>
      </table></div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-center{display:grid;gap:20px}.heading,.report-actions{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}h2{margin:0}p{color:#64748b}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.stats article{padding:18px;border-radius:14px;background:linear-gradient(135deg,#ecfdf5,#eff6ff);display:grid;gap:8px}.stats span{color:#64748b}.stats strong{font-size:28px}.table-wrap{overflow:auto;background:white;border:1px solid #e2e8f0;border-radius:12px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;white-space:nowrap}.secondary,button,select{border:0;border-radius:8px;padding:10px 14px;background:#eef2ff;cursor:pointer}button:not(.secondary){background:#0f766e;color:white}.error{color:#b91c1c}.report-builder{padding-top:8px;border-top:1px solid #e2e8f0}
</style>
