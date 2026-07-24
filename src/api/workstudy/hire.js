import { apiRequest } from '../request'

/**
 * 审批录用
 */
export async function approveHire(applyId) {
    return apiRequest.post(`/workstudy/hire/approve?applyId=${applyId}`)
}

/**
 * 学生离岗/教师解聘
 */
export async function leavePosition(hireId, leaveType, reason) {
    const params = new URLSearchParams({
        leaveType,
        reason
    })
    return apiRequest.post(`/workstudy/hire/${hireId}/leave?${params}`)
}