<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPositionList, submitPositionForApproval, offlinePosition } from '@/api/workstudy/position'
import { getCurrentUser } from '@/api/auth'

const router = useRouter()
const positions = ref([])
const loading = ref(false)
const filterStatus = ref('')
const currentUser = ref(null)

const statusMap = {
  0: { label: '草稿', color: '#6c757d' },
  1: { label: '待审核', color: '#ffc107' },
  2: { label: '已发布', color: '#28a745' },
  3: { label: '已下架', color: '#dc3545' },
  4: { label: '已驳回', color: '#dc3545' }
}

onMounted(async () => {
  currentUser.value = await getCurrentUser()
  loadPositions()
})

async function loadPositions() {
  loading.value = true
  try {
    const params = {}
    if (filterStatus.value !== '') {
      params.status = filterStatus.value
    }
    positions.value = await getPositionList(params.batchId, params.status)
  } catch (error) {
    console.error('加载岗位列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleSubmit(positionId) {
  if (!confirm('确定要提交审核吗？')) return

  try {
    await submitPositionForApproval(positionId)
    alert('提交成功，等待审核')
    loadPositions()
  } catch (error) {
    alert('提交失败: ' + error.message)
  }
}

async function handleOffline(positionId) {
  if (!confirm('确定要下架该岗位吗？')) return

  try {
    await offlinePosition(positionId)
    alert('岗位已下架')
    loadPositions()
  } catch (error) {
    alert('下架失败: ' + error.message)
  }
}

function canEdit(position) {
  return position.status === 0 || position.status === 4 // 草稿或驳回状态可编辑
}

function canSubmit(position) {
  return position.status === 0 || position.status === 4 // 草稿或驳回状态可提交
}
</script>

<template>
  <div class="position-list-page">
    <header class="page-header">
      <h1>岗位管理</h1>
      <div class="header-actions">
        <select v-model="filterStatus" @change="loadPositions" class="filter-select">
          <option value="">全部状态</option>
          <option value="0">草稿</option>
          <option value="1">待审核</option>
          <option value="2">已发布</option>
          <option value="3">已下架</option>
          <option value="4">已驳回</option>
        </select>
        <router-link to="/workstudy/positions/publish" class="btn btn-primary">
          + 发布新岗位
        </router-link>
      </div>
    </header>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="position-table">
      <table>
        <thead>
        <tr>
          <th>岗位名称</th>
          <th>所属部门</th>
          <th>工作地点</th>
          <th>招聘人数</th>
          <th>时薪(元)</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="position in positions" :key="position.id">
          <td>
            <router-link :to="`/workstudy/positions/${position.id}`" class="link">
              {{ position.positionName }}
            </router-link>
          </td>
          <td>{{ position.departmentName }}</td>
          <td>{{ position.workLocation }}</td>
          <td>{{ position.recruitCount }}</td>
          <td>{{ position.salaryStandard }}</td>
          <td>
              <span
                  class="status-badge"
                  :style="{ backgroundColor: statusMap[position.status]?.color }"
              >
                {{ statusMap[position.status]?.label }}
              </span>
          </td>
          <td>
            <div class="action-buttons">
              <router-link
                  :to="`/workstudy/positions/${position.id}`"
                  class="btn btn-sm btn-secondary"
              >
                查看
              </router-link>
              <router-link
                  v-if="canEdit(position)"
                  :to="`/workstudy/positions/${position.id}?edit=true`"
                  class="btn btn-sm btn-primary"
              >
                编辑
              </router-link>
              <router-link
                  v-permission="'workstudy:position:publish'"
                  to="/workstudy/positions/publish"
                  class="btn btn-primary"
              >
                + 发布新岗位
              </router-link>
              <button
                  v-if="canSubmit(position)"
                  @click="handleSubmit(position.id)"
                  class="btn btn-sm btn-success"
              >
                提交审核
              </button>
              <button
                  v-if="position.status === 2"
                  @click="handleOffline(position.id)"
                  class="btn btn-sm btn-danger"
              >
                下架
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="positions.length === 0" class="empty-state">
        <p>暂无岗位数据</p>
        <router-link to="/workstudy/positions/publish" class="btn btn-primary">
          立即发布岗位
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.position-list-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #16352c;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #cbdad0;
  border-radius: 8px;
  background: white;
  color: #16352c;
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

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background: #217a58;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.position-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  font-weight: 600;
  color: #495057;
}

.link {
  color: #217a58;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-state p {
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #50816d;
}
</style>