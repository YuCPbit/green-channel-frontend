<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { approveSalaryBySchool } from '@/api/workstudy/salary'

const route = useRoute()
const amount = ref(0)

const approve = async () => {
  await approveSalaryBySchool(route.params.salaryId, amount.value)
  alert('学校审批完成')
}
</script>

<template>
  <div class="page-shell">
    <h1>学校审批薪酬</h1>
    <input v-model.number="amount" placeholder="最终发放金额" />
    <button @click="approve">审批</button>
  </div>
</template>