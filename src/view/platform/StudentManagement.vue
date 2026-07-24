<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  createStudent,
  deleteStudent,
  downloadStudentTemplate,
  getColleges,
  getStudents,
  importStudents,
  searchTutorStudents,
  updateStudent
} from '../../api'

const props = defineProps({
  userType: Number
})

const rows = ref([])
const colleges = ref([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const notice = ref('')
const keyword = ref('')
const editingId = ref(null)
const form = reactive({
  studentNo: '',
  name: '',
  gender: 1,
  idCard: '',
  phone: '',
  email: '',
  enrollYear: new Date().getFullYear(),
  collegeId: null,
  majorId: null,
  classId: null,
  studentType: '本科'
})

const canEdit = props.userType === 4 || props.userType === 5

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (canEdit) {
      const result = await getStudents({
        studentNo: /^[A-Za-z0-9_-]+$/.test(keyword.value) ? keyword.value : '',
        name: /^[A-Za-z0-9_-]+$/.test(keyword.value) ? '' : keyword.value,
        page: 1,
        size: 50
      })
      rows.value = result.items || []
      total.value = result.total || 0
    } else {
      rows.value = keyword.value ? await searchTutorStudents(keyword.value) : []
      total.value = rows.value.length
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function edit(row) {
  editingId.value = row.id
  Object.assign(form, {
    studentNo: row.studentNo,
    name: row.name,
    gender: row.gender ?? 1,
    idCard: '',
    phone: '',
    email: row.email || '',
    enrollYear: row.enrollYear,
    collegeId: row.collegeId,
    majorId: row.majorId,
    classId: row.classId,
    studentType: row.studentType || '本科'
  })
}

function resetForm() {
  editingId.value = null
  Object.assign(form, {
    studentNo: '',
    name: '',
    gender: 1,
    idCard: '',
    phone: '',
    email: '',
    enrollYear: new Date().getFullYear(),
    collegeId: colleges.value[0]?.id ?? null,
    majorId: null,
    classId: null,
    studentType: '本科'
  })
}

async function save() {
  error.value = ''
  notice.value = ''
  try {
    if (editingId.value) await updateStudent(editingId.value, form)
    else await createStudent(form)
    notice.value = editingId.value ? '学生信息已更新' : '学生账号与档案已创建'
    resetForm()
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  if (!confirm(`确认删除 ${row.name}？存在业务申请时系统会拒绝删除。`)) return
  try {
    await deleteStudent(row.id)
    notice.value = '学生已删除'
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function upload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const result = await importStudents(file)
    notice.value = `导入完成：成功 ${result.successCount ?? 0} 条，失败 ${result.failureCount ?? 0} 条`
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    event.target.value = ''
  }
}

async function loadColleges() {
  if (!canEdit) return
  try {
    colleges.value = await getColleges()
    if (!form.collegeId && colleges.value.length) form.collegeId = colleges.value[0].id
  } catch {
    colleges.value = []
  }
}

onMounted(() => Promise.all([load(), loadColleges()]))
</script>

<template>
  <div class="module">
    <div class="toolbar">
      <div>
        <h2>{{ canEdit ? '新生信息管理' : '所带学生查询' }}</h2>
        <p>共 {{ total }} 条记录；敏感信息由后端脱敏或加密保存。</p>
      </div>
      <div class="actions">
        <input v-model.trim="keyword" placeholder="学号或姓名" @keyup.enter="load" />
        <button class="secondary" @click="load">查询</button>
        <button v-if="canEdit" class="secondary" @click="downloadStudentTemplate">下载模板</button>
        <label v-if="canEdit" class="upload">导入 Excel<input type="file" accept=".xlsx" @change="upload" /></label>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="notice" class="notice">{{ notice }}</p>

    <form v-if="canEdit" class="edit-form" @submit.prevent="save">
      <input v-model.trim="form.studentNo" required placeholder="学号" />
      <input v-model.trim="form.name" required placeholder="姓名" />
      <select v-model.number="form.gender"><option :value="1">男</option><option :value="2">女</option></select>
      <input v-model.trim="form.idCard" :required="!editingId" placeholder="身份证号（更新留空表示不改）" />
      <input v-model.trim="form.phone" placeholder="手机号" />
      <input v-model.trim="form.email" type="email" placeholder="邮箱" />
      <input v-model.number="form.enrollYear" required type="number" placeholder="入学年份" />
      <select v-if="colleges.length" v-model.number="form.collegeId" required>
        <option :value="null" disabled>请选择学院</option>
        <option v-for="college in colleges" :key="college.id" :value="college.id">{{ college.collegeName }}</option>
      </select>
      <input v-else v-model.number="form.collegeId" required type="number" placeholder="学院 ID" />
      <input v-model.number="form.majorId" required type="number" placeholder="专业 ID" />
      <input v-model.number="form.classId" type="number" placeholder="班级 ID" />
      <select v-model="form.studentType"><option>本科</option><option>研究生</option></select>
      <div class="form-actions">
        <button type="submit">{{ editingId ? '保存修改' : '新增学生' }}</button>
        <button v-if="editingId" type="button" class="secondary" @click="resetForm">取消</button>
      </div>
    </form>

    <div class="table-wrap">
      <table>
        <thead><tr><th>学号</th><th>姓名</th><th>入学年</th><th>学院/专业/班级</th><th>类型</th><th>联系方式</th><th v-if="canEdit">操作</th></tr></thead>
        <tbody>
          <tr v-if="!loading && rows.length === 0"><td :colspan="canEdit ? 7 : 6">暂无数据{{ canEdit ? '' : '，请输入关键词查询' }}</td></tr>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.studentNo }}</td><td>{{ row.name }}</td><td>{{ row.enrollYear || '-' }}</td>
            <td>{{ row.collegeId || '-' }}/{{ row.majorId || '-' }}/{{ row.classId || '-' }}</td>
            <td>{{ row.studentType || '-' }}</td><td>{{ row.maskedPhone || row.phone || '-' }}</td>
            <td v-if="canEdit"><button class="link" @click="edit(row)">编辑</button><button class="link danger" @click="remove(row)">删除</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.module{display:grid;gap:18px}.toolbar,.actions,.form-actions{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}h2{margin:0}p{color:#64748b}.edit-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:16px;background:#f8fafc;border-radius:14px}.edit-form input,.edit-form select,.actions input{padding:10px;border:1px solid #cbd5e1;border-radius:8px}.form-actions{grid-column:1/-1;justify-content:flex-end}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;white-space:nowrap}.upload{background:#0f766e;color:white;padding:10px 14px;border-radius:8px;cursor:pointer}.upload input{display:none}.secondary,.link{background:#eef2ff;color:#334155;border:0;padding:9px 12px;border-radius:8px}.link{padding:4px 8px}.danger,.error{color:#b91c1c}.notice{color:#047857}button{cursor:pointer}
</style>
