<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { confirmAttendance } from '@/api/workstudy/attendance'

const route = useRoute()

const confirm = async () => {
  await confirmAttendance(route.params.attendanceId)
  alert('考勤已确认')
}
</script>

<template>
  <div class="page-shell">
    <h1>考勤确认</h1>
    <p>考勤ID：{{ route.params.attendanceId }}</p>
    <button @click="confirm">确认考勤</button>
    <button
        v-permission="'workstudy:attendance:confirm'"
        @click="confirm"
    >
      确认考勤
    </button>
  </div>
</template>