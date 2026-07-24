<script setup>
import { ref, onMounted } from 'vue'
import { getEvaluationHistory } from '@/api/workstudy/evaluation'

const list = ref([])
const studentId = ref(1)

onMounted(async () => {
  list.value = await getEvaluationHistory(studentId.value)
})
</script>

<template>
  <div class="page-shell">
    <h1>评价历史</h1>

    <table class="table">
      <thead>
      <tr>
        <th>年份</th>
        <th>月份</th>
        <th>评分</th>
        <th>内容</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in list" :key="item.id">
        <td>{{ item.evalYear }}</td>
        <td>{{ item.evalMonth }}</td>
        <td>{{ item.score }}</td>
        <td>{{ item.content }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>