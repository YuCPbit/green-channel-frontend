import { apiRequest } from '../request'

/**
 * 学生签到
 */
export async function checkIn(hireId, checkType, location) {
    const params = new URLSearchParams({
        hireId,
        checkType,
        location
    })
    return apiRequest.post(`/workstudy/attendance/check-in?${params}`)
}

/**
 * 学生签退
 */
export async function checkOut(attendanceId) {
    return apiRequest.post(`/workstudy/attendance/check-out?attendanceId=${attendanceId}`)
}

/**
 * 补打卡申请
 */
export async function applyRepair(hireId, attendanceDate, checkInTime, checkOutTime, reason) {
    const params = new URLSearchParams({
        hireId,
        attendanceDate,
        checkInTime,
        checkOutTime,
        reason
    })
    return apiRequest.post(`/workstudy/attendance/repair?${params}`)
}

/**
 * 用工部门确认考勤
 */
export async function confirmAttendance(attendanceId) {
    return apiRequest.post(`/workstudy/attendance/${attendanceId}/confirm`)
}