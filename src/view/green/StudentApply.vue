<template>
    <div class="green-apply">
        <h3>爱心大礼包申请</h3>

        <!-- 提交表单 -->
        <el-card style="margin-bottom: 20px">
            <el-form :model="form" label-width="100px">
                <el-form-item label="申请批次">
                    <el-select v-model="form.packBatchId" placeholder="请选择批次" style="width:100%">
                        <el-option v-for="batch in batchList"
                                   :key="batch.id"
                                   :label="batch.batchName"
                                   :value="batch.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="学生ID">
                    <el-input v-model="form.studentId" disabled />
                </el-form-item>
                <el-form-item label="申请理由">
                    <el-input v-model="form.applyReason" type="textarea" :rows="4" placeholder="请描述申请理由" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSubmit" :loading="submitting">提交申请</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 申请列表 -->
        <el-card>
            <h4>我的申请</h4>
            <el-table :data="applyList" border>
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="applyNo" label="申请编号" width="160" />
                <el-table-column prop="applyReason" label="申请理由" />
                <el-table-column label="状态" width="140">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <!-- 新增领取码列 -->
                <el-table-column label="领取码" width="180">
                    <template #default="{ row }">
                        <el-tag v-if="row.pickupCode" type="success">{{ row.pickupCode }}</el-tag>
                        <span v-else style="color:#999">未生成</span>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="提交时间" width="180" />
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue'
    import { ElMessage } from 'element-plus'
    import { addApply, getApplyList, getBatchList } from '../../api'

    // 获取当前登录用户
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const form = ref({
        packBatchId: '',
        studentId: user.id || '',
        applyReason: ''
    })

    const applyList = ref([])
    const batchList = ref([])
    const submitting = ref(false)

    const getStatusText = (status) => {
        const map = { 1: '未通过', 2: '待辅导员审核', 3: '待学院审核', 4: '待学校审核', 5: '已通过' }
        return map[status] || '未知'
    }

    const getStatusType = (status) => {
        const map = { 1: 'info', 2: 'warning', 3: 'warning', 4: 'warning', 5: 'success' }
        return map[status] || 'info'
    }

    // 加载批次列表
    const loadBatches = async () => {
        try {
            const res = await getBatchList()
            batchList.value = Array.isArray(res) ? res : res?.records || res?.data || []
            if (batchList.value.length > 0) {
                form.value.packBatchId = batchList.value[0].id
            }
        } catch (error) {
            console.error('加载批次列表失败', error)
        }
    }

    const handleSubmit = async () => {
        if (!form.value.packBatchId) {
            ElMessage.warning('请选择批次')
            return
        }
        if (!form.value.applyReason) {
            ElMessage.warning('请填写申请理由')
            return
        }
        submitting.value = true
        try {
            // 生成申请编号
            const now = new Date()
            const dateStr = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0')
            const applyNo = 'GIFT' + dateStr + String(Date.now()).slice(-4)

            const submitData = {
                packBatchId: form.value.packBatchId,
                studentId: form.value.studentId,
                applyNo: applyNo,  // ← 添加这一行
                applyReason: form.value.applyReason,
                status: 2
            }
            await addApply(submitData)
            ElMessage.success('提交成功')
            form.value.applyReason = ''
            loadApplyList()
        } catch (error) {
            ElMessage.error(error.message || '提交失败')
        } finally {
            submitting.value = false
        }
    }

    const loadApplyList = async () => {
        try {
            const res = await getApplyList({
                pageNum: 1,
                pageSize: 999,
                studentId: user.id
            })
            applyList.value = Array.isArray(res) ? res : res?.records || res?.data || []
        } catch (error) {
            console.error('加载申请列表失败', error)
        }
    }

    onMounted(() => {
        loadBatches()
        loadApplyList()
    })
</script>

<style scoped>
    .green-apply {
        max-width: 900px;
        padding: 20px;
    }
</style>