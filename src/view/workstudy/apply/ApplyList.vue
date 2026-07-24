<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPositionApplications, recordInterviewResult } from '@/api/workstudy/apply'
import { APPLY_STATUS } from '@/utils/workstudy-enums'

const route = useRoute()
const list = ref([])

onMounted(async () => {
  list.value = await getPositionApplications(route.query.positionId)
})

const setInterview = async (id, status) => {
  await recordInterviewResult(id, status)
  alert('操作成功')
  list.value = await getPositionApplications(route.query.positionId)
}
</script>

<template>
  <div class="page-shell">
    <h1>申请列表</h1>

    <table class="table">
      <thead>
      <tr>
        <th>学生</th>
        <th>状态</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in list" :key="item.id">
        <td>{{ item.studentName }}</td>
        <td>
            <span class="badge" :style="{background:APPLY_STATUS[item.status].color}">
              {{ APPLY_STATUS[item.status].label }}
            </span>
        </td>
        <td>
          <button v-if="item.status===0" @click="setInterview(item.id,1)">通过</button>
          <button v-if="item.status===0" @click="setInterview(item.id,2)" style="background:#dc3545">不通过</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table {
  width: 100%;
  background: white;
  border-radius: 12px;
  border-collapse: collapse;
}
th, td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}
.badge {
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}
</style>