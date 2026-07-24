<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { confirmSalaryByDepartment } from '@/api/workstudy/salary'

const route = useRoute()
const amount = ref(0)

const confirm = async () => {
  await confirmSalaryByDepartment(route.params.salaryId, amount.value)
  alert('部门确认完成')
}
</script>

<template>
  <div class="page-shell">
    <h1>部门确认薪酬</h1>
    <input v-model.number="amount" placeholder="确认金额" />
    <button @click="confirm">确认</button>
  </div>
</template>