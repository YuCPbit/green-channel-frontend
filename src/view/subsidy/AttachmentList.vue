<script setup>
import { ref, watch } from 'vue'
import { downloadAttachmentContent, getSubsidyApplyAttachments } from '../../api'

const props = defineProps({
  applyId: { type: Number, required: true }
})

const items = ref([])
const loading = ref(false)
const error = ref('')

watch(() => props.applyId, load, { immediate: true })

async function load() {
  if (!props.applyId) return
  loading.value = true
  error.value = ''
  try {
    items.value = await getSubsidyApplyAttachments(props.applyId)
  } catch (e) {
    error.value = e.message
    items.value = []
  } finally {
    loading.value = false
  }
}

async function download(item) {
  try {
    await downloadAttachmentContent(item.id, item.originalName || item.original_name)
  } catch (e) {
    error.value = e.message
  }
}

function fileSize(item) {
  const size = Number(item.size || item.fileSize || item.file_size || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <section class="attachments">
    <h4>证明材料</h4>
    <p v-if="loading">正在加载材料…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!items.length">未上传材料</p>
    <button
      v-for="item in items"
      v-else
      :key="item.id"
      type="button"
      @click="download(item)"
    >
      {{ item.originalName || item.original_name }}（{{ fileSize(item) }}）
    </button>
  </section>
</template>

<style scoped>
.attachments { display: grid; gap: 8px; margin: 16px 0; padding: 12px; border: 1px solid #dcebe0; border-radius: 12px; background: #f8fbf9; }
.attachments h4, .attachments p { margin: 0; }
.attachments p { color: #71867e; font-size: 13px; }
.attachments .error { color: #b53f3f; }
.attachments button { width: fit-content; padding: 0; border: 0; background: transparent; color: #217a58; cursor: pointer; text-align: left; }
.attachments button:hover { text-decoration: underline; }
</style>
