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
                <el-form-item label="申请理由">
                    <el-input v-model="form.applyReason" type="textarea" :rows="4" placeholder="请描述申请理由" />
                </el-form-item>
                <el-form-item label="礼包物品">
                    <div v-if="itemList.length" class="item-list">
                        <div v-for="item in itemList" :key="item.id" class="item-row">
                            <el-checkbox
                                v-model="selections[item.id].selected"
                                :disabled="item.isRequired === 1"
                            >
                                {{ item.giftName }}
                                <el-tag v-if="item.isRequired === 1" size="small">必选</el-tag>
                                <span class="stock">库存 {{ item.stock }}</span>
                            </el-checkbox>
                            <el-input-number
                                v-if="selections[item.id].selected"
                                v-model="selections[item.id].quantity"
                                :min="1"
                                :max="Math.max(item.stock || 0, 1)"
                                size="small"
                            />
                            <el-select
                                v-if="selections[item.id].selected && parseSizes(item.sizeOptions).length"
                                v-model="selections[item.id].selectedSize"
                                placeholder="请选择尺码"
                                size="small"
                            >
                                <el-option
                                    v-for="size in parseSizes(item.sizeOptions)"
                                    :key="size"
                                    :label="size"
                                    :value="size"
                                />
                            </el-select>
                        </div>
                        <p class="selection-tip">
                            已选 {{ selectedQuantity }} 件
                            <template v-if="currentBatch?.maxItems"> / 最多 {{ currentBatch.maxItems }} 件</template>
                        </p>
                    </div>
                    <el-empty v-else description="该批次尚未配置可申请物品" :image-size="72" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSubmit" :loading="submitting" :disabled="!itemList.length">提交申请</el-button>
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
                <el-table-column label="所选物品" min-width="180">
                    <template #default="{ row }">
                        {{ formatItems(row.items) }}
                    </template>
                </el-table-column>
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
                <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                        <el-button
                            v-if="row.status === 6"
                            size="small"
                            type="primary"
                            @click="handleResubmit(row)"
                        >
                            修改并重新提交
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
    import { computed, ref, onMounted, watch } from 'vue'
    import { ElMessage } from 'element-plus'
    import { addApply, getApplyList, getGiftPackBatchList, getItemList, resubmitGiftApply } from '../../api'

    const form = ref({
        packBatchId: '',
        applyReason: ''
    })

    const applyList = ref([])
    const batchList = ref([])
    const itemList = ref([])
    const itemCatalog = ref({})
    const selections = ref({})
    const submitting = ref(false)
    const currentBatch = computed(() =>
        batchList.value.find(batch => batch.id === form.value.packBatchId))
    const selectedQuantity = computed(() =>
        itemList.value.reduce((sum, item) => {
            const selection = selections.value[item.id]
            return sum + (selection?.selected ? Number(selection.quantity || 0) : 0)
        }, 0))

    const getStatusText = (status) => {
        const map = {
            1: '历史驳回',
            2: '待辅导员审核',
            3: '待学院审核',
            4: '待学校审核',
            5: '已通过',
            6: '退回修改',
            7: '不通过',
            8: '已取消'
        }
        return map[status] || '未知'
    }

    const getStatusType = (status) => {
        const map = {
            1: 'info',
            2: 'warning',
            3: 'warning',
            4: 'warning',
            5: 'success',
            6: 'warning',
            7: 'danger',
            8: 'info'
        }
        return map[status] || 'info'
    }

    // 加载批次列表
    const loadBatches = async () => {
        try {
            const res = await getGiftPackBatchList()
            const allBatches = Array.isArray(res) ? res : res?.records || res?.data || []
            batchList.value = allBatches.filter(batch => batch.status === 1)
            if (batchList.value.length > 0) {
                form.value.packBatchId = batchList.value[0].id
            }
        } catch (error) {
            console.error('加载批次列表失败', error)
        }
    }

    const parseSizes = (value) => {
        if (!value) return []
        if (Array.isArray(value)) return value.map(String)
        try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) return parsed.map(String)
        } catch {
            return String(value).split(/[,，]/).map(item => item.trim()).filter(Boolean)
        }
        return []
    }

    const loadItems = async () => {
        if (!form.value.packBatchId) {
            itemList.value = []
            selections.value = {}
            return
        }
        try {
            const res = await getItemList(form.value.packBatchId)
            itemList.value = Array.isArray(res) ? res : res?.records || res?.data || []
            selections.value = Object.fromEntries(itemList.value.map(item => {
                const sizes = parseSizes(item.sizeOptions)
                return [item.id, {
                    selected: item.isRequired === 1,
                    quantity: 1,
                    selectedSize: sizes[0] || ''
                }]
            }))
        } catch (error) {
            itemList.value = []
            selections.value = {}
            ElMessage.error(error.message || '加载礼包物品失败')
        }
    }

    const loadItemCatalog = async () => {
        try {
            const res = await getItemList()
            const items = Array.isArray(res) ? res : res?.records || res?.data || []
            itemCatalog.value = Object.fromEntries(items.map(item => [item.id, item]))
        } catch {
            itemCatalog.value = {}
        }
    }

    const selectedItems = () => itemList.value
        .filter(item => selections.value[item.id]?.selected)
        .map(item => ({
            itemId: item.id,
            selectedSize: selections.value[item.id].selectedSize || null,
            quantity: Number(selections.value[item.id].quantity || 1)
        }))

    const validateSelection = () => {
        const items = selectedItems()
        if (!items.length) {
            ElMessage.warning('请至少选择一件礼包物品')
            return false
        }
        const missingSize = itemList.value.some(item => {
            const selection = selections.value[item.id]
            return selection?.selected
                && parseSizes(item.sizeOptions).length
                && !selection.selectedSize
        })
        if (missingSize) {
            ElMessage.warning('请选择物品尺码')
            return false
        }
        if (currentBatch.value?.maxItems && selectedQuantity.value > currentBatch.value.maxItems) {
            ElMessage.warning(`本批次最多选择 ${currentBatch.value.maxItems} 件物品`)
            return false
        }
        return true
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
        if (!validateSelection()) return
        submitting.value = true
        try {
            const submitData = {
                packBatchId: form.value.packBatchId,
                applyReason: form.value.applyReason,
                items: selectedItems()
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

    const handleResubmit = async (row) => {
        if (form.value.packBatchId !== row.packBatchId) {
            form.value.packBatchId = row.packBatchId
            await loadItems()
        }
        form.value.applyReason = row.applyReason || ''
        if (Array.isArray(row.items)) {
            row.items.forEach(item => {
                const selection = selections.value[item.itemId]
                if (selection) {
                    selection.selected = true
                    selection.quantity = item.quantity || 1
                    selection.selectedSize = item.selectedSize || selection.selectedSize
                }
            })
        }
        if (!validateSelection()) return
        try {
            await resubmitGiftApply({
                id: row.id,
                applyReason: form.value.applyReason,
                items: selectedItems()
            })
            ElMessage.success('已重新提交至辅导员审核')
            await loadApplyList()
        } catch (error) {
            ElMessage.error(error.message || '重新提交失败')
        }
    }

    const formatItems = (items) => {
        if (!Array.isArray(items) || items.length === 0) return '-'
        return items.map(item => {
            const suffix = item.selectedSize ? `/${item.selectedSize}` : ''
            const name = item.itemName || item.giftName
                || itemCatalog.value[item.itemId]?.giftName
                || `物品 #${item.itemId}`
            return `${name}${suffix} × ${item.quantity || 1}`
        }).join('；')
    }

    const loadApplyList = async () => {
        try {
            const res = await getApplyList()
            applyList.value = Array.isArray(res) ? res : res?.records || res?.data || []
        } catch (error) {
            console.error('加载申请列表失败', error)
        }
    }

    onMounted(() => {
        loadBatches()
        loadItemCatalog()
        loadApplyList()
    })

    watch(() => form.value.packBatchId, loadItems)
</script>

<style scoped>
    .green-apply {
        max-width: 900px;
        padding: 20px;
    }
    .item-list {
        display: grid;
        gap: 10px;
        width: 100%;
    }
    .item-row {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) 120px 140px;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid #e2ece7;
        border-radius: 10px;
    }
    .stock {
        margin-left: 8px;
        color: #789087;
    }
    .selection-tip {
        margin: 0;
        color: #557066;
    }
</style>
