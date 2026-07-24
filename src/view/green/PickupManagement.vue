<template>
    <div class="pickup-management">
        <h3>礼包领取与核销</h3>

        <!-- 领取码输入 -->
        <el-card style="margin-bottom:20px">
            <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
                <el-input v-model="pickupCode"
                          placeholder="请输入领取码"
                          style="width:300px;"
                          @keyup.enter="searchByPickupCode" />
                <el-button type="primary" @click="searchByPickupCode">查询</el-button>
                <el-button @click="resetSearch">重置</el-button>
                <el-tag v-if="applyInfo" type="success" size="large">
                    找到申请：{{ applyInfo.applyNo }}
                </el-tag>
                <el-tag v-if="searchError" type="danger" size="large">
                    {{ searchError }}
                </el-tag>
            </div>
        </el-card>

        <!-- 申请信息 -->
        <el-card v-if="applyInfo" style="margin-bottom:20px">
            <el-descriptions :column="4" border>
                <el-descriptions-item label="申请ID">{{ applyInfo.id }}</el-descriptions-item>
                <el-descriptions-item label="申请编号">{{ applyInfo.applyNo }}</el-descriptions-item>
                <el-descriptions-item label="学生ID">{{ applyInfo.studentId }}</el-descriptions-item>
                <el-descriptions-item label="申请状态">
                    <el-tag :type="getStatusType(applyInfo.status)">{{ getStatusText(applyInfo.status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="领取状态" :span="2">
                    <el-tag :type="getPickupStatusType(applyInfo.pickupStatus)">
                        {{ getPickupStatusText(applyInfo.pickupStatus) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="申请理由">{{ applyInfo.applyReason }}</el-descriptions-item>
            </el-descriptions>

            <!-- 操作按钮 -->
            <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
                <el-button type="success"
                           size="large"
                           :disabled="applyInfo.pickupStatus !== 0 || applyInfo.status !== 5"
                           @click="handlePickup">
                    正常领取
                </el-button>
                <el-button type="warning"
                           size="large"
                           :disabled="applyInfo.pickupStatus !== 0 || applyInfo.status !== 5"
                           @click="openExceptionDialog">
                    异常登记
                </el-button>
                <el-button type="primary"
                           size="large"
                           :disabled="applyInfo.pickupStatus !== 2"
                           @click="handleReissue">
                    异常补发
                </el-button>
            </div>
            <div style="margin-top:8px; font-size:12px; color:#999;">
                提示：只有终审通过(status=5)且待领取(pickupStatus=0)才能领取或登记异常；
                只有异常状态(pickupStatus=2)才能补发。
            </div>
        </el-card>

        <!-- 领取记录列表 -->
        <el-card>
            <h4>领取记录</h4>
            <el-table v-loading="recordsLoading" :data="pickupRecords" border>
                <el-table-column prop="id" label="申请ID" width="80" />
                <el-table-column prop="applyNo" label="申请编号" width="160" />
                <el-table-column prop="pickupCode" label="领取码" width="180" />
                <el-table-column label="领取状态" width="140">
                    <template #default="{ row }">
                        <el-tag :type="getPickupStatusType(row.pickupStatus)">
                            {{ getPickupStatusText(row.pickupStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="pickupTime" label="领取时间" width="180" />
                <el-table-column prop="pickupRemark" label="备注" />
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" @click="viewDetail(row)">详情</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination
                v-model:current-page="recordsPage"
                :page-size="recordsPageSize"
                :total="recordsTotal"
                layout="total, prev, pager, next"
                style="margin-top: 16px; justify-content: flex-end;"
                @current-change="loadPickupRecords"
            />
        </el-card>

        <!-- 异常登记弹窗 -->
        <el-dialog v-model="exceptionDialogVisible" title="异常登记" width="500px">
            <el-form :model="exceptionForm">
                <el-form-item label="异常说明">
                    <el-input v-model="exceptionForm.remark"
                              type="textarea"
                              :rows="4"
                              placeholder="请描述异常原因，如：尺码偏大需更换、缺货待补发等" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="exceptionDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmException" :loading="exceptionSubmitting">确认</el-button>
            </template>
        </el-dialog>

        <!-- 查看详情弹窗 -->
        <el-dialog v-model="detailVisible" title="申请详情" width="600px">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="申请ID">{{ detailData.id }}</el-descriptions-item>
                <el-descriptions-item label="申请编号">{{ detailData.applyNo }}</el-descriptions-item>
                <el-descriptions-item label="学生ID">{{ detailData.studentId }}</el-descriptions-item>
                <el-descriptions-item label="领取码">{{ detailData.pickupCode || '未生成' }}</el-descriptions-item>
                <el-descriptions-item label="申请状态">
                    <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="领取状态">
                    <el-tag :type="getPickupStatusType(detailData.pickupStatus)">
                        {{ getPickupStatusText(detailData.pickupStatus) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="领取时间">{{ detailData.pickupTime || '未领取' }}</el-descriptions-item>
                <el-descriptions-item label="操作人ID">{{ detailData.pickupOperatorId || '-' }}</el-descriptions-item>
                <el-descriptions-item label="申请理由" :span="2">{{ detailData.applyReason }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ detailData.pickupRemark || '无' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <el-button @click="detailVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    getApplyByPickupCode,
    getPickupRecords,
    pickup,
    pickupException,
    pickupReissue
} from '../../api'

// 查询相关
const pickupCode = ref('')
const applyInfo = ref(null)
const searchError = ref('')

// 领取记录
const pickupRecords = ref([])
const recordsLoading = ref(false)
const recordsPage = ref(1)
const recordsPageSize = 10
const recordsTotal = ref(0)

// 异常弹窗
const exceptionDialogVisible = ref(false)
const exceptionForm = ref({ remark: '' })
const exceptionSubmitting = ref(false)

// 详情弹窗
const detailVisible = ref(false)
const detailData = ref({})

// 状态映射
const getStatusText = (status) => {
    const map = { 1: '草稿', 2: '待辅导员审核', 3: '待学院审核', 4: '待学校审核', 5: '已通过' }
    return map[status] || '未知'
}

const getStatusType = (status) => {
    const map = { 1: 'info', 2: 'warning', 3: 'warning', 4: 'warning', 5: 'success' }
    return map[status] || 'info'
}

const getPickupStatusText = (status) => {
    const map = { 0: '待领取', 1: '已领取', 2: '异常待处理', 3: '已补发' }
    return map[status] || '未知'
}

const getPickupStatusType = (status) => {
    const map = { 0: 'info', 1: 'success', 2: 'danger', 3: 'primary' }
    return map[status] || 'info'
}

// 根据领取码查询
const searchByPickupCode = async () => {
    if (!pickupCode.value.trim()) {
        ElMessage.warning('请输入领取码')
        return
    }
    searchError.value = ''
    try {
        applyInfo.value = await getApplyByPickupCode(pickupCode.value.trim())
        searchError.value = ''
    } catch (error) {
        applyInfo.value = null
        searchError.value = error.message || '查询失败'
    }
}

const resetSearch = () => {
    pickupCode.value = ''
    applyInfo.value = null
    searchError.value = ''
}

// 加载领取记录（已领取、异常、已补发的）
const loadPickupRecords = async () => {
    recordsLoading.value = true
    try {
        const res = await getPickupRecords({
            pageNum: recordsPage.value,
            pageSize: recordsPageSize
        })
        pickupRecords.value = res?.records || []
        recordsTotal.value = Number(res?.total || 0)
    } catch (error) {
        pickupRecords.value = []
        recordsTotal.value = 0
        console.error('加载领取记录失败', error)
    } finally {
        recordsLoading.value = false
    }
}

// 正常领取
const handlePickup = async () => {
    if (!applyInfo.value) return
    try {
        await ElMessageBox.confirm(
            `确认学生 "${applyInfo.value.applyNo}" 已领取礼包吗？`,
            '确认领取',
            { confirmButtonText: '确认领取', cancelButtonText: '取消', type: 'success' }
        )
        await pickup({
            pickupCode: applyInfo.value.pickupCode
        })
        ElMessage.success('领取成功！')
        resetSearch()
        recordsPage.value = 1
        loadPickupRecords()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '领取失败')
        }
    }
}

// 打开异常登记弹窗
const openExceptionDialog = () => {
    exceptionForm.value = { remark: '' }
    exceptionDialogVisible.value = true
}

// 确认异常登记
const confirmException = async () => {
    if (!exceptionForm.value.remark.trim()) {
        ElMessage.warning('请填写异常说明')
        return
    }
    exceptionSubmitting.value = true
    try {
        await pickupException({
            pickupCode: applyInfo.value.pickupCode,
            remark: exceptionForm.value.remark
        })
        ElMessage.success('异常登记成功')
        exceptionDialogVisible.value = false
        resetSearch()
        recordsPage.value = 1
        loadPickupRecords()
    } catch (error) {
        ElMessage.error(error.message || '异常登记失败')
    } finally {
        exceptionSubmitting.value = false
    }
}

// 异常补发
const handleReissue = async () => {
    if (!applyInfo.value) return
    try {
        await ElMessageBox.confirm(
            `确认对申请 "${applyInfo.value.applyNo}" 进行补发吗？`,
            '确认补发',
            { confirmButtonText: '确认补发', cancelButtonText: '取消', type: 'warning' }
        )
        await pickupReissue({
            pickupCode: applyInfo.value.pickupCode,
            remark: '补发'
        })
        ElMessage.success('补发成功！')
        resetSearch()
        recordsPage.value = 1
        loadPickupRecords()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(error.message || '补发失败')
        }
    }
}

// 查看详情
const viewDetail = (row) => {
    detailData.value = row
    detailVisible.value = true
}

onMounted(() => {
    loadPickupRecords()
})
</script>

<style scoped>
    .pickup-management {
        padding: 20px;
    }

        .pickup-management h3 {
            margin-bottom: 20px;
        }
</style>
