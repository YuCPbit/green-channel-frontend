import { apiRequest } from '../request'

/**
 * 发布岗位
 */
export async function publishPosition(data) {
    return apiRequest.post('/workstudy/position', data)
}

/**
 * 提交审核
 */
export async function submitPositionForApproval(positionId) {
    return apiRequest.put(`/workstudy/position/${positionId}/submit`)
}

/**
 * 审核岗位
 */
export async function approvePosition(positionId, approved, rejectReason = '') {
    const params = new URLSearchParams({
        approved: approved.toString(),
        ...(rejectReason && { rejectReason })
    })
    return apiRequest.put(`/workstudy/position/${positionId}/approve?${params}`)
}

/**
 * 获取岗位列表
 */
export async function getPositionList(batchId, status) {
    const params = {}
    if (batchId) params.batchId = batchId
    if (status !== undefined && status !== null) params.status = status
    return apiRequest.get('/workstudy/position/list', params)
}

/**
 * 下架岗位
 */
export async function offlinePosition(positionId) {
    return apiRequest.put(`/workstudy/position/${positionId}/offline`)
}

/**
 * 更新岗位信息
 */
export async function updatePosition(positionId, data) {
    return apiRequest.put(`/workstudy/position/${positionId}`, data)
}

/**
 * 获取岗位详情
 */
export async function getPositionDetail(positionId) {
    return apiRequest.get(`/workstudy/position/${positionId}`)
}