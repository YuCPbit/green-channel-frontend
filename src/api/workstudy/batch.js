import { apiRequest } from '../request'

/**
 * 创建批次
 */
export async function createBatch(data) {
    return apiRequest.post('/workstudy/batch', data)
}

/**
 * 获取批次列表
 */
export async function getBatchList() {
    return apiRequest.get('/workstudy/batch/list')
}

/**
 * 获取当前有效批次
 */
export async function getCurrentBatch() {
    return apiRequest.get('/workstudy/batch/current')
}

/**
 * 更新批次状态
 */
export async function updateBatchStatus(batchId, status) {
    return apiRequest.put(`/workstudy/batch/${batchId}/status?status=${status}`)
}

/**
 * 删除批次
 */
export async function deleteBatch(batchId) {
    return apiRequest.delete(`/workstudy/batch/${batchId}`)
}