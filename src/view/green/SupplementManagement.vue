<template>
    <div class="supplement-management">
        <h3>绿色通道申请补录</h3>
        <el-card>
            <el-form :model="form" label-width="120px">
                <el-form-item label="学生ID">
                    <el-input-number v-model="form.studentId" :min="1" style="width:100%" placeholder="请输入学生ID" />
                </el-form-item>
                <el-form-item label="大礼包批次">
                    <el-select v-model="form.packBatchId" placeholder="请选择大礼包批次" style="width:100%">
                        <el-option v-for="batch in packBatchList"
                                   :key="batch.id"
                                   :label="batch.batchName"
                                   :value="batch.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="申请编号">
                    <el-input v-model="form.applyNo" placeholder="留空自动生成" />
                </el-form-item>
                <el-form-item label="申请理由">
                    <el-input v-model="form.applyReason" type="textarea" :rows="4" placeholder="请填写申请理由" />
                </el-form-item>
                <el-form-item label="领取码">
                    <el-input v-model="form.pickupCode" placeholder="留空自动生成" />
                </el-form-item>
                <el-form-item label="补录备注">
                    <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="补录原因说明" />
                </el-form-item>
                <el-form-item label="补录时间">
                    <el-date-picker v-model="form.applyTime"
                                    type="datetime"
                                    placeholder="留空则使用当前时间"
                                    value-format="YYYY-MM-DDTHH:mm:ss"
                                    style="width:100%" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSubmit" :loading="submitting">确认补录</el-button>
                    <el-button @click="resetForm">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { supplement, getGiftPackBatchList } from '../../api'

const packBatchList = ref([])
const submitting = ref(false)

const form = ref({
    studentId: null,
    packBatchId: null,
    applyNo: '',
    applyReason: '',
    pickupCode: '',
    remark: '',
    applyTime: ''
})

const resetForm = () => {
    form.value = {
        studentId: null,
        packBatchId: null,
        applyNo: '',
        applyReason: '',
        pickupCode: '',
        remark: '',
        applyTime: ''
    }
}

const loadPackBatches = async () => {
    try {
        const res = await getGiftPackBatchList()
        packBatchList.value = Array.isArray(res) ? res : res?.records || res?.data || []
        if (packBatchList.value.length > 0) {
            form.value.packBatchId = packBatchList.value[0].id
        }
    } catch (error) {
        console.error('加载大礼包批次失败', error)
    }
}

const handleSubmit = async () => {
    if (!form.value.studentId) {
        ElMessage.warning('请填写学生ID')
        return
    }
    if (!form.value.packBatchId) {
        ElMessage.warning('请选择大礼包批次')
        return
    }
    if (!form.value.applyReason) {
        ElMessage.warning('请填写申请理由')
        return
    }
    submitting.value = true
    try {
        await supplement(form.value)
        ElMessage.success('补录成功！申请已直接终审通过')
        resetForm()
    } catch (error) {
        ElMessage.error(error.message || '补录失败')
    } finally {
        submitting.value = false
    }
}

onMounted(() => {
    loadPackBatches()
})
</script>

<style scoped>
    .supplement-management {
        padding: 20px;
        max-width: 700px;
    }

        .supplement-management h3 {
            margin-bottom: 20px;
        }
</style>
