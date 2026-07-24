import { apiRequest } from '../request'

/**
 * 学生提交申请
 */
export async function submitApplication(data) {
    return apiRequest.post('/subsidy/applies', data)
}

/**
 * 辅导员代申请
 */
export async function submitTutorApplication(data) {
    return apiRequest.post('/subsidy/applies/tutor', data)
}

/**
 * 重新提交申请
 */
export async function resubmitApplication(id, data) {
    return apiRequest.put(`/subsidy/applies/${id}`, data)
}

/**
 * 查询申请列表
 */
export async function getApplications(params = {}) {
    const queryParams = {
        page: params.page || 1,
        size: params.size || 20,
        ...(params.batchId && { batchId: params.batchId }),
        ...(params.status != null && { status: params.status }),
        ...(params.studentName && { studentName: params.studentName })
    }
    return apiRequest.get('/subsidy/applies', queryParams)
}

/**
 * 获取申请详情
 */
export async function getApplicationDetail(id) {
    return apiRequest.get(`/subsidy/applies/${id}`)
}

/**
 * 搜索学生
 */
export async function searchStudents(keyword) {
    return apiRequest.get('/subsidy/students/search', { keyword })
}