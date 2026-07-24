import { apiRequest } from '../request'

/**
 * 学生报名岗位
 */
export async function submitApply(data) {
    return apiRequest.post('/workstudy/apply', data)
}

/**
 * 获取我的申请列表
 */
export async function getMyApplications() {
    return apiRequest.get('/workstudy/apply/my')
}

/**
 * 获取岗位的申请列表
 */
export async function getPositionApplications(positionId) {
    return apiRequest.get(`/workstudy/apply/position/${positionId}`)
}

/**
 * 录入面试结果
 */
export async function recordInterviewResult(applyId, interviewStatus) {
    return apiRequest.put(`/workstudy/apply/${applyId}/interview?interviewStatus=${interviewStatus}`)
}

/**
 * 辅导员填写推荐意见
 */
export async function addTutorRecommendation(applyId, recommendation) {
    return apiRequest.put(`/workstudy/apply/${applyId}/tutor-recommend?recommendation=${encodeURIComponent(recommendation)}`)
}

/**
 * 获取申请详情
 */
export async function getApplyDetail(applyId) {
    return apiRequest.get(`/workstudy/apply/${applyId}`)
}