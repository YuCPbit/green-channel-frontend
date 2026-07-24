<template>
    <div class="quota-management">
        <div class="header">
            <h3>名额分配管理</h3>
            <el-button type="primary" @click="openAddDialog">新增分配</el-button>
        </div>

        <el-table :data="tableData" border>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="大礼包批次" width="180">
                <template #default="{ row }">
                    {{ getPackBatchName(row.packBatchId) }}
                </template>
            </el-table-column>
            <el-table-column label="学院" width="180">
                <template #default="{ row }">
                    {{ getCollegeName(row.collegeId) }}
                </template>
            </el-table-column>
            <el-table-column label="年级" width="100">
                <template #default="{ row }">
                    {{ row.grade ? row.grade + '级' : '学院总名额' }}
                </template>
            </el-table-column>
            <el-table-column prop="allocatedQuota" label="分配名额" width="120" />
            <el-table-column prop="usedQuota" label="已使用" width="120" />
            <el-table-column label="剩余" width="120">
                <template #default="{ row }">
                    <el-tag :type="(row.allocatedQuota - row.usedQuota) > 0 ? 'success' : 'danger'">
                        {{ row.allocatedQuota - row.usedQuota }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑弹窗 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="form" label-width="120px">
                <el-form-item label="大礼包批次">
                    <el-select v-model="form.packBatchId" placeholder="请选择大礼包批次" style="width:100%">
                        <el-option v-for="batch in packBatchList"
                                   :key="batch.id"
                                   :label="batch.batchName"
                                   :value="batch.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="学院">
                    <el-select v-model="form.collegeId" placeholder="请选择学院" style="width:100%">
                        <el-option v-for="college in collegeList"
                                   :key="college.id"
                                   :label="college.collegeName"
                                   :value="college.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="年级（选填）">
                    <el-input-number v-model="form.grade" :min="2000" :max="2030" placeholder="不填表示学院总名额" style="width:100%" />
                    <div style="font-size:12px;color:#999;margin-top:4px;">不填表示学院总名额，填具体年级表示该年级名额</div>
                </el-form-item>
                <el-form-item label="分配名额数">
                    <el-input-number v-model="form.allocatedQuota" :min="0" style="width:100%" />
                </el-form-item>
                <el-form-item v-if="isEdit" label="已使用名额">
                    <span>{{ form.usedQuota }}（由申请审核自动累计，不可手工修改）</span>
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    getQuotaList,
    addQuota,
    updateQuota,
    deleteQuota,
    getGiftPackBatchList,
    getColleges
} from '../../api'

const tableData = ref([])
const packBatchList = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const isEdit = ref(false)

const collegeList = ref([])

const form = ref({
    id: null,
    packBatchId: null,
    collegeId: null,
    grade: null,
    allocatedQuota: 0,
    usedQuota: 0
})

const resetForm = () => {
    form.value = {
        id: null,
        packBatchId: null,
        collegeId: null,
        grade: null,
        allocatedQuota: 0,
        usedQuota: 0
    }
}

const getPackBatchName = (id) => {
    const found = packBatchList.value.find(b => b.id === id)
    return found ? found.batchName : '未知批次'
}

const getCollegeName = (id) => {
    const found = collegeList.value.find(c => c.id === id)
    return found ? found.collegeName : '未知学院'
}

const loadPackBatches = async () => {
    try {
        const res = await getGiftPackBatchList()
        packBatchList.value = Array.isArray(res) ? res : res?.records || res?.data || []
    } catch (error) {
        console.error('加载大礼包批次失败', error)
    }
}

const loadColleges = async () => {
    try {
        collegeList.value = await getColleges()
    } catch (error) {
        ElMessage.error(error.message || '加载学院列表失败')
    }
}

const loadData = async () => {
    try {
        const res = await getQuotaList()
        tableData.value = Array.isArray(res) ? res : res?.records || res?.data || []
    } catch (error) {
        ElMessage.error('加载数据失败')
    }
}

const openAddDialog = () => {
    resetForm()
    isEdit.value = false
    dialogTitle.value = '新增名额分配'
    if (packBatchList.value.length > 0) {
        form.value.packBatchId = packBatchList.value[0].id
    }
    dialogVisible.value = true
}

const openEditDialog = (row) => {
    isEdit.value = true
    dialogTitle.value = '编辑名额分配'
    form.value = { ...row }
    dialogVisible.value = true
}

const handleSubmit = async () => {
    if (!form.value.packBatchId) {
        ElMessage.warning('请选择大礼包批次')
        return
    }
    if (!form.value.collegeId) {
        ElMessage.warning('请选择学院')
        return
    }
    if (form.value.allocatedQuota <= 0) {
        ElMessage.warning('分配名额必须大于0')
        return
    }
    submitting.value = true
    try {
        if (isEdit.value) {
            await updateQuota(form.value)
            ElMessage.success('修改成功')
        } else {
            await addQuota(form.value)
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
    ElMessageBox.confirm(`确定要删除该名额分配吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            await deleteQuota(row.id)
            ElMessage.success('删除成功')
            loadData()
        } catch (error) {
            ElMessage.error(error.message || '删除失败')
        }
    }).catch(() => {})
}

onMounted(() => {
    loadPackBatches()
    loadColleges()
    loadData()
})
</script>

<style scoped>
    .quota-management {
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
