<script setup>
import { ref } from 'vue'
import { checkIn, checkOut } from '@/api/workstudy/attendance'

const hireId = 1 // 实际应从上岗记录中取
const location = '校内'

const doCheckIn = async () => {
  await checkIn(hireId, 1, location)
  alert('签到成功')
}

const doCheckOut = async () => {
  await checkOut(1) // attendanceId
  alert('签退成功')
}
</script>

<template>
  <div class="page-shell">
    <h1>考勤打卡</h1>
    <div style="display:flex;gap:12px">
      <button @click="doCheckIn">签到</button>
      <button @click="doCheckOut" style="background:#dc3545">签退</button>
    </div>
  </div>
</template>