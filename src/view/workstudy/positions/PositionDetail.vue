<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPositionDetail, submitPositionForApproval, offlinePosition } from '@/api/workstudy/position'
import { POSITION_STATUS } from '@/utils/workstudy-enums'

const route = useRoute()
const router = useRouter()
const position = ref(null)

onMounted(async () => {
  position.value = await getPositionDetail(route.params.id)
})

const submit = async () => {
  await submitPositionForApproval(route.params.id)
  alert('已提交审核')
  router.back()
}

const offline = async () => {
  await offlinePosition(route.params.id)
  alert('岗位已下架')
  router.back()
}
</script>

<template>
  <div class="page-shell" v-if="position">
    <h1>{{ position.positionName }}</h1>
    <span class="badge" :style="{background:POSITION_STATUS[position.status].color}">
      {{ POSITION_STATUS[position.status].label }}
    </span>

    <div class="info">
      <p>部门：{{ position.departmentName }}</p>
      <p>地点：{{ position.workLocation }}</p>
      <p>招聘人数：{{ position.recruitCount }}</p>
      <p>时薪：{{ position.salaryStandard }} 元</p>
      <p>每周工时：{{ position.workHours }}</p>
      <p>描述：{{ position.jobDescription }}</p>
    </div>

    <div class="actions">
      <button @click="router.back()" class="secondary">返回</button>
      <button v-if="position.status === 0 || position.status === 4" @click="submit">提交审核</button>
      <button v-if="position.status === 2" @click="offline" style="background:#dc3545">下架</button>
      <button
          v-if="position.status === 0 || position.status === 4"
          v-permission="'workstudy:position:submit'"
          @click="submit"
      >
        提交审核
      </button>
    </div>
  </div>
</template>

<style scoped>
.badge {
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.info {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
}
.actions {
  display: flex;
  gap: 12px;
}
</style>

