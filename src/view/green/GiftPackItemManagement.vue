<template>
    <div class="item-management">
        <div class="header">
            <h3>大礼包物品管理</h3>
            <el-button type="primary" @click="openAddDialog">新增物品</el-button>
        </div>

        <el-table :data="tableData" border>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="giftName" label="物品名称" width="150" />
            <el-table-column prop="itemType" label="类型" width="120" />
            <el-table-column prop="price" label="单价" width="100">
                <template #default="{ row }">
                    ¥{{ row.price }}
                </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80" />
            <el-table-column prop="genderLimit" label="适用性别" width="100">
                <template #default="{ row }">
                    {{ row.genderLimit === 0 ? '通用' : row.genderLimit === 1 ? '男' : '女' }}
                </template>
            </el-table-column>
            <el-table-column label="必选" width="80">
                <template #default="{ row }">
                    <el-tag :type="row.isRequired === 1 ? 'success' : 'info'">
                        {{ row.isRequired === 1 ? '是' : '否' }}
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
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
            <el-form :model="form" label-width="120px">
                <!-- 新增：选择所属大礼包批次 -->
                <el-form-item label="所属礼包批次">
                    <el-select v-model="form.packBatchId" placeholder="请选择大礼包批次" style="width:100%">
                        <el-option v-for="batch in packBatchList"
                                   :key="batch.id"
                                   :label="batch.batchName"
                                   :value="batch.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="物品名称">
                    <el-input v-model="form.giftName" placeholder="请输入物品名称" />
                </el-form-item>
                <el-form-item label="类型">
                    <el-input v-model="form.itemType" placeholder="如：生活用品、服装" />
                </el-form-item>
                <el-form-item label="单价">
                    <el-input-number v-model="form.price" :min="0" :step="0.5" style="width:100%" />
                </el-form-item>
                <el-form-item label="库存">
                    <el-input-number v-model="form.stock" :min="0" style="width:100%" />
                </el-form-item>
                <el-form-item label="适用性别">
                    <el-select v-model="form.genderLimit" placeholder="请选择" style="width:100%">
                        <el-option label="通用" :value="0" />
                        <el-option label="男" :value="1" />
                        <el-option label="女" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="是否必选">
                    <el-select v-model="form.isRequired" placeholder="请选择" style="width:100%">
                        <el-option label="否" :value="0" />
                        <el-option label="是" :value="1" />
                    </el-select>
                </el-form-item>
                <el-form-item label="图片URL">
                    <el-input v-model="form.imageUrl" placeholder="请输入图片URL（可选）" />
                </el-form-item>
                <el-form-item label="简介">
                    <el-input v-model="form.description" type="textarea" :rows="2" placeholder="物品简介" />
                </el-form-item>
                <el-form-item label="尺寸选项">
                    <el-input v-model="form.sizeOptions" placeholder='如：["S","M","L","XL"]' />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="form.sort" :min="0" style="width:100%" />
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
    import { getItemList, addItem, updateItem, deleteItem, getGiftPackBatchList } from '../../api'

    const tableData = ref([])
    const packBatchList = ref([])
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const submitting = ref(false)
    const isEdit = ref(false)

    const form = ref({
        id: null,
        packBatchId: null,
        giftName: '',
        itemType: '',
        price: 0,
        stock: 0,
        genderLimit: 0,
        isRequired: 0,
        imageUrl: '',
        description: '',
        sizeOptions: '',
        sort: 0
    })

    const resetForm = () => {
        form.value = {
            id: null,
            packBatchId: null,
            giftName: '',
            itemType: '',
            price: 0,
            stock: 0,
            genderLimit: 0,
            isRequired: 0,
            imageUrl: '',
            description: '',
            sizeOptions: '',
            sort: 0
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

    const loadData = async () => {
        try {
            const res = await getItemList()
            tableData.value = Array.isArray(res) ? res : res?.records || res?.data || []
        } catch (error) {
            ElMessage.error('加载数据失败')
        }
    }

    const openAddDialog = () => {
        resetForm()
        isEdit.value = false
        dialogTitle.value = '新增物品'
        if (packBatchList.value.length > 0) {
            form.value.packBatchId = packBatchList.value[0].id
        }
        dialogVisible.value = true
    }

    const openEditDialog = (row) => {
        isEdit.value = true
        dialogTitle.value = '编辑物品'
        form.value = { ...row }
        dialogVisible.value = true
    }

    const handleSubmit = async () => {
        if (!form.value.packBatchId) {
            ElMessage.warning('请选择所属礼包批次')
            return
        }
        if (!form.value.giftName) {
            ElMessage.warning('请填写物品名称')
            return
        }
        submitting.value = true
        try {
            if (isEdit.value) {
                await updateItem(form.value)
                ElMessage.success('修改成功')
            } else {
                await addItem(form.value)
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
        ElMessageBox.confirm(`确定要删除物品 "${row.giftName}" 吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(async () => {
            try {
                await deleteItem(row.id)
                ElMessage.success('删除成功')
                loadData()
            } catch (error) {
                ElMessage.error(error.message || '删除失败')
            }
        }).catch(() => { })
    }

    onMounted(() => {
        loadPackBatches()
        loadData()
    })
</script>

<style scoped>
    .item-management {
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