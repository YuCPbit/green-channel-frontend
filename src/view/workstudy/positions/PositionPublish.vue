<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { publishPosition } from '@/api/workstudy/position'
import { getCurrentBatch } from '@/api/workstudy/batch'

const router = useRouter()
const loading = ref(false)

const form = ref({
  positionName: '',
  departmentName: '',
  workLocation: '',
  recruitCount: 1,
  salaryStandard: 0,
  workHours: 0,
  jobDescription: '',
  requirements: '',
  batchId: null
})

onMounted(async () => {
  const batch = await getCurrentBatch()
  form.value.batchId = batch.id
})

const submit = async () => {
  loading.value = true
  try {
    await publishPosition(form.value)
    alert('发布成功，等待审核')
    router.push('/workstudy/positions')
  } catch (e) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <h1>发布岗位</h1>
    <form @submit.prevent="submit" class="form-card">
      <input v-model="form.positionName" placeholder="岗位名称" required />
      <input v-model="form.departmentName" placeholder="部门名称" required />
      <input v-model="form.workLocation" placeholder="工作地点" required />
      <input v-model.number="form.recruitCount" type="number" placeholder="招聘人数" required />
      <input v-model.number="form.salaryStandard" type="number" placeholder="时薪（元）" required />
      <input v-model.number="form.workHours" type="number" placeholder="每周工时" />
      <textarea v-model="form.jobDescription" placeholder="工作描述" rows="3"></textarea>
      <textarea v-model="form.requirements" placeholder="岗位要求" rows="3"></textarea>

      <div class="actions">
        <button type="button" @click="router.back()" class="secondary">取消</button>
        <button :disabled="loading">提交</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  display: grid;
  gap: 16px;
}
input, textarea {
  padding: 10px;
  border: 1px solid #cbdad0;
  border-radius: 8px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>