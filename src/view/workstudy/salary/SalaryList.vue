<script setup>
import { ref, onMounted } from 'vue'
import { getStudentSalaries } from '@/api/workstudy/salary'
import { SALARY_STATUS } from '@/utils/workstudy-enums'

const list = ref([])

onMounted(async () => {
  list.value = await getStudentSalaries()
})
</script>

<template>
  <div class="page-shell">
    <h1>我的薪酬</h1>

    <table class="table">
      <thead>
      <tr>
        <th>年月</th>
        <th>应发</th>
        <th>实发</th>
        <th>状态</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in list" :key="item.id">
        <td>{{ item.salaryYear }}-{{ item.salaryMonth }}</td>
        <td>{{ item.shouldAmount }}</td>
        <td>{{ item.actualAmount }}</td>
        <td>
            <span class="badge" :style="{background:SALARY_STATUS[item.status].color}">
              {{ SALARY_STATUS[item.status].label }}
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
.badge {
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}
</style>