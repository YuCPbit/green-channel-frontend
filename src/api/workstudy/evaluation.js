import { apiRequest } from '../request'

/**
 * 提交评价
 */
export async function submitEvaluation(data) {
    return apiRequest.post('/workstudy/evaluation', data)
}

/**
 * 查询某学生某月评价
 */
export async function getEvaluation(studentId, year, month) {
    const params = new URLSearchParams({
        studentId,
        year,
        month
    })
    return apiRequest.get(`/workstudy/evaluation?${params}`)
}

/**
 * 查询学生历史评价
 */
export async function getEvaluationHistory(studentId) {
    return apiRequest.get(`/workstudy/evaluation/history/${studentId}`)
}