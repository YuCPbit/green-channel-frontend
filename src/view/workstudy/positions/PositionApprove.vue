<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPositionDetail, approvePosition } from '@/api/workstudy/position'

const route = useRoute()
const router = useRouter()
const position = ref(null)

onMounted(async () => {
  position.value = await getPositionDetail(route.params.id)
})

const approve = async (approved) => {
  const reason = approved ? '' : prompt('请输入驳回原因')
  await approvePosition(route.params.id, approved, reason)
  alert(approved ? '审核通过' : '已驳回')
  router.back()
}
</script>

<template>
  <div class="page-shell" v-if="position">
    <h1>岗位审核</h1>

    <div class="card">
      <p><strong>岗位名称：</strong>{{ position.positionName }}</p>
      <p><strong>部门：</strong>{{ position.departmentName }}</p>
      <p><strong>工作地点：</strong>{{ position.workLocation }}</p>
      <p><strong>招聘人数：</strong>{{ position.recruitCount }}</p>
      <p><strong>时薪：</strong>{{ position.salaryStandard }} 元</p>
      <p><strong>工作描述：</strong>{{ position.jobDescription }}</p>
    </div>

    <div class="actions">
      <button @click="router.back()" class="secondary">返回</button>
      <button @click="approve(false)" style="background:#dc3545">驳回</button>
      <button @click="approve(true)">通过</button>
    </div>
  </div>
</template>