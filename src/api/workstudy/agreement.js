import { apiRequest } from '../request'

/**
 * 学生签署协议
 */
export async function signAgreement(agreementId) {
    return apiRequest.post(`/workstudy/agreement/sign?agreementId=${agreementId}`)
}

/**
 * 协议续签
 */
export async function renewAgreement(agreementId) {
    return apiRequest.post(`/workstudy/agreement/${agreementId}/renew`)
}

/**
 * 查询协议详情
 */
export async function getAgreementDetail(agreementId) {
    return apiRequest.get(`/workstudy/agreement/${agreementId}`)
}

/**
 * 查询学生的协议列表
 */
export async function getStudentAgreements() {
    return apiRequest.get('/workstudy/agreement/student')
}