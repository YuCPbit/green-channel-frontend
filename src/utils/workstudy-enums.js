// 岗位状态
export const POSITION_STATUS = {
    0: { label: '草稿', color: '#6c757d' },
    1: { label: '待审核', color: '#ffc107' },
    2: { label: '已发布', color: '#28a745' },
    3: { label: '已下架', color: '#dc3545' },
    4: { label: '已驳回', color: '#dc3545' }
}

// 申请状态
export const APPLY_STATUS = {
    0: { label: '已提交', color: '#17a2b8' },
    1: { label: '面试通过', color: '#28a745' },
    2: { label: '面试未通过', color: '#dc3545' },
    3: { label: '已录用', color: '#007bff' },
    4: { label: '已驳回', color: '#dc3545' }
}

// 协议状态
export const AGREEMENT_STATUS = {
    0: { label: '未签署', color: '#6c757d' },
    1: { label: '已签署', color: '#28a745' },
    2: { label: '已续签', color: '#17a2b8' },
    3: { label: '已终止', color: '#dc3545' }
}

// 考勤类型
export const ATTENDANCE_TYPE = {
    1: { label: '签到', color: '#28a745' },
    2: { label: '签退', color: '#dc3545' }
}

// 薪酬状态
export const SALARY_STATUS = {
    0: { label: '待核算', color: '#6c757d' },
    1: { label: '部门已确认', color: '#17a2b8' },
    2: { label: '学校已审批', color: '#007bff' },
    3: { label: '已发放', color: '#28a745' }
}