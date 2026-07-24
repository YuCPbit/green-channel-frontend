<script setup>
import { ref } from 'vue'
import { calculateSalary } from '@/api/workstudy/salary'

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)

const calculate = async () => {
  const msg = await calculateSalary(year.value, month.value)
  alert(msg)
}
</script>

<template>
  <div class="page-shell">
    <h1>薪酬核算</h1>

    <div class="card">
      <label>年份
        <input v-model.number="year" type="number" />
      </label>
      <label>月份
        <input v-model.number="month" type="number" min="1" max="12" />
      </label>
    </div>

    <button @click="calculate">核算本月薪酬</button>
    <button
        v-permission="'workstudy:salary:calculate'"
        @click="calculate"
    >
      核算薪酬
    </button>
  </div>
</template>