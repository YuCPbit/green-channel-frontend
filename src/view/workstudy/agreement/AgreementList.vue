<script setup>
import { ref, onMounted } from 'vue'
import { getStudentAgreements, signAgreement } from '@/api/workstudy/agreement'
import { AGREEMENT_STATUS } from '@/utils/workstudy-enums'

const list = ref([])

onMounted(async () => {
  list.value = await getStudentAgreements()
})

const sign = async (id) => {
  await signAgreement(id)
  alert('签署成功')
  list.value = await getStudentAgreements()
}
</script>

<template>
  <div class="page-shell">
    <h1>我的协议</h1>

    <table class="table">
      <thead>
      <tr>
        <th>岗位</th>
        <th>状态</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in list" :key="item.id">
        <td>{{ item.positionName }}</td>
        <td>
            <span class="badge" :style="{background:AGREEMENT_STATUS[item.status].color}">
              {{ AGREEMENT_STATUS[item.status].label }}
            </span>
        </td>
        <td>
          <button v-if="item.status===0" @click="sign(item.id)">签署</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table {
  width: 100%;
  background: white;
  border-radius: 12px;
}
.badge {
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}
</style>