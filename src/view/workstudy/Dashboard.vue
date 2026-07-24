<script setup>
import { ref, onMounted } from 'vue'
import { getCurrentBatch } from '@/api/workstudy/batch'
import { getPositionList } from '@/api/workstudy/position'
import { getMyApplications } from '@/api/workstudy/apply'
import { getStudentAgreements } from '@/api/workstudy/agreement'
import { getStudentSalaries } from '@/api/workstudy/salary'

const currentBatch = ref(null)
const stats = ref({
  totalPositions: 0,
  myApplications: 0,
  activeAgreements: 0,
  pendingSalary: 0
})
const recentPositions = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    // 获取当前批次
    const batchRes = await getCurrentBatch()
    currentBatch.value = batchRes

    // 获取岗位列表
    const positionsRes = await getPositionList()
    recentPositions.value = positionsRes.slice(0, 5)
    stats.value.totalPositions = positionsRes.length

    // 获取我的申请
    const applicationsRes = await getMyApplications()
    stats.value.myApplications = applicationsRes.length

    // 获取我的协议
    const agreementsRes = await getStudentAgreements()
    stats.value.activeAgreements = agreementsRes.filter(a => a.status === 1).length

    // 获取薪酬信息
    const salariesRes = await getStudentSalaries()
    stats.value.pendingSalary = salariesRes.filter(s => s.status === 0).length
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="workstudy-dashboard">
    <header class="dashboard-header">
      <h1>勤工俭学工作台</h1>
      <p class="subtitle" v-if="currentBatch">
        当前批次：{{ currentBatch.batchName }}（{{ currentBatch.academicYear }}）
      </p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalPositions }}</div>
          <div class="stat-label">招聘中岗位</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.myApplications }}</div>
          <div class="stat-label">我的申请</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeAgreements }}</div>
          <div class="stat-label">生效协议</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingSalary }}</div>
          <div class="stat-label">待发薪酬</div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <section class="recent-positions">
        <h2>最新招聘岗位</h2>
        <div class="position-list">
          <div v-for="position in recentPositions" :key="position.id" class="position-card">
            <h3>{{ position.positionName }}</h3>
            <p class="position-department">{{ position.departmentName }}</p>
            <div class="position-meta">
              <span>📍 {{ position.workLocation }}</span>
              <span>⏰ {{ position.workHours }}/周</span>
              <span>💵 {{ position.salaryStandard }}/小时</span>
            </div>
            <div class="position-actions">
              <router-link :to="`/workstudy/positions/${position.id}`" class="btn btn-primary">
                查看详情
              </router-link>
            </div>
          </div>
        </div>
        <router-link to="/workstudy/positions" class="view-all">
          查看全部岗位 →
        </router-link>
      </section>

      <section class="quick-actions">
        <h2>快捷操作</h2>
        <div class="action-grid">
          <router-link to="/workstudy/positions" class="action-card">
            <div class="action-icon">🔍</div>
            <span>浏览岗位</span>
          </router-link>
          <router-link to="/workstudy/apply/my" class="action-card">
            <div class="action-icon">📋</div>
            <span>我的申请</span>
          </router-link>
          <router-link to="/workstudy/attendance" class="action-card">
            <div class="action-icon">⏱️</div>
            <span>考勤打卡</span>
          </router-link>
          <router-link to="/workstudy/salary" class="action-card">
            <div class="action-icon">💰</div>
            <span>薪酬查询</span>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.workstudy-dashboard {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  color: #16352c;
}

.subtitle {
  color: #50816d;
  margin-top: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  background: #e7f1eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #217a58;
}

.stat-label {
  color: #668077;
  font-size: 14px;
  margin-top: 4px;
}

.dashboard-content {
  display: grid;
  gap: 40px;
}

.recent-positions h2,
.quick-actions h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #16352c;
}

.position-list {
  display: grid;
  gap: 16px;
}

.position-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.position-card h3 {
  margin: 0 0 8px 0;
  color: #16352c;
}

.position-department {
  color: #50816d;
  font-size: 14px;
  margin-bottom: 12px;
}

.position-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #668077;
  margin-bottom: 16px;
}

.position-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #217a58;
  color: white;
}

.view-all {
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #217a58;
  text-decoration: none;
  font-weight: 600;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  text-decoration: none;
  color: #16352c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #50816d;
}
</style>