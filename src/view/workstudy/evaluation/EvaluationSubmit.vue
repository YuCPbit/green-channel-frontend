<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { submitEvaluation } from '@/api/workstudy/evaluation'

const router = useRouter()

const form = ref({
  studentId: null,
  hireId: null,
  evalYear: new Date().getFullYear(),
  evalMonth: new Date().getMonth() + 1,
  score: 5,
  content: ''
})

const submit = async () => {
  await submitEvaluation(form.value)
  alert('评价提交成功')
  router.back()
}
</script>

<template>
  <div class="page-shell">
    <h1>提交评价</h1>

    <div class="card">
      <input v-model.number="form.studentId" placeholder="学生ID" />
      <input v-model.number="form.hireId" placeholder="录用ID" />
      <input v-model.number="form.score" placeholder="评分(1-5)" />
      <textarea v-model="form.content" placeholder="评价内容"></textarea>
    </div>

    <button @click="submit">提交</button>
  </div>
</template>