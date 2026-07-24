const TOKEN_KEY = 'green_channel_token'

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const payload = await response.json()
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
  return payload.data
}

export async function login(username, password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
  localStorage.setItem(TOKEN_KEY, result.token)
  return result.user
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' })
  } finally {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export async function currentUser() {
  if (!localStorage.getItem(TOKEN_KEY)) return null
  try {
    return await request('/api/auth/me')
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

// ==========================================
// 补助批次 API
// ==========================================

/**
 * 分页查询批次列表
 * @param {Object} params - { batchName, status, page, size }
 */
export async function getSubsidyBatches(params = {}) {
  const query = new URLSearchParams()
  if (params.batchName) query.set('batchName', params.batchName)
  if (params.status !== undefined && params.status !== null && params.status !== '') query.set('status', params.status)
  query.set('page', params.page || 0)
  query.set('size', params.size || 10)
  return request(`/api/subsidy/batches?${query.toString()}`)
}

/**
 * 创建补助批次
 * @param {Object} data - { batchName, academicYear, applyStartTime, applyEndTime, collegeSubmitEndTime }
 */
export async function createSubsidyBatch(data) {
  return request('/api/subsidy/batches', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 更新补助批次（含状态变更）
 * @param {number} id - 批次ID
 * @param {Object} data - 批次字段
 */
export async function updateSubsidyBatch(id, data) {
  return request(`/api/subsidy/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * 开始批次（DRAFT → ACTIVE）
 */
export async function startSubsidyBatch(id) {
  return request(`/api/subsidy/batches/${id}/start`, { method: 'POST' })
}

/**
 * 提前结束批次（ACTIVE → ENDED）
 */
export async function endSubsidyBatch(id) {
  return request(`/api/subsidy/batches/${id}/end`, { method: 'POST' })
}

// ==========================================
// 额度分配 API
// ==========================================

/**
 * 下发额度（学校→学院 或 学院→年级）
 * @param {Object} data - { batchId, targetType, targetId, amount }
 */
export async function allocateQuota(data) {
  return request('/api/subsidy/allocations', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 获取额度看板汇总
 * @param {number} batchId - 批次ID
 */
export async function getAllocationSummary(batchId) {
  return request(`/api/subsidy/allocations/summary?batchId=${batchId}`)
}

/**
 * 查询分配明细列表
 * @param {number} batchId - 批次ID
 * @param {number} targetType - 目标类型：1=学院 2=年级（可选）
 */
export async function getAllocationList(batchId, targetType) {
  let url = `/api/subsidy/allocations?batchId=${batchId}`
  if (targetType != null) url += `&targetType=${targetType}`
  return request(url)
}

/**
 * 获取学院列表
 */
export async function getColleges() {
  return request('/api/subsidy/allocations/colleges')
}

/**
 * 获取年级列表
 */
export async function getGrades() {
  return request('/api/subsidy/allocations/grades')
}

// ==========================================
// 补助申请与审核 API
// ==========================================

/**
 * 获取当前可申请的活跃批次列表
 */
export async function getAvailableBatches() {
  return request('/api/subsidy/batches/available')
}

/**
 * 学生提交困难补助申请
 * @param {Object} data - { batchId, applyAmount, applyReason }
 */
export async function submitSubsidyApply(data) {
  return request('/api/subsidy/applies', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 辅导员代学生发起补助申请
 * @param {Object} data - { batchId, studentId, applyAmount, applyReason }
 */
export async function submitTutorSubsidyApply(data) {
  return request('/api/subsidy/applies/tutor', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 重新提交被退回的申请
 * @param {number} id
 * @param {Object} data - { applyAmount, applyReason, batchId }
 */
export async function resubmitSubsidyApply(id, data) {
  return request(`/api/subsidy/applies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * 查询补助申请列表（角色过滤）
 * @param {Object} params - { batchId, status, studentName, page, size }
 */
export async function getSubsidyApplies(params = {}) {
  const query = new URLSearchParams()
  if (params.batchId) query.set('batchId', params.batchId)
  if (params.status !== undefined && params.status !== null && params.status !== '') query.set('status', params.status)
  if (params.studentName) query.set('studentName', params.studentName)
  query.set('page', params.page || 1)
  query.set('size', params.size || 20)
  return request(`/api/subsidy/applies?${query.toString()}`)
}

/**
 * 获取申请详情（含审核时间线）
 * @param {number} id
 */
export async function getSubsidyApplyDetail(id) {
  return request(`/api/subsidy/applies/${id}`)
}

/**
 * 提交审核
 * @param {Object} data - { applyId, action, comment, suggestAmount }
 */
export async function submitSubsidyReview(data) {
  return request('/api/subsidy/reviews', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 搜索学生（供辅导员代申请用）
 * @param {string} keyword - 学号或姓名
 */
export async function searchStudents(keyword) {
  return request(`/api/subsidy/students/search?keyword=${encodeURIComponent(keyword)}`)
}

// ==================== 台账 ====================

/**
 * 分页查询台账列表
 */
export async function getLedgerList(params = {}) {
  const qs = new URLSearchParams()
  if (params.batchId) qs.set('batchId', params.batchId)
  if (params.disburseStatus !== undefined && params.disburseStatus !== '') qs.set('disburseStatus', params.disburseStatus)
  if (params.studentName) qs.set('studentName', params.studentName)
  if (params.collegeId) qs.set('collegeId', params.collegeId)
  qs.set('page', params.page || 1)
  qs.set('size', params.size || 20)
  return request(`/api/subsidy/ledger?${qs.toString()}`)
}

/**
 * 台账汇总统计
 */
export async function getLedgerSummary(batchId) {
  const qs = batchId ? `?batchId=${batchId}` : ''
  return request(`/api/subsidy/ledger/summary${qs}`)
}

/**
 * 台账详情
 */
export async function getLedgerDetail(id) {
  return request(`/api/subsidy/ledger/${id}`)
}

/**
 * 单笔确认发放
 */
export async function confirmDisburse(id) {
  return request(`/api/subsidy/ledger/${id}/disburse`, {
    method: 'PUT'
  })
}

/**
 * 批量确认发放
 */
export async function batchConfirmDisburse(data) {
  return request('/api/subsidy/ledger/batch-disburse', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * 导出台账 Excel（fetch + Blob 下载，携带 Authorization header，避免 token 暴露在 URL 中）
 */
export async function downloadSubsidyLedgerExcel(params = {}) {
  const token = localStorage.getItem('green_channel_token')
  const qs = new URLSearchParams()
  if (params.batchId) qs.set('batchId', params.batchId)
  if (params.disburseStatus !== undefined && params.disburseStatus !== '') qs.set('disburseStatus', params.disburseStatus)
  if (params.collegeId) qs.set('collegeId', params.collegeId)
  const base = window.__API_BASE__ || ''
  const response = await fetch(`${base}/api/subsidy/ledger/export?${qs.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: '导出失败' }))
    throw new Error(err.message || '导出失败')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '补助发放台账.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 按申请ID查询发放状态（学生端查看）
 * @param {number} applyId
 */
export async function getLedgerByApplyId(applyId) {
  return request(`/api/subsidy/ledger/by-apply/${applyId}`)
}

// ==========================================
// 辅导员事务申请 API
// ==========================================

/**
 * 获取所有启用的申请类型
 */
export async function getTutorApplyTypes() {
  return request('/api/tutor/apply-types')
}

/**
 * 辅导员发起事务申请
 * @param {Object} data - { typeId, title, description, amount, urgency, studentIds, formData }
 */
export async function createTutorApplication(data) {
  return request('/api/tutor/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 辅导员更新申请（草稿/驳回后修改）
 * @param {number} id
 * @param {Object} data
 */
export async function updateTutorApplication(id, data) {
  return request(`/api/tutor/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * 辅导员提交草稿
 * @param {number} id
 */
export async function submitTutorDraft(id) {
  return request(`/api/tutor/applications/${id}/submit`, { method: 'POST' })
}

/**
 * 辅导员查看自己的申请列表
 * @param {Object} params - { status, typeId, page, size }
 */
export async function getMyTutorApplications(params = {}) {
  const query = new URLSearchParams()
  if (params.status !== undefined && params.status !== null && params.status !== '') query.set('status', params.status)
  if (params.typeId) query.set('typeId', params.typeId)
  query.set('page', params.page || 1)
  query.set('size', params.size || 20)
  return request(`/api/tutor/applications/my?${query.toString()}`)
}

/**
 * 管理员查看待审批列表
 * @param {Object} params - { status, typeId, urgency, page, size }
 */
export async function getTutorReviewList(params = {}) {
  const query = new URLSearchParams()
  if (params.status !== undefined && params.status !== null && params.status !== '') query.set('status', params.status)
  if (params.typeId) query.set('typeId', params.typeId)
  if (params.urgency !== undefined && params.urgency !== null && params.urgency !== '') query.set('urgency', params.urgency)
  query.set('page', params.page || 1)
  query.set('size', params.size || 20)
  return request(`/api/tutor/applications/review?${query.toString()}`)
}

/**
 * 获取申请详情（含审核记录和关联学生）
 * @param {number} id
 */
export async function getTutorApplicationDetail(id) {
  return request(`/api/tutor/applications/${id}`)
}

/**
 * 提交审核
 * @param {Object} data - { applicationId, action, comment }
 */
export async function submitTutorReview(data) {
  return request('/api/tutor/reviews', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 搜索所管学生（辅导员选择关联学生用）
 * @param {string} keyword - 学号或姓名
 */
export async function searchTutorStudents(keyword) {
  return request(`/api/tutor/students/search?keyword=${encodeURIComponent(keyword)}`)
}

/**
 * 获取辅导员事务申请统计
 */
export async function getTutorStatistics() {
  return request('/api/tutor/statistics')
}

/**
 * 单笔资金下发
 * @param {number} id - 申请ID
 */
export async function disburseTutorApplication(id) {
  return request(`/api/tutor/applications/${id}/disburse`, { method: 'POST' })
}

/**
 * 批量资金下发
 * @param {number[]} ids - 申请ID数组
 */
export async function batchDisburseTutorApplications(ids) {
  return request('/api/tutor/applications/batch-disburse', {
    method: 'POST',
    body: JSON.stringify({ ids })
  })
}

/**
 * 查询资金下发列表
 * @param {Object} params - { disburseStatus, typeId, page, size }
 */
export async function getTutorDisburseList(params = {}) {
  const query = new URLSearchParams()
  if (params.disburseStatus !== undefined && params.disburseStatus !== null && params.disburseStatus !== '') query.set('disburseStatus', params.disburseStatus)
  if (params.typeId) query.set('typeId', params.typeId)
  query.set('page', params.page || 1)
  query.set('size', params.size || 20)
  return request(`/api/tutor/disburse/list?${query.toString()}`)
}

/**
 * 资金下发汇总统计（总笔数、总金额）
 */
export async function getTutorDisburseSummary() {
  return request('/api/tutor/disburse/summary')
}

/**
 * 台账汇总（按学院+类型分组，支持时间段）
 * @param {Object} params - { startDate, endDate }
 */
export async function getTutorLedgerSummary(params = {}) {
  const query = new URLSearchParams()
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  return request(`/api/tutor/ledger/summary?${query.toString()}`)
}

/**
 * 台账明细（与汇总口径一致）
 * @param {Object} params - { collegeId, typeId, startDate, endDate, page, size }
 */
export async function getTutorLedgerDetail(params = {}) {
  const query = new URLSearchParams()
  if (params.collegeId) query.set('collegeId', params.collegeId)
  if (params.typeId) query.set('typeId', params.typeId)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  query.set('page', params.page || 1)
  query.set('size', params.size || 20)
  return request(`/api/tutor/ledger/detail?${query.toString()}`)
}

/**
 * 导出台账 Excel（fetch + Blob 下载，携带 Authorization header）
 * @param {Object} params - { collegeId, typeId, startDate, endDate }
 */
export async function downloadTutorLedgerExcel(params = {}) {
  const token = localStorage.getItem('green_channel_token')
  const qs = new URLSearchParams()
  if (params.collegeId) qs.set('collegeId', params.collegeId)
  if (params.typeId) qs.set('typeId', params.typeId)
  if (params.collegeIds && params.collegeIds.length) qs.set('collegeIds', params.collegeIds.join(','))
  if (params.typeIds && params.typeIds.length) qs.set('typeIds', params.typeIds.join(','))
  if (params.startDate) qs.set('startDate', params.startDate)
  if (params.endDate) qs.set('endDate', params.endDate)
  const base = window.__API_BASE__ || ''
  const response = await fetch(`${base}/api/tutor/ledger/export?${qs.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: '导出失败' }))
    throw new Error(err.message || '导出失败')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '辅导员事务台账.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ==========================================
// 勤工助学评价 API
// ==========================================

/**
 * 分页查询评价列表
 * @param {Object} params - { hireId, studentId, evalYear, evalMonth, page, size }
 */
export async function getEvaluationList(params = {}) {
  const query = new URLSearchParams()
  if (params.hireId) query.set('hireId', params.hireId)
  if (params.studentId) query.set('studentId', params.studentId)
  if (params.evalYear) query.set('evalYear', params.evalYear)
  if (params.evalMonth) query.set('evalMonth', params.evalMonth)
  query.set('page', params.page || 1)
  query.set('size', params.size || 20)
  return request(`/api/workstudy/evaluation/list?${query.toString()}`)
}

/**
 * 获取单条评价详情
 * @param {number} id
 */
export async function getEvaluationDetail(id) {
  return request(`/api/workstudy/evaluation/detail?id=${id}`)
}

/**
 * 提交评价
 * @param {Object} data - { hireId, studentId, evalYear, evalMonth, score, comment }
 */
export async function submitEvaluation(data) {
  return request('/api/workstudy/evaluation/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 更新评价
 * @param {Object} data - { id, score, comment }
 */
export async function updateEvaluation(data) {
  return request('/api/workstudy/evaluation/update', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 删除评价
 * @param {number} id
 */
export async function deleteEvaluation(id) {
  return request(`/api/workstudy/evaluation/delete?id=${id}`, {
    method: 'POST'
  })
}

/**
 * 学生查看本人评价
 * @param {Object} params - { studentId, evalYear, evalMonth, page, size }
 */
export async function getMyEvaluations(params = {}) {
  const query = new URLSearchParams()
  if (params.studentId) query.set('studentId', params.studentId)
  if (params.evalYear) query.set('evalYear', params.evalYear)
  if (params.evalMonth) query.set('evalMonth', params.evalMonth)
  query.set('page', params.page || 1)
  query.set('size', params.size || 20)
  return request(`/api/workstudy/evaluation/my?${query.toString()}`)
}

/**
 * 获取在岗录用列表（用于评价表单下拉选择）
 */
export async function getActiveHires() {
  return request('/api/workstudy/evaluation/hire/active')
}
