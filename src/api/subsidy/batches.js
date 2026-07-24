import { apiRequest } from '../request'

/**
 * 分页查询批次列表
 */
export async function getBatches(params = {}) {
    const queryParams = {
        page: params.page || 0,
        size: params.size || 10,
        ...(params.batchName && { batchName: params.batchName }),
        ...(params.status != null && { status: params.status })
    }
    return apiRequest.get('/subsidy/batches', queryParams)
}

/**
 * 创建补助批次
 */
export async function createBatch(data) {
    return apiRequest.post('/subsidy/batches', data)
}

/**
 * 更新补助批次
 */
export async function updateBatch(id, data) {
    return apiRequest.put(`/subsidy/batches/${id}`, data)
}

/**
 * 启动批次
 */
export async function startBatch(id) {
    return apiRequest.post(`/subsidy/batches/${id}/start`)
}

/**
 * 结束批次
 */
export async function endBatch(id) {
    return apiRequest.post(`/subsidy/batches/${id}/end`)
}

/**
 * 获取可申请的活跃批次
 */
export async function getAvailableBatches() {
    return apiRequest.get('/subsidy/batches/available')
}