<script setup>
import { ref, onMounted } from 'vue'
import { getMyApplications } from '@/api/workstudy/apply'
import { APPLY_STATUS } from '@/utils/workstudy-enums'

const list = ref([])

onMounted(async () => {
  list.value = await getMyApplications()
})
</script>

<template>
  <div class="page-shell">
    <h1>我的申请</h1>

    <table class="table">
      <thead>
      <tr>
        <th>岗位</th>
        <th>状态</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in list" :key="item.id">
        <td>{{ item.positionName }}</td>
        <td>
            <span class="badge" :style="{background:APPLY_STATUS[item.status].color}">
              {{ APPLY_STATUS[item.status].label }}
            </span>
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