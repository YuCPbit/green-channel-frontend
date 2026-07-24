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


// 认证 API

export async function login(username, password) {
    const result = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    localStorage.setItem(TOKEN_KEY, result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
    return result.user
}

export async function logout() {
    try {
        await request('/api/auth/logout', { method: 'POST' })
    } finally {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('user')
    }
}

export async function currentUser() {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    try {
        return JSON.parse(userStr)
    } catch {
        return null
    }
}


// 补助批次 API


 //分页查询批次列表
 
export async function getSubsidyBatches(params = {}) {
    const query = new URLSearchParams()
    if (params.batchName) query.set('batchName', params.batchName)
    if (params.status !== undefined && params.status !== null && params.status !== '') query.set('status', params.status)
    query.set('page', params.page || 0)
    query.set('size', params.size || 10)
    return request(`/api/subsidy/batches?${query.toString()}`)
}


 // 创建补助批次
 
export async function createSubsidyBatch(data) {
    return request('/api/subsidy/batches', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}


 //更新补助批次
 
export async function updateSubsidyBatch(id, data) {
    return request(`/api/subsidy/batches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}


  //开始批次（DRAFT → ACTIVE）
 
export async function startSubsidyBatch(id) {
    return request(`/api/subsidy/batches/${id}/start`, { method: 'POST' })
}


 //提前结束批次
 
export async function endSubsidyBatch(id) {
    return request(`/api/subsidy/batches/${id}/end`, { method: 'POST' })
}


// 额度分配 API


  //将 user_type 映射为分配接口需要的角色值
 
function mapUserTypeToAllocatorRole(userType) {
    if (userType === 4) return 1
    if (userType === 3) return 2
    return userType
}


 // 下发额度

export async function allocateQuota(data, user = {}) {
    const allocatorRole = mapUserTypeToAllocatorRole(user.userType || 4)
    return request('/api/subsidy/allocations', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'X-User-Role': String(allocatorRole),
            'X-College-Id': String(user.collegeId ?? '')
        }
    })
}


 // 获取额度看板汇总
 
export async function getAllocationSummary(batchId, user = {}) {
    const allocatorRole = mapUserTypeToAllocatorRole(user.userType || 4)
    return request(`/api/subsidy/allocations/summary?batchId=${batchId}`, {
        headers: {
            'X-User-Role': String(allocatorRole),
            'X-College-Id': String(user.collegeId ?? '')
        }
    })
}

 //查询分配明细列表
export async function getAllocationList(batchId, targetType) {
    let url = `/api/subsidy/allocations?batchId=${batchId}`
    if (targetType != null) url += `&targetType=${targetType}`
    return request(url)
}


 // 获取学院列表
 
export async function getColleges() {
    return request('/api/subsidy/allocations/colleges')
}


 //取年级列表
 
export async function getGrades() {
    return request('/api/subsidy/allocations/grades')
}


// 补助申请与审核 API

 //获取当前可申请的活跃批次列表
 
export async function getAvailableBatches() {
    return request('/api/subsidy/batches/available')
}


 //学生提交困难补助申请
 
export async function submitSubsidyApply(data) {
    return request('/api/subsidy/applies', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}


 //辅导员代学生发起补助申请
 
export async function submitTutorSubsidyApply(data) {
    return request('/api/subsidy/applies/tutor', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}


 // 重新提交被退回的申请
  
export async function resubmitSubsidyApply(id, data) {
    return request(`/api/subsidy/applies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}


 //查询补助申请列表
 
export async function getSubsidyApplies(params = {}) {
    const query = new URLSearchParams()
    if (params.batchId) query.set('batchId', params.batchId)
    if (params.status !== undefined && params.status !== null && params.status !== '') query.set('status', params.status)
    if (params.studentName) query.set('studentName', params.studentName)
    query.set('page', params.page || 1)
    query.set('size', params.size || 20)
    return request(`/api/subsidy/applies?${query.toString()}`)
}


 // 获取申请详情
 
export async function getSubsidyApplyDetail(id) {
    return request(`/api/subsidy/applies/${id}`)
}


 // 提交审核

export async function submitSubsidyReview(data) {
    return request('/api/subsidy/reviews', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}


 // 搜索学生

export async function searchStudents(keyword) {
    return request(`/api/subsidy/students/search?keyword=${encodeURIComponent(keyword)}`)
}

// 提交绿色通道申请
export async function addApply(data) {
    return request('/api/gift/apply/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 获取所有批次列表
export async function getBatchList() {
    return request('/api/gift/batch/list')
}


 //获取开放中的批次
 
export async function getActiveBatches() {
    const all = await request('/api/gift/batch/list')
    return all.filter(b => b.status === 1)
}


 //获取申请列表
 
export async function getApplyList(params = {}) {
    const query = new URLSearchParams()
    if (params.pageNum) query.set('pageNum', params.pageNum)
    if (params.pageSize) query.set('pageSize', params.pageSize)
    if (params.studentId) query.set('studentId', params.studentId)
    if (params.packBatchId) query.set('packBatchId', params.packBatchId)
    return request(`/api/gift/apply/list?${query.toString()}`)
}


 //获取待审批列表
 
export async function getReviewList(params = {}) {
    const query = new URLSearchParams()
    if (params.batchId) query.set('batchId', params.batchId)
    if (params.pageNum) query.set('pageNum', params.pageNum)
    if (params.pageSize) query.set('pageSize', params.pageSize)
    return request(`/api/gift/review/list?${query.toString()}`)
}


  //审批操作
 
export async function reviewOperate(data) {
    return request('/api/gift/review/operate', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}


//获取审批时间线
 
export async function getReviewRecord(applyId) {
    return request(`/api/gift/review/record/${applyId}`)
}



// 新增批次
export async function addBatch(data) {
    return request('/api/gift/batch/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 修改批次
export async function updateBatch(data) {
    return request('/api/gift/batch/edit', {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

// 删除批次
export async function deleteBatch(id) {
    return request(`/api/gift/batch/${id}`, {
        method: 'DELETE'
    })
}


// 礼包批次 API

// 获取礼包批次列表
export async function getGiftPackBatchList() {
    return request('/api/gift/pack-batch/list')
}

// 获取绿色通道批次列表
export async function getGreenBatchList() {
    return request('/api/gift/batch/list')
}


// 新增礼包批次
export async function addGiftPackBatch(data) {
    return request('/api/gift/pack-batch/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 修改礼包批次
export async function updateGiftPackBatch(data) {
    return request('/api/gift/pack-batch/edit', {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

// 删除礼包批次
export async function deleteGiftPackBatch(id) {
    return request(`/api/gift/pack-batch/${id}`, {
        method: 'DELETE'
    })
}


// 大礼包物品 API


// 获取物品列表
export async function getItemList() {
    return request('/api/gift/item/list')
}

// 新增物品
export async function addItem(data) {
    return request('/api/gift/item/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 修改物品
export async function updateItem(data) {
    return request('/api/gift/item/edit', {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

// 删除物品
export async function deleteItem(id) {
    return request(`/api/gift/item/${id}`, {
        method: 'DELETE'
    })
}


// 名额分配 API

// 获取名额列表
export async function getQuotaList() {
    return request('/api/gift/quota/list')
}

// 新增名额
export async function addQuota(data) {
    return request('/api/gift/quota/add', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 修改名额
export async function updateQuota(data) {
    return request('/api/gift/quota/edit', {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

// 删除名额
export async function deleteQuota(id) {
    return request(`/api/gift/quota/${id}`, {
        method: 'DELETE'
    })
}


// 礼包核销 API

// 正常领取
export async function pickup(data) {
    return request('/api/gift/review/pickup', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 异常登记
export async function pickupException(data) {
    return request('/api/gift/review/pickup/exception', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 异常补发
export async function pickupReissue(data) {
    return request('/api/gift/review/pickup/reissue', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

// 根据领取码查询申请信息
export async function getApplyByPickupCode(pickupCode) {
    return request(`/api/gift/apply/list?pickupCode=${pickupCode}`)
}



// 补录申请
export async function supplement(data) {
    return request('/api/gift/review/supplement', {
        method: 'POST',
        body: JSON.stringify(data)
    })
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
 * 导出台账 Excel，通过请求头传递令牌，避免敏感信息进入 URL。
 */
export async function downloadLedgerExcel(params = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const qs = new URLSearchParams()
  if (params.batchId) qs.set('batchId', params.batchId)
  if (params.disburseStatus !== undefined && params.disburseStatus !== '') qs.set('disburseStatus', params.disburseStatus)
  if (params.collegeId) qs.set('collegeId', params.collegeId)
  const response = await fetch(`/api/subsidy/ledger/export?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: '导出失败' }))
    throw new Error(payload.message || '导出失败')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '补助资金台账.xlsx'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
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

// ==================== A 接管：资助方案、申诉与满意度 ====================

export async function getAidPlans(status) {
  const query = status === undefined || status === '' ? '' : `?status=${status}`
  return request(`/api/subsidy/plans${query}`)
}

export async function createAidPlan(data) {
  return request('/api/subsidy/plans', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateAidPlan(id, data) {
  return request(`/api/subsidy/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function changeAidPlanStatus(id, action) {
  return request(`/api/subsidy/plans/${id}/${action}`, { method: 'POST' })
}

export async function estimateAidPlan(id) {
  return request(`/api/subsidy/plans/${id}/estimate`, { method: 'POST' })
}

export async function createAppeal(data) {
  return request('/api/subsidy/appeals', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function getMyAppeals() {
  return request('/api/subsidy/appeals/my')
}

export async function getPendingAppeals() {
  return request('/api/subsidy/appeals/pending')
}

export async function handleAppeal(id, data) {
  return request(`/api/subsidy/appeals/${id}/handle`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function createSatisfactionSurvey(data) {
  return request('/api/subsidy/surveys', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function publishSatisfactionSurvey(id) {
  return request(`/api/subsidy/surveys/${id}/publish`, { method: 'POST' })
}

export async function getSatisfactionSurveys() {
  return request('/api/subsidy/surveys')
}

export async function submitSatisfactionSurvey(id, data) {
  return request(`/api/subsidy/surveys/${id}/responses`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function getSatisfactionSurveySummary(id) {
  return request(`/api/subsidy/surveys/${id}/summary`)
}

// ==================== A 接管：勤工助学岗位变动 ====================

export async function getMovementPositions() {
  return request('/api/workstudy/movements/positions')
}

export async function createWorkstudyMovement(data) {
  return request('/api/workstudy/movements', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function getMyWorkstudyMovements() {
  return request('/api/workstudy/movements/my')
}

export async function getPendingWorkstudyMovements() {
  return request('/api/workstudy/movements/pending')
}

export async function reviewWorkstudyMovement(id, data) {
  return request(`/api/workstudy/movements/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
