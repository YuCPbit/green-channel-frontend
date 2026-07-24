import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentBatch } from '@/api/workstudy/batch'

export const useWorkStudyStore = defineStore('workstudy', () => {
    const currentBatch = ref(null)
    const loading = ref(false)

    async function fetchCurrentBatch() {
        loading.value = true
        try {
            currentBatch.value = await getCurrentBatch()
        } catch (error) {
            console.error('获取当前批次失败:', error)
        } finally {
            loading.value = false
        }
    }

    return {
        currentBatch,
        loading,
        fetchCurrentBatch
    }
})