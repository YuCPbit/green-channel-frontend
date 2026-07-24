<template>
    <div class="gift-review">
        <h3>{{ isReadOnly ? '绿色通道审批记录' : '待审批列表' }}</h3>
        <el-alert
            v-if="isReadOnly"
            title="系统管理员仅可查看待审批记录，不能代替业务审核人员操作。"
            type="info"
            :closable="false"
            show-icon
            class="audit-tip"
        />

        <el-card>
            <el-table :data="reviewList" border>
                <el-table-column prop="studentApply.id" label="申请ID" width="80" />
                <el-table-column prop="studentApply.applyNo" label="申请编号" width="160" />
                <el-table-column label="状态" width="140">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.studentApply?.status)">
                            {{ getStatusText(row.studentApply?.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="studentApply.applyReason" label="申请理由" />
                <el-table-column v-if="!isReadOnly" label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="success" @click="handleApprove(row)">通过</el-button>
                        <el-button size="small" type="warning" @click="handleReject(row)">驳回</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 审批弹窗 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="dialogForm">
                <el-form-item label="审核意见">
                    <el-input v-model="dialogForm.comment" type="textarea" :rows="4" placeholder="请输入审核意见" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmOperate">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
    import { computed, ref, onMounted } from 'vue'
    import { ElMessage } from 'element-plus'
    import { getReviewList, reviewOperate } from '../../api'

    const props = defineProps({ userType: Number })
    const isReadOnly = computed(() => props.userType === 5)
    const reviewList = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const dialogForm = ref({ applyId: null, comment: '' })
    const currentAction = ref(1)

    const getStatusText = (status) => {
        const map = { 1: '未通过', 2: '待辅导员审核', 3: '待学院审核', 4: '待学校审核', 5: '已通过' }
        return map[status] || '未知'
    }

    const getStatusType = (status) => {
        const map = { 1: 'info', 2: 'warning', 3: 'warning', 4: 'warning', 5: 'success' }
        return map[status] || 'info'
    }

    const loadReviewList = async () => {
        try {
            const res = await getReviewList({ pageNum: 1, pageSize: 999 })
            if (Array.isArray(res)) {
                reviewList.value = res
            } else if (res?.records) {
                reviewList.value = res.records
            } else if (res?.data) {
                reviewList.value = res.data
            } else {
                reviewList.value = []
            }
        } catch (error) {
            ElMessage.error('加载待审批列表失败')
            console.error(error)
        }
    }

    const handleApprove = (row) => {
        currentAction.value = 1
        dialogTitle.value = `通过申请 #${row.studentApply?.id}`
        dialogForm.value = { applyId: row.studentApply?.id, comment: '同意通过' }
        dialogVisible.value = true
    }

    const handleReject = (row) => {
        currentAction.value = 2
        dialogTitle.value = `驳回申请 #${row.studentApply?.id}`
        dialogForm.value = { applyId: row.studentApply?.id, comment: '请补充材料' }
        dialogVisible.value = true
    }

    const confirmOperate = async () => {
        try {
            await reviewOperate({
                applyId: dialogForm.value.applyId,
                action: currentAction.value,
                comment: dialogForm.value.comment
            })
            ElMessage.success('操作成功')
            dialogVisible.value = false
            loadReviewList()
        } catch (error) {
            ElMessage.error(error.message || '操作失败')
        }
    }

    onMounted(() => {
        loadReviewList()
    })
</script>

<style scoped>
    .gift-review {
        max-width: 1200px;
        padding: 20px;
    }

    .audit-tip {
        margin-bottom: 16px;
    }
</style>
