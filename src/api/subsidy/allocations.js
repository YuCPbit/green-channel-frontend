import { apiRequest } from '../request'

/**
 * 下发额度
 */
export async function allocateQuota(data) {
    return apiRequest.post('/subsidy/allocations', data)
}

/**
 * 获取额度看板汇总
 */
export async function getAllocationSummary(batchId) {
    return apiRequest.get('/subsidy/allocations/summary', { batchId })
}

/**
 * 查询分配明细
 */
export async function getAllocationList(batchId, targetType) {
    const params = { batchId }
    if (targetType != null) params.targetType = targetType
    return apiRequest.get('/subsidy/allocations', params)
}

/**
 * 获取学院列表
 */
export async function getColleges() {
    return apiRequest.get('/subsidy/allocations/colleges')
}

/**
 * 获取年级列表
 */
export async function getGrades() {
    return apiRequest.get('/subsidy/allocations/grades')
}