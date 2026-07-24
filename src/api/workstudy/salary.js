import { apiRequest } from '../request'

/**
 * 核算指定年月的薪酬
 */
export async function calculateSalary(year, month) {
    const params = new URLSearchParams({ year, month })
    return apiRequest.post(`/workstudy/salary/calculate?${params}`)
}

/**
 * 部门确认薪酬
 */
export async function confirmSalaryByDepartment(salaryId, confirmedAmount) {
    const params = new URLSearchParams({
        confirmedAmount
    })
    return apiRequest.post(`/workstudy/salary/${salaryId}/dept-confirm?${params}`)
}

/**
 * 资助中心审批薪酬
 */
export async function approveSalaryBySchool(salaryId, finalAmount) {
    const params = new URLSearchParams({
        finalAmount
    })
    return apiRequest.post(`/workstudy/salary/${salaryId}/school-approve?${params}`)
}

/**
 * 标记薪酬已发放
 */
export async function markSalaryAsPaid(salaryId) {
    return apiRequest.post(`/workstudy/salary/${salaryId}/mark-paid`)
}

/**
 * 查询薪酬明细
 */
export async function getSalaryDetail(salaryId) {
    return apiRequest.get(`/workstudy/salary/${salaryId}`)
}

/**
 * 查询学生薪酬列表
 */
export async function getStudentSalaries() {
    return apiRequest.get('/workstudy/salary/student')
}