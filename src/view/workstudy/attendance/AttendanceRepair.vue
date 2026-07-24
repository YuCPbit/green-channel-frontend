<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { applyRepair } from '@/api/workstudy/attendance'

const router = useRouter()

const form = ref({
  hireId: 1,
  attendanceDate: '2024-06-01',
  checkInTime: '2024-06-01T08:00:00',
  checkOutTime: '2024-06-01T17:00:00',
  reason: ''
})

const submit = async () => {
  await applyRepair(
      form.value.hireId,
      form.value.attendanceDate,
      form.value.checkInTime,
      form.value.checkOutTime,
      form.value.reason
  )
  alert('补打卡申请已提交')
  router.back()
}
</script>

<template>
  <div class="page-shell">
    <h1>补打卡申请</h1>

    <div class="card">
      <input v-model="form.attendanceDate" type="date" />
      <input v-model="form.checkInTime" type="datetime-local" />
      <input v-model="form.checkOutTime" type="datetime-local" />
      <textarea v-model="form.reason" placeholder="补卡原因"></textarea>
    </div>

    <button @click="submit">提交申请</button>
  </div>
</template>