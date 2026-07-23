<script setup>
import { computed, onMounted, ref } from 'vue'
import { currentUser, login, logout } from './api'
import BatchManagement from './view/subsidy/BatchManagement.vue'
import AllocationBoard from './view/subsidy/AllocationBoard.vue'
import SubsidyApply from './view/subsidy/SubsidyApply.vue'
import AidReview from './view/subsidy/AidReview.vue'
import CollegeReview from './view/subsidy/CollegeReview.vue'
import SchoolReview from './view/subsidy/SchoolReview.vue'
import FundLedger from './view/subsidy/FundLedger.vue'
import TutorApply from './view/tutor/TutorApply.vue'
import TutorReview from './view/tutor/TutorReview.vue'
import EvaluationManagement from './view/workstudy/EvaluationManagement.vue'
import MyEvaluations from './view/workstudy/MyEvaluations.vue'

const user = ref(null)
const username = ref('student01')
const password = ref('Dev@123456')
const loading = ref(false)
const error = ref('')
const activeMenu = ref('')

const menuViewMap = {
  '批次配置': BatchManagement,
  '资金管理': AllocationBoard,
  '额度管理': AllocationBoard,
  '困难补助': SubsidyApply,
  '资助审核': AidReview,
  '学院审核': CollegeReview,
  '学校审核': SchoolReview,
  '资金台账': FundLedger,
  '事务申请': TutorApply,
  '事务审批': TutorReview,
  '工作评价管理': EvaluationManagement,
  '我的工作评价': MyEvaluations
}

const menuDescriptions = {
  '批次配置': '配置学校资助批次的时间、状态与规则。',
  '资金管理': '查看和管理学校资助资金的分配情况。',
  '额度管理': '查看学院可用额度并进行分配管理。',
  '资金台账': '查看和管理补助发放台账，确认发放状态。',
  '事务申请': '辅导员发起各类事务性申请，查看审批进度。',
  '事务审批': '审批辅导员提交的事务申请，管理资金下发。',
  '工作评价管理': '对在岗勤工助学学生进行月度工作评价，查看评价记录。',
  '我的工作评价': '查看本人在勤工助学岗位上的各月工作评价结果。'
}

const visibleMenus = computed(() => {
  if (!user.value) return []
  const menus = Array.isArray(user.value.menus) ? user.value.menus : []
  return menus.map((menu) => ({
    name: menu,
    active: activeMenu.value === menu
  }))
})

const activeView = computed(() => menuViewMap[activeMenu.value] || null)

onMounted(async () => {
  user.value = await currentUser()
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    user.value = await login(username.value, password.value)
    activeMenu.value = ''
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    loading.value = false
  }
}

async function signOut() {
  await logout()
  user.value = null
  activeMenu.value = ''
}

function openMenu(menuName) {
  activeMenu.value = menuName
}

function backToDashboard() {
  activeMenu.value = ''
}
</script>

<template>
  <main class="page-shell">
    <section v-if="!user" class="login-card">
      <div class="brand-mark">绿</div>
      <p class="eyebrow">STUDENT SUPPORT</p>
      <h1>高校绿色通道系统</h1>
      <p class="subtitle">让资助申请更清晰、更及时</p>

      <form @submit.prevent="submit">
        <label>
          账号
          <input v-model.trim="username" autocomplete="username" placeholder="请输入学号或工号" />
        </label>
        <label>
          密码
          <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" />
        </label>
        <p v-if="error" class="error-message">{{ error }}</p>
        <button :disabled="loading" type="submit">{{ loading ? '正在登录…' : '登录系统' }}</button>
      </form>
      <p class="dev-hint">开发账号：student01 / tutor01 / college01 / school01 / admin01　密码：Dev@123456</p>
    </section>

    <section v-else class="dashboard">
      <header>
        <div>
          <p class="eyebrow">高校绿色通道系统</p>
          <h1>你好，{{ user.realName }}</h1>
          <p class="subtitle">当前身份：{{ user.roleName }}</p>
        </div>
        <div class="header-actions">
          <button v-if="activeMenu" class="secondary" @click="backToDashboard">返回菜单</button>
          <button class="secondary" @click="signOut">退出登录</button>
        </div>
      </header>

      <div v-if="!activeMenu" class="menu-grid">
        <article
          v-for="(menu, index) in visibleMenus"
          :key="menu.name"
          class="menu-card"
          :class="{ active: menu.active }"
          @click="openMenu(menu.name)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <h2>{{ menu.name }}</h2>
          <p>模块功能正在按项目计划持续交付。</p>
        </article>
      </div>

      <section v-if="activeView" class="workspace-panel">
        <component :is="activeView" :user-type="user?.userType" :menu-name="activeMenu" :user="user" />
      </section>

      <section v-else class="workspace-panel workspace-placeholder">
        <p class="subtitle">请选择上方功能入口开始使用。</p>
      </section>
    </section>
  </main>
</template>

