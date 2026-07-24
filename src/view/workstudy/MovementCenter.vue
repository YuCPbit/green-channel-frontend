<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createWorkstudyMovement,
  getMovementPositions,
  getMyWorkstudyMovements,
  getPendingWorkstudyMovements,
  reviewWorkstudyMovement
} from '../../api'

const props = defineProps({ menuName: { type: String, default: '' } })
const isReview = computed(() => props.menuName === '岗位变动审批')
const items = ref([])
const positions = ref([])
const error = ref('')
const notice = ref('')
const form = reactive({ hireId: '', movementType: 'LEAVE', targetPositionId: '', reason: '' })

onMounted(load)

async function load() {
  error.value = ''
  try {
    if (isReview.value) {
      items.value = await getPendingWorkstudyMovements()
    } else {
      ;[items.value, positions.value] = await Promise.all([
        getMyWorkstudyMovements(),
        getMovementPositions()
      ])
    }
  } catch (e) {
    error.value = e.message
  }
}

async function submit() {
  try {
    error.value = ''
    await createWorkstudyMovement({
      hireId: Number(form.hireId),
      movementType: form.movementType,
      targetPositionId: form.movementType === 'TRANSFER' ? Number(form.targetPositionId) : null,
      reason: form.reason
    })
    notice.value = '岗位变动申请已提交'
    form.hireId = ''
    form.targetPositionId = ''
    form.reason = ''
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function review(item, action) {
  const comment = window.prompt('请输入审批意见')
  if (!comment) return
  try {
    await reviewWorkstudyMovement(item.id, { action, comment })
    notice.value = action === 'APPROVE' ? '已批准并完成岗位关系变更' : '已驳回申请'
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function statusText(status) {
  return ({ 1: '待审批', 2: '已通过', 3: '已驳回' })[status] || status
}
</script>

<template>
  <div class="movement-page">
    <header><h2>{{ menuName }}</h2><p>所有调岗和离岗先审批，再联动岗位名额与在岗关系。</p></header>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="notice" class="ok">{{ notice }}</p>

    <form v-if="!isReview" class="card form" @submit.prevent="submit">
      <h3>发起岗位变动</h3>
      <input v-model="form.hireId" required min="1" type="number" placeholder="当前录用记录 ID" />
      <select v-model="form.movementType">
        <option value="LEAVE">申请离岗</option>
        <option value="TRANSFER">申请调岗</option>
      </select>
      <select v-if="form.movementType === 'TRANSFER'" v-model="form.targetPositionId" required>
        <option disabled value="">请选择目标岗位</option>
        <option v-for="position in positions" :key="position.id" :value="position.id">
          {{ position.department_name }} / {{ position.position_name }}（余 {{ position.recruit_count - position.hired_count }}）
        </option>
      </select>
      <textarea v-model.trim="form.reason" required placeholder="变动原因"></textarea>
      <button type="submit">提交审批</button>
    </form>

    <div class="card" v-for="item in items" :key="item.id">
      <div class="row">
        <strong>{{ item.student_name ? `${item.student_name}（${item.student_no}）` : item.movement_no }}</strong>
        <span>{{ statusText(item.status || 1) }}</span>
      </div>
      <p>{{ item.movement_type === 'TRANSFER' ? '调岗' : '离岗' }}：{{ item.from_position_name }}<template v-if="item.to_position_name"> → {{ item.to_position_name }}</template></p>
      <p>原因：{{ item.reason }}</p>
      <div v-if="isReview" class="actions">
        <button @click="review(item, 'APPROVE')">批准</button>
        <button class="secondary" @click="review(item, 'REJECT')">驳回</button>
      </div>
    </div>
    <p v-if="items.length === 0">当前没有记录。</p>
  </div>
</template>

<style scoped>
.movement-page { display: grid; gap: 16px; color: #16372c; }
header p, .card p { color: #60786f; }
.card { padding: 18px; border: 1px solid #dce9e3; border-radius: 16px; background: #fff; }
.form { display: grid; gap: 12px; }
input, select, textarea { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 1px solid #c8d9d1; border-radius: 10px; font: inherit; }
textarea { min-height: 86px; }
button { width: fit-content; padding: 9px 16px; border: 0; border-radius: 10px; background: #177b57; color: #fff; cursor: pointer; }
.secondary { background: #66756f; }
.row, .actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.actions { justify-content: flex-start; }
.error, .ok { padding: 10px 14px; border-radius: 10px; }
.error { background: #fff1f0; color: #b42318; }
.ok { background: #ecfdf3; color: #067647; }
</style>
