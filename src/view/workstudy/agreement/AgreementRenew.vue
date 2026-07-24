<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renewAgreement } from '@/api/workstudy/agreement'

const route = useRoute()
const router = useRouter()

const renew = async () => {
  await renewAgreement(route.params.agreementId)
  alert('续签成功')
  router.back()
}
</script>

<template>
  <div class="page-shell">
    <h1>协议续签</h1>
    <p>协议ID：{{ route.params.agreementId }}</p>
    <button @click="renew">确认续签</button>
    <button
        v-permission="'workstudy:agreement:renew'"
        @click="renew"
    >
      续签协议
    </button>
  </div>
</template>