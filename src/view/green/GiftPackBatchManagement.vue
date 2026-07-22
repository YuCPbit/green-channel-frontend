<template>
    <div class="pack-batch-management">
        <div class="header">
            <h3>大礼包批次管理</h3>
            <el-button type="primary" @click="openAddDialog">新增礼包批次</el-button>
        </div>

        <el-table :data="tableData" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="batchName" label="礼包批次名称" width="200" />
            <el-table-column label="关联绿色通道批次" width="200">
                <template #default="{ row }">
                    {{ getGreenBatchName(row.gcBatchId) }}
                </template>
            </el-table-column>
            <el-table-column prop="maxItems" label="可选物品上限" width="120" />
            <el-table-column label="状态" width="120">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'info'">
                        {{ row.status === 1 ? '启用' : '禁用' }}
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
            <el-form :model="form" label-width="140px">
                <el-form-item label="礼包批次名称">
                    <el-input v-model="form.batchName" placeholder="请输入礼包批次名称" />
                </el-form-item>
                <el-form-item label="关联绿色通道批次">
                    <el-select v-model="form.gcBatchId" placeholder="请选择绿色通道批次" style="width:100%">
                        <el-option v-for="batch in greenBatchList"
                                   :key="batch.id"
                                   :label="batch.batchName"
                                   :value="batch.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="可选物品上限">
                    <el-input-number v-model="form.maxItems" :min="1" :max="20" style="width:100%" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="form.status" placeholder="请选择状态" style="width:100%">
                        <el-option label="启用" :value="1" />
                        <el-option label="禁用" :value="0" />
                    </el-select>
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
import {
  getGiftPackBatchList,
  addGiftPackBatch,
  updateGiftPackBatch,
  deleteGiftPackBatch,
  getGreenBatchList
} from '../../api'

const tableData = ref([])
const greenBatchList = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const isEdit = ref(false)

const form = ref({
  id: null,
  batchName: '',
  gcBatchId: null,
  maxItems: 5,
  status: 1
})

const resetForm = () => {
  form.value = {
    id: null,
    batchName: '',
    gcBatchId: null,
    maxItems: 5,
    status: 1
  }
}

const getGreenBatchName = (id) => {
  const found = greenBatchList.value.find(b => b.id === id)
  return found ? found.batchName : '未关联'
}

const loadGreenBatches = async () => {
  try {
    const res = await getGreenBatchList()
    greenBatchList.value = Array.isArray(res) ? res : res?.records || res?.data || []
  } catch (error) {
    console.error('加载绿色通道批次失败', error)
  }
}

const loadData = async () => {
  try {
    const res = await getGiftPackBatchList()
    tableData.value = Array.isArray(res) ? res : res?.records || res?.data || []
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const openAddDialog = () => {
  resetForm()
  isEdit.value = false
  dialogTitle.value = '新增礼包批次'
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑礼包批次'
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.batchName) {
    ElMessage.warning('请填写礼包批次名称')
    return
  }
  if (!form.value.gcBatchId) {
    ElMessage.warning('请选择关联的绿色通道批次')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateGiftPackBatch(form.value)
      ElMessage.success('修改成功')
    } else {
      await addGiftPackBatch(form.value)
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
  ElMessageBox.confirm(`确定要删除礼包批次 "${row.batchName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteGiftPackBatch(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      ElMessage.error(error.message || '删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadGreenBatches()
  loadData()
})
</script>

<style scoped>
    .pack-batch-management {
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