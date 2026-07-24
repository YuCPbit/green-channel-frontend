<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApplyDetail, approveHire } from '@/api/workstudy/hire'

const route = useRoute()
const router = useRouter()
const apply = ref(null)

onMounted(async () => {
  apply.value = await getApplyDetail(route.params.applyId)
})

const approve = async () => {
  await approveHire(route.params.applyId)
  alert('录用成功')
  router.back()
}
</script>

<template>
  <div class="page-shell" v-if="apply">
    <h1>录用审批</h1>

    <div class="card">
      <p><strong>学生：</strong>{{ apply.studentName }}</p>
      <p><strong>岗位：</strong>{{ apply.positionName }}</p>
      <p><strong>面试状态：</strong>{{ apply.interviewStatus === 1 ? '通过' : '未通过' }}</p>
      <p><strong>辅导员意见：</strong>{{ apply.tutorRecommendation || '无' }}</p>
    </div>

    <div class="actions">
      <button @click="router.back()" class="secondary">返回</button>
      <button @click="approve">确认录用</button>
    </div>
  </div>
</template>