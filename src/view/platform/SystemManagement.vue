<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  createDictionaryItem,
  createTutorTypeConfig,
  createSystemRole,
  createSystemUser,
  deleteDictionaryItem,
  deleteTutorTypeConfig,
  getDictionaries,
  getIntegrationCalls,
  getOperationLogs,
  getRbacOverview,
  getSystemPermissions,
  getSystemRoles,
  getSystemConfigs,
  getSystemUsers,
  getTutorTypeConfigs,
  resetSystemUserPassword,
  updateDictionaryItem,
  updateSystemRole,
  updateSystemConfig,
  updateSystemUser,
  updateTutorTypeConfig
} from '../../api'

const props = defineProps({ menuName: String })
const rows = ref([])
const roles = ref([])
const permissions = ref([])
const overview = ref({})
const configs = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const keyword = ref('')
const editingId = ref(null)

const userForm = reactive({
  username: '', password: '', realName: '', phone: '', email: '',
  userType: 1, collegeId: null, status: 1, roleIds: []
})
const roleForm = reactive({
  roleName: '', roleCode: '', description: '', status: 1, sort: 0, permissionIds: []
})
const dictForm = reactive({
  dictTypeCode: '', dictTypeName: '', itemCode: '', itemName: '',
  itemValue: '', sort: 0, enabled: true, remark: ''
})
const tutorTypeForm = reactive({
  typeName: '', typeCode: '', description: '', needAmount: false,
  needStudent: true, approvalLevel: 2, formTemplate: [], sort: 0, enabled: true
})

const mode = computed(() => ({
  用户管理: 'users',
  角色权限: 'roles',
  字典参数: 'dictionary',
  接口监控: 'integration',
  操作日志: 'logs',
  事务类型配置: 'tutor-types'
}[props.menuName] || 'roles'))

async function load() {
  loading.value = true
  error.value = ''
  notice.value = ''
  try {
    if (mode.value === 'users') {
      const [result, roleRows] = await Promise.all([
        getSystemUsers({ keyword: keyword.value, page: 1, size: 50 }),
        getSystemRoles()
      ])
      rows.value = result.items || []
      roles.value = roleRows || []
    } else if (mode.value === 'roles') {
      const [roleRows, permissionRows, counts] = await Promise.all([
        getSystemRoles(), getSystemPermissions(), getRbacOverview()
      ])
      rows.value = roleRows || []
      roles.value = roleRows || []
      permissions.value = permissionRows || []
      overview.value = counts || {}
    } else if (mode.value === 'dictionary') {
      const [result, configRows] = await Promise.all([
        getDictionaries({ dictTypeCode: keyword.value, page: 1, size: 100 }),
        getSystemConfigs()
      ])
      rows.value = result.items || []
      configs.value = configRows || []
    } else if (mode.value === 'integration') {
      const result = await getIntegrationCalls({ clientId: keyword.value, page: 1, size: 100 })
      rows.value = result.items || []
    } else if (mode.value === 'logs') {
      const result = await getOperationLogs({ module: keyword.value, page: 1, size: 100 })
      rows.value = result.items || []
    } else {
      rows.value = await getTutorTypeConfigs()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function clearUser() {
  editingId.value = null
  Object.assign(userForm, {
    username: '', password: '', realName: '', phone: '', email: '',
    userType: 1, collegeId: null, status: 1, roleIds: []
  })
}

function editUser(row) {
  editingId.value = row.id
  Object.assign(userForm, {
    username: row.username, password: '', realName: row.realName,
    phone: row.phone || '', email: row.email || '', userType: row.userType,
    collegeId: row.collegeId, status: row.status, roleIds: [...(row.roleIds || [])]
  })
}

async function saveUser() {
  try {
    const payload = { ...userForm, roleIds: [...userForm.roleIds] }
    if (editingId.value) await updateSystemUser(editingId.value, payload)
    else await createSystemUser(payload)
    notice.value = editingId.value ? '用户已更新' : '用户已创建'
    clearUser()
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function resetPassword(row) {
  const password = prompt(`为 ${row.username} 设置新密码（至少 8 位）`)
  if (!password) return
  try {
    await resetSystemUserPassword(row.id, password)
    notice.value = '密码已重置，请通过安全渠道通知本人'
  } catch (e) {
    error.value = e.message
  }
}

function clearRole() {
  editingId.value = null
  Object.assign(roleForm, {
    roleName: '', roleCode: '', description: '', status: 1, sort: 0, permissionIds: []
  })
}

function editRole(row) {
  editingId.value = row.id
  Object.assign(roleForm, {
    roleName: row.roleName, roleCode: row.roleCode, description: row.description || '',
    status: row.status, sort: row.sort, permissionIds: [...(row.permissionIds || [])]
  })
}

async function saveRole() {
  try {
    const payload = { ...roleForm, permissionIds: [...roleForm.permissionIds] }
    if (editingId.value) await updateSystemRole(editingId.value, payload)
    else await createSystemRole(payload)
    notice.value = editingId.value ? '角色权限已更新' : '角色已创建'
    clearRole()
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function clearDictionary() {
  editingId.value = null
  Object.assign(dictForm, {
    dictTypeCode: '', dictTypeName: '', itemCode: '', itemName: '',
    itemValue: '', sort: 0, enabled: true, remark: ''
  })
}

function editDictionary(row) {
  editingId.value = row.id
  Object.assign(dictForm, row)
}

async function saveDictionary() {
  try {
    if (editingId.value) await updateDictionaryItem(editingId.value, dictForm)
    else await createDictionaryItem(dictForm)
    notice.value = editingId.value ? '字典项已更新' : '字典项已创建'
    clearDictionary()
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function removeDictionary(row) {
  if (!confirm(`确认删除字典项 ${row.itemName}？`)) return
  try {
    await deleteDictionaryItem(row.id)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function editConfig(row) {
  const value = prompt(`修改“${row.configName}”`, row.configValue)
  if (value === null) return
  try {
    await updateSystemConfig(row.id, value)
    notice.value = '系统参数已更新'
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function clearTutorType() {
  editingId.value = null
  Object.assign(tutorTypeForm, {
    typeName: '', typeCode: '', description: '', needAmount: false,
    needStudent: true, approvalLevel: 2, formTemplate: [], sort: 0, enabled: true
  })
}

function editTutorType(row) {
  editingId.value = row.id
  Object.assign(tutorTypeForm, {
    typeName: row.typeName, typeCode: row.typeCode, description: row.description || '',
    needAmount: row.needAmount, needStudent: row.needStudent, approvalLevel: row.approvalLevel,
    formTemplate: row.formTemplate || [], sort: row.sort, enabled: row.enabled
  })
}

async function saveTutorType() {
  try {
    if (editingId.value) await updateTutorTypeConfig(editingId.value, tutorTypeForm)
    else await createTutorTypeConfig(tutorTypeForm)
    notice.value = editingId.value ? '事务类型已更新' : '事务类型已创建'
    clearTutorType()
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function removeTutorType(row) {
  if (!confirm(`确认删除事务类型 ${row.typeName}？`)) return
  try {
    await deleteTutorTypeConfig(row.id)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function objectColumns() {
  return rows.value.length ? Object.keys(rows.value[0]).filter((key) => !['roleIds', 'permissionIds'].includes(key)).slice(0, 9) : []
}

watch(() => props.menuName, () => {
  editingId.value = null
  rows.value = []
  load()
})
onMounted(load)
</script>

<template>
  <div class="system-center">
    <div class="toolbar">
      <div><h2>{{ menuName }}</h2><p>配置变更由后端权限校验，并写入操作审计日志。</p></div>
      <div class="actions">
        <input v-if="mode !== 'roles'" v-model.trim="keyword" :placeholder="mode === 'users' ? '用户名或姓名' : '筛选关键词'" @keyup.enter="load" />
        <button class="secondary" @click="load">{{ loading ? '刷新中…' : '刷新' }}</button>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="notice" class="notice">{{ notice }}</p>

    <form v-if="mode === 'users'" class="form-grid" @submit.prevent="saveUser">
      <input v-model.trim="userForm.username" required placeholder="用户名" />
      <input v-model="userForm.password" :required="!editingId" type="password" placeholder="初始密码（至少8位）" />
      <input v-model.trim="userForm.realName" required placeholder="姓名" />
      <input v-model.trim="userForm.phone" placeholder="手机号" />
      <input v-model.trim="userForm.email" type="email" placeholder="邮箱" />
      <select v-model.number="userForm.userType"><option v-for="(name,id) in {1:'学生',2:'辅导员',3:'学院管理员',4:'学校管理员',5:'系统管理员'}" :key="id" :value="Number(id)">{{ name }}</option></select>
      <input v-model.number="userForm.collegeId" type="number" placeholder="学院 ID（辅导员/学院必填）" />
      <select v-model.number="userForm.status"><option :value="1">正常</option><option :value="0">禁用</option></select>
      <select v-model="userForm.roleIds" multiple title="按住 Ctrl/Command 可多选角色"><option v-for="role in roles" :key="role.id" :value="role.id">{{ role.roleName }}</option></select>
      <div class="form-actions"><button type="submit">{{ editingId ? '保存用户' : '新增用户' }}</button><button v-if="editingId" type="button" class="secondary" @click="clearUser">取消</button></div>
    </form>

    <template v-if="mode === 'roles'">
      <div class="overview"><article v-for="(value,key) in overview" :key="key"><span>{{ key }}</span><strong>{{ value }}</strong></article></div>
      <form class="form-grid role-form" @submit.prevent="saveRole">
        <input v-model.trim="roleForm.roleName" required placeholder="角色名称" />
        <input v-model.trim="roleForm.roleCode" required placeholder="角色编码" />
        <input v-model.trim="roleForm.description" placeholder="说明" />
        <input v-model.number="roleForm.sort" type="number" placeholder="排序" />
        <select v-model.number="roleForm.status"><option :value="1">正常</option><option :value="0">禁用</option></select>
        <div class="permissions">
          <label v-for="permission in permissions" :key="permission.id">
            <input v-model="roleForm.permissionIds" type="checkbox" :value="permission.id" />
            {{ permission.permissionName }} <small>{{ permission.permissionCode }}</small>
          </label>
        </div>
        <div class="form-actions"><button type="submit">{{ editingId ? '保存角色权限' : '新增角色' }}</button><button v-if="editingId" type="button" class="secondary" @click="clearRole">取消</button></div>
      </form>
    </template>

    <form v-if="mode === 'dictionary'" class="form-grid" @submit.prevent="saveDictionary">
      <input v-model.trim="dictForm.dictTypeCode" required placeholder="字典类型编码" />
      <input v-model.trim="dictForm.dictTypeName" required placeholder="字典类型名称" />
      <input v-model.trim="dictForm.itemCode" required placeholder="项编码" />
      <input v-model.trim="dictForm.itemName" required placeholder="项名称" />
      <input v-model.trim="dictForm.itemValue" placeholder="项值" />
      <input v-model.number="dictForm.sort" type="number" placeholder="排序" />
      <select v-model="dictForm.enabled"><option :value="true">启用</option><option :value="false">禁用</option></select>
      <input v-model.trim="dictForm.remark" placeholder="备注" />
      <div class="form-actions"><button type="submit">{{ editingId ? '保存字典项' : '新增字典项' }}</button><button v-if="editingId" type="button" class="secondary" @click="clearDictionary">取消</button></div>
    </form>

    <form v-if="mode === 'tutor-types'" class="form-grid" @submit.prevent="saveTutorType">
      <input v-model.trim="tutorTypeForm.typeName" required placeholder="类型名称" />
      <input v-model.trim="tutorTypeForm.typeCode" required placeholder="类型编码（大写下划线）" />
      <input v-model.trim="tutorTypeForm.description" placeholder="说明" />
      <select v-model="tutorTypeForm.needAmount"><option :value="true">需要金额</option><option :value="false">不需要金额</option></select>
      <select v-model="tutorTypeForm.needStudent"><option :value="true">需要关联学生</option><option :value="false">无需关联学生</option></select>
      <select v-model.number="tutorTypeForm.approvalLevel"><option :value="1">学院一级审批</option><option :value="2">学院+学校二级审批</option></select>
      <input v-model.number="tutorTypeForm.sort" type="number" placeholder="排序" />
      <select v-model="tutorTypeForm.enabled"><option :value="true">启用</option><option :value="false">禁用</option></select>
      <div class="form-actions"><button type="submit">{{ editingId ? '保存类型' : '新增类型' }}</button><button v-if="editingId" type="button" class="secondary" @click="clearTutorType">取消</button></div>
    </form>

    <section v-if="mode === 'dictionary' && configs.length">
      <h3>系统参数</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>参数</th><th>键</th><th>值</th><th>类型</th><th>说明</th><th>操作</th></tr></thead>
        <tbody><tr v-for="row in configs" :key="row.id">
          <td>{{ row.configName }}</td><td>{{ row.configKey }}</td><td>{{ row.configValue }}</td>
          <td>{{ row.configType }}</td><td>{{ row.description || '-' }}</td>
          <td><button class="link" :disabled="!row.editable" @click="editConfig(row)">修改</button></td>
        </tr></tbody>
      </table></div>
    </section>

    <div class="table-wrap">
      <table>
        <thead><tr><th v-for="key in objectColumns()" :key="key">{{ key }}</th><th v-if="['users','roles','dictionary','tutor-types'].includes(mode)">操作</th></tr></thead>
        <tbody>
          <tr v-if="!loading && !rows.length"><td :colspan="objectColumns().length + 1">暂无数据</td></tr>
          <tr v-for="row in rows" :key="row.id">
            <td v-for="key in objectColumns()" :key="key">{{ row[key] ?? '-' }}</td>
            <td v-if="mode === 'users'"><button class="link" @click="editUser(row)">编辑</button><button class="link" @click="resetPassword(row)">重置密码</button></td>
            <td v-else-if="mode === 'roles'"><button class="link" @click="editRole(row)">配置权限</button></td>
            <td v-else-if="mode === 'dictionary'"><button class="link" @click="editDictionary(row)">编辑</button><button class="link danger" @click="removeDictionary(row)">删除</button></td>
            <td v-else-if="mode === 'tutor-types'"><button class="link" @click="editTutorType(row)">编辑</button><button class="link danger" @click="removeTutorType(row)">删除</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.system-center{display:grid;gap:18px}.toolbar,.actions,.form-actions{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}h2{margin:0}p{color:#64748b}.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;padding:16px;background:#f8fafc;border-radius:14px}.form-grid input,.form-grid select,.actions input{padding:10px;border:1px solid #cbd5e1;border-radius:8px}.form-actions,.permissions{grid-column:1/-1}.form-actions{justify-content:flex-end}.permissions{max-height:260px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:7px;padding:12px;background:white;border:1px solid #e2e8f0;border-radius:10px}.permissions small{display:block;color:#64748b}.overview{display:flex;gap:12px}.overview article{display:grid;gap:6px;min-width:120px;padding:14px;background:#ecfdf5;border-radius:12px}.overview strong{font-size:24px}.table-wrap{overflow:auto;border:1px solid #e2e8f0;border-radius:12px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;white-space:nowrap}.secondary,.link{border:0;border-radius:8px;padding:9px 12px;background:#eef2ff;cursor:pointer}.link{padding:4px 7px}.danger,.error{color:#b91c1c}.notice{color:#047857}
</style>
