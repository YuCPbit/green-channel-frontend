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