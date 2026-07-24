<script setup>
import { onMounted, ref } from 'vue'
import { getMessages, markAllMessagesRead, markMessageRead } from '../../api'

const rows = ref([])
const loading = ref(false)
const error = ref('')
const unreadOnly = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await getMessages({ readStatus: unreadOnly.value ? false : '', page: 1, size: 50 })
    rows.value = result.items || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function read(row) {
  if (row.read) return
  try {
    await markMessageRead(row.id)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function readAll() {
  try {
    await markAllMessagesRead()
    await load()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>

<template>
  <div class="message-center">
    <div class="toolbar">
      <div><h2>消息中心</h2><p>业务提交、退回、通过、发放和协议待签消息统一在这里查看。</p></div>
      <div class="actions">
        <label><input v-model="unreadOnly" type="checkbox" @change="load" /> 仅未读</label>
        <button class="secondary" @click="readAll">全部已读</button>
        <button class="secondary" @click="load">{{ loading ? '刷新中…' : '刷新' }}</button>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="list">
      <article v-for="row in rows" :key="row.id" :class="{ unread: !row.read }" @click="read(row)">
        <div><strong>{{ row.title }}</strong><span>{{ row.messageType }}</span></div>
        <p>{{ row.content }}</p>
        <small>{{ row.createdTime }} · {{ row.read ? '已读' : '点击标记已读' }}</small>
      </article>
      <p v-if="!loading && !rows.length">暂无消息</p>
    </div>
  </div>
</template>

<style scoped>
.message-center,.list{display:grid;gap:14px}.toolbar,.actions,.list article>div{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}h2{margin:0}.toolbar p,.list p,small{color:#64748b}.list article{padding:16px;border:1px solid #e2e8f0;border-radius:12px;cursor:pointer}.list article.unread{border-left:4px solid #0f766e;background:#f0fdfa}.list span{font-size:12px;padding:4px 8px;background:#eef2ff;border-radius:999px}.secondary{border:0;border-radius:8px;padding:9px 13px;background:#eef2ff;cursor:pointer}.error{color:#b91c1c}
</style>
