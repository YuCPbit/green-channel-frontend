<script setup>
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { currentUser, login, logout } from './api'

const StudentApply = defineAsyncComponent(() => import('./view/green/StudentApply.vue'))
const GiftReview = defineAsyncComponent(() => import('./view/green/GiftReview.vue'))
const BatchManagement = defineAsyncComponent(() => import('./view/subsidy/BatchManagement.vue'))
const AllocationBoard = defineAsyncComponent(() => import('./view/subsidy/AllocationBoard.vue'))
const SubsidyApply = defineAsyncComponent(() => import('./view/subsidy/SubsidyApply.vue'))
const AidReview = defineAsyncComponent(() => import('./view/subsidy/AidReview.vue'))
const CollegeReview = defineAsyncComponent(() => import('./view/subsidy/CollegeReview.vue'))
const SchoolReview = defineAsyncComponent(() => import('./view/subsidy/SchoolReview.vue'))
const FundLedger = defineAsyncComponent(() => import('./view/subsidy/FundLedger.vue'))
const TutorApply = defineAsyncComponent(() => import('./view/tutor/TutorApply.vue'))
const TutorReview = defineAsyncComponent(() => import('./view/tutor/TutorReview.vue'))
const EvaluationManagement = defineAsyncComponent(() => import('./view/workstudy/EvaluationManagement.vue'))
const MyEvaluations = defineAsyncComponent(() => import('./view/workstudy/MyEvaluations.vue'))
const MovementCenter = defineAsyncComponent(() => import('./view/workstudy/MovementCenter.vue'))
const WorkStudyCenter = defineAsyncComponent(() => import('./view/workstudy/WorkStudyCenter.vue'))
const SupportCenter = defineAsyncComponent(() => import('./view/support/SupportCenter.vue'))
const GiftPackBatchManagement = defineAsyncComponent(() => import('./view/green/GiftPackBatchManagement.vue'))
const GreenBatchManagement = defineAsyncComponent(() => import('./view/green/GreenBatchManagement.vue'))
const GiftPackItemManagement = defineAsyncComponent(() => import('./view/green/GiftPackItemManagement.vue'))
const QuotaManagement = defineAsyncComponent(() => import('./view/green/QuotaManagement.vue'))
const PickupManagement = defineAsyncComponent(() => import('./view/green/PickupManagement.vue'))
const SupplementManagement = defineAsyncComponent(() => import('./view/green/SupplementManagement.vue'))
const StudentManagement = defineAsyncComponent(() => import('./view/platform/StudentManagement.vue'))
const DashboardCenter = defineAsyncComponent(() => import('./view/platform/DashboardCenter.vue'))
const MessageCenter = defineAsyncComponent(() => import('./view/platform/MessageCenter.vue'))
const SystemManagement = defineAsyncComponent(() => import('./view/platform/SystemManagement.vue'))

const user = ref(null)
const username = ref('student01')
const password = ref('')
const loading = ref(false)
const error = ref('')
const activeMenu = ref('')

const menuViewMap = {
  '绿色通道': StudentApply,
  '绿色通道审核': GiftReview,
  '绿色通道批次管理': GreenBatchManagement,
  '大礼包批次管理': GiftPackBatchManagement,
  '大礼包物品管理': GiftPackItemManagement,
  '名额分配管理': QuotaManagement,
  '礼包核销管理': PickupManagement,
  '补录管理': SupplementManagement,
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
  '我的工作评价': MyEvaluations,
  '资助方案管理': SupportCenter,
  '我的申诉': SupportCenter,
  '申诉处理': SupportCenter,
  '问卷管理': SupportCenter,
  '满意度反馈': SupportCenter,
  '岗位变动申请': MovementCenter,
  '岗位变动审批': MovementCenter,
  '勤工助学岗位': WorkStudyCenter,
  '我的勤工申请': WorkStudyCenter,
  '我的勤工考勤': WorkStudyCenter,
  '我的勤工薪酬': WorkStudyCenter,
  '我的勤工协议': WorkStudyCenter,
  '勤工助学批次': WorkStudyCenter,
  '勤工岗位管理': WorkStudyCenter,
  '勤工岗位审核': WorkStudyCenter,
  '勤工面试管理': WorkStudyCenter,
  '勤工录用审批': WorkStudyCenter,
  '勤工考勤管理': WorkStudyCenter,
  '勤工薪酬确认': WorkStudyCenter,
  '勤工薪酬管理': WorkStudyCenter,
  '勤工协议管理': WorkStudyCenter,
  '学生管理': StudentManagement,
  '新生管理': StudentManagement,
  '学院报表': DashboardCenter,
  '数据看板': DashboardCenter,
  '消息中心': MessageCenter,
  '用户管理': SystemManagement,
  '角色权限': SystemManagement,
  '字典参数': SystemManagement,
  '接口监控': SystemManagement,
  '操作日志': SystemManagement,
  '事务类型配置': SystemManagement
}

const menuDescriptions = {
  '首页': '查看当前账号可办理的资助与勤工助学事项。',
  '绿色通道': '申请爱心大礼包并查看申请进度。',
  '绿色通道审核': '审核绿色通道申请并查看审核记录。',
  '绿色通道批次管理': '配置绿色通道申请时段、学年学期与资金来源。',
  '大礼包批次管理': '维护礼包批次、可选数量和启用状态。',
  '大礼包物品管理': '配置礼包物品、尺码、适用范围与可用库存。',
  '名额分配管理': '按学院和年级配置礼包申请名额。',
  '礼包核销管理': '按领取码核验礼包并登记异常与补发。',
  '补录管理': '为线下或特殊情形补录绿色通道申请。',
  '批次配置': '配置学校资助批次的时间、状态与规则。',
  '资金管理': '查看和管理学校资助资金的分配情况。',
  '额度管理': '查看学院可用额度并进行分配管理。',
  '困难补助': '提交困难补助申请并查看审核与发放进度。',
  '资助审核': '辅导员核验困难补助材料并提出建议金额。',
  '学院审核': '学院复核补助申请并控制本院额度。',
  '学校审核': '完成补助终审并生成资金发放台账。',
  '资金台账': '查看和管理补助发放台账，确认发放状态。',
  '事务申请': '辅导员发起各类事务性申请，查看审批进度。',
  '事务审批': '审批辅导员提交的事务申请，管理资金下发。',
  '工作评价管理': '对在岗勤工助学学生进行月度工作评价，查看评价记录。',
  '我的工作评价': '查看本人在勤工助学岗位上的各月工作评价结果。',
  '资助方案管理': '配置、试运行、发布和下线资助方案。',
  '我的申诉': '对被不通过的申请在规定窗口内提交申诉。',
  '申诉处理': '受理并办结当前审核节点的学生申诉。',
  '问卷管理': '发布资助满意度问卷并查看反馈汇总。',
  '满意度反馈': '填写资助服务满意度评分和建议。',
  '岗位变动申请': '提交调岗或离岗申请并查看审批进度。',
  '岗位变动审批': '审批调岗离岗并联动岗位名额。',
  '勤工助学岗位': '浏览已上架岗位，查看名额并在线报名。',
  '我的勤工申请': '查看本人岗位报名、面试和录用进度。',
  '我的勤工考勤': '在岗签到签退、查询工时并申请补打卡。',
  '我的勤工薪酬': '按月查看工时、核算金额与发放状态。',
  '我的勤工协议': '查看并在线确认签署勤工助学协议。',
  '勤工助学批次': '创建招聘批次并按报名、面试、上岗状态流转。',
  '勤工岗位管理': '创建岗位草稿并提交学校审核。',
  '勤工岗位审核': '审核用工岗位并控制上架状态。',
  '勤工面试管理': '查看岗位报名、填写推荐并录入面试结果。',
  '勤工录用审批': '审批面试通过的学生并自动生成协议。',
  '勤工考勤管理': '确认正常考勤与补打卡记录。',
  '勤工薪酬确认': '用工部门核对系统核算的月度薪酬。',
  '勤工薪酬管理': '核算、审批并标记勤工助学薪酬发放。',
  '勤工协议管理': '查询已签协议并维护续签到期日。',
  '学生管理': '查询本人所带班级的学生档案。',
  '新生管理': '维护新生档案，支持 Excel 导入和错误反馈。',
  '学院报表': '按本院权限查看资助申请规模与状态分布。',
  '数据看板': '查看全校资助、礼包和勤工助学核心指标。',
  '消息中心': '集中查看业务待办、审核结果和发放通知。',
  '用户管理': '创建、启停账号、分配角色并安全重置密码。',
  '角色权限': '维护角色及其菜单、按钮权限。',
  '字典参数': '维护系统下拉选项与业务字典。',
  '接口监控': '查看外部系统调用结果、耗时和异常。',
  '操作日志': '审计系统关键增删改操作。',
  '事务类型配置': '维护辅导员事务申请类型、审批级数和动态表单规则。'
}

const studentOnlyMenus = new Set([
  '绿色通道',
  '困难补助',
  '我的申诉',
  '满意度反馈',
  '岗位变动申请',
  '勤工助学岗位',
  '我的勤工申请',
  '我的勤工考勤',
  '我的工作评价',
  '我的勤工薪酬',
  '我的勤工协议'
])

const visibleMenus = computed(() => {
  if (!user.value) return []
  const menus = Array.isArray(user.value.menus) ? user.value.menus : []
  return menus
    .filter((menu) => user.value.userType === 1 || !studentOnlyMenus.has(menu))
    .map((menu) => ({
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
  try {
    await logout()
  } finally {
    user.value = null
    activeMenu.value = ''
  }
}

function openMenu(menuName) {
  activeMenu.value = menuName === '首页' ? '' : menuName
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
      <p class="dev-hint">本地开发账号见后端初始化数据；演示或部署前请务必修改初始密码。</p>
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
          <p>{{ menuDescriptions[menu.name] || '模块功能正在按项目计划持续交付。' }}</p>
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
