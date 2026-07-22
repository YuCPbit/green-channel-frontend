<template>
    <div class="batch-management">
        <div class="header">
            <h3>绿色通道批次管理</h3>
            <el-button type="primary" @click="openAddDialog">新增批次</el-button>
        </div>

        <el-table :data="tableData" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="batchName" label="批次名称" width="180" />
            <el-table-column prop="academicYear" label="学年" width="120" />
            <el-table-column label="学期" width="100">
                <template #default="{ row }">
                    {{ row.semester === 1 ? '第一学期' : '第二学期' }}
                </template>
            </el-table-column>
            <el-table-column prop="applyStartTime" label="申请开始时间" width="180" />
            <el-table-column prop="applyEndTime" label="申请结束时间" width="180" />
            <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑弹窗 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
            <el-form :model="form" label-width="120px">
                <el-form-item label="批次名称">
                    <el-input v-model="form.batchName" placeholder="请输入批次名称" />
                </el-form-item>
                <el-form-item label="学年">
                    <el-input v-model="form.academicYear" placeholder="如：2026-2027" />
                </el-form-item>
                <el-form-item label="学期">
                    <el-select v-model="form.semester" placeholder="请选择学期" style="width:100%">
                        <el-option label="第一学期" :value="1" />
                        <el-option label="第二学期" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="申请开始时间">
                    <el-date-picker v-model="form.applyStartTime"
                                    type="datetime"
                                    placeholder="选择日期时间"
                                    value-format="YYYY-MM-DDTHH:mm:ss"
                                    style="width:100%" />
                </el-form-item>
                <el-form-item label="申请结束时间">
                    <el-date-picker v-model="form.applyEndTime"
                                    type="datetime"
                                    placeholder="选择日期时间"
                                    value-format="YYYY-MM-DDTHH:mm:ss"
                                    style="width:100%" />
                </el-form-item>
                <el-form-item label="学院提交截止时间">
                    <el-date-picker v-model="form.collegeSubmitEndTime"
                                    type="datetime"
                                    placeholder="选择日期时间"
                                    value-format="YYYY-MM-DDTHH:mm:ss"
                                    style="width:100%" />
                </el-form-item>
                <el-form-item label="资金来源">
                    <el-input v-model="form.fundSource" placeholder="如：学校事业经费" />
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="form.remark" placeholder="备注信息" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitting">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue'
    import { ElMessage, ElMessageBox } from 'element-plus'
    import { getBatchList, addBatch, updateBatch, deleteBatch } from '../../api'

    const tableData = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const submitting = ref(false)
    const isEdit = ref(false)

    const form = ref({
        id: null,
        batchName: '',
        academicYear: '',
        semester: 1,
        applyStartTime: '',
        applyEndTime: '',
        collegeSubmitEndTime: '',
        fundSource: '',
        status: 1,
        remark: ''
    })

    const resetForm = () => {
        form.value = {
            id: null,
            batchName: '',
            academicYear: '',
            semester: 1,
            applyStartTime: '',
            applyEndTime: '',
            collegeSubmitEndTime: '',
            fundSource: '',
            status: 1,
            remark: ''
        }
    }

    const loadData = async () => {
        try {
            const res = await getBatchList()
            tableData.value = Array.isArray(res) ? res : res?.records || res?.data || []
        } catch (error) {
            ElMessage.error('加载数据失败')
        }
    }

    const openAddDialog = () => {
        resetForm()
        isEdit.value = false
        dialogTitle.value = '新增批次'
        dialogVisible.value = true
    }

    const openEditDialog = (row) => {
        isEdit.value = true
        dialogTitle.value = '编辑批次'
        form.value = { ...row }
        dialogVisible.value = true
    }

    const handleSubmit = async () => {
        if (!form.value.batchName) {
            ElMessage.warning('请填写批次名称')
            return
        }
        submitting.value = true
        try {
            if (isEdit.value) {
                await updateBatch(form.value)
                ElMessage.success('修改成功')
            } else {
                await addBatch(form.value)
                ElMessage.success('新增成功')
            }
            dialogVisible.value = false
            loadData()
        } catch (error) {
            ElMessage.error(error.message || '操作失败')
        } finally {
            submitting.value = false
        }
    }

    const handleDelete = (row) => {
        ElMessageBox.confirm(`确定要删除批次 "${row.batchName}" 吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(async () => {
            try {
                await deleteBatch(row.id)
                ElMessage.success('删除成功')
                loadData()
            } catch (error) {
                ElMessage.error(error.message || '删除失败')
            }
        }).catch(() => { })
    }

    onMounted(() => {
        loadData()
    })
</script>

<style scoped>
    .batch-management {
        padding: 20px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

        .header h3 {
            margin: 0;
        }
</style>