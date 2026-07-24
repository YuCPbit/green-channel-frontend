<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { user, loading } = storeToRefs(authStore)

/* ================== 登录表单 ================== */
const username = ref('student01')
const password = ref('Dev@123456')
const error = ref('')

/* ================== 菜单配置（含权限） ================== */
const menuItems = [
  {
    name: '批次配置',
    route: '/subsidy/batches',
    roles: ['ADMIN', 'SCHOOL'],
    permission: 'subsidy:batch:view'
  },
  {
    name: '额度管理',
    route: '/subsidy/allocations',
    roles: ['ADMIN', 'SCHOOL', 'COLLEGE'],
    permission: 'subsidy:allocation:view'
  },
  {
    name: '困难补助',
    route: '/subsidy/apply',
    roles: ['STUDENT', 'TUTOR'],
    permission: 'subsidy:apply:submit'
  },
  {
    name: '资助审核',
    route: '/subsidy/review',
    roles: ['TUTOR'],
    permission: 'subsidy:review:submit'
  },
  {
    name: '学院审核',
    route: '/subsidy/college-review',
    roles: ['COLLEGE'],
    permission: 'subsidy:review:college'
  },
  {
    name: '学校审核',
    route: '/subsidy/school-review',
    roles: ['SCHOOL'],
    permission: 'subsidy:review:school'
  },
  {
    name: '勤工俭学',
    route: '/workstudy',
    roles: ['STUDENT', 'MANAGER', 'DEPT', 'SCHOOL'],
    permission: 'workstudy:position:view'
  }
]

/* ================== 可见菜单（角色 + 权限双重过滤） ================== */
const visibleMenus = computed(() => {
  if (!user.value) return []

  const perms = user.value.permissions || []

  return menuItems.filter(item => {
    // 角色校验
    if (!item.roles.includes(user.value.roleName)) return false

    // 权限校验
    const hasPerm = !item.permission || perms.includes(item.permission)
    return hasPerm
  })
})

/* ================== 用户信息 ================== */
const userName = computed(() => user.value?.realName || '')
const userRole = computed(() => user.value?.roleName || '')

/* ================== 生命周期 ================== */
onMounted(async () => {
  await authStore.initialize()
})

/* ================== 登录 ================== */
async function handleLogin() {
  error.value = ''
  try {
    await authStore.login(username.value, password.value)

    // ✅ 登录后自动跳转到第一个合法菜单
    if (visibleMenus.value.length > 0) {
      router.push(visibleMenus.value[0].route)
    } else {
      router.push('/403')
    }
  } catch (err) {
    error.value = err.message || '登录失败'
  }
}

/* ================== 登出 ================== */
async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

/* ================== 菜单点击 ================== */
function navigateTo(routePath) {
  router.push(routePath)
}

/* ================== 当前路由无权限时兜底 ================== */
watch(
    () => route.path,
    () => {
      if (!user.value) return

      const matchedMenu = visibleMenus.value.find(m =>
          route.path.startsWith(m.route)
      )

      if (!matchedMenu && route.path !== '/403') {
        router.replace('/403')
      }
    },
    { immediate: true }
)
</script>

<template>
  <div class="app-container">
    <!-- ================== 登录页 ================== -->
    <div v-if="!user" class="login-container page-shell">
      <section class="login-card">
        <div class="brand-mark">绿</div>
        <p class="eyebrow">STUDENT SUPPORT</p>
        <h1>高校绿色通道系统</h1>
        <p class="subtitle">让资助申请更清晰、更及时</p>

        <form @submit.prevent="handleLogin">
          <label>
            账号
            <input
                v-model.trim="username"
                autocomplete="username"
                placeholder="请输入学号或工号"
            />
          </label>

          <label>
            密码
            <input
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="请输入密码"
            />
          </label>

          <p v-if="error" class="error-message">{{ error }}</p>

          <button :disabled="loading" type="submit">
            {{ loading ? '正在登录…' : '登录系统' }}
          </button>
        </form>

        <p class="dev-hint">
          开发账号：student01 / tutor01 / college01 / school01 / admin01<br />
          密码：Dev@123456
        </p>
      </section>
    </div>

    <!-- ================== 主应用 ================== -->
    <div v-else class="main-app">
      <header class="app-header">
        <div class="header-left">
          <h1>高校绿色通道系统</h1>
          <span class="user-info">
            欢迎，{{ userName }}（{{ userRole }}）
          </span>
        </div>
        <div class="header-right">
          <button @click="handleLogout" class="logout-btn secondary">
            退出登录
          </button>
        </div>
      </header>

      <div class="app-body">
        <!-- 侧边栏 -->
        <aside class="sidebar" v-if="visibleMenus.length">
          <nav>
            <ul>
              <li v-for="menu in visibleMenus" :key="menu.name">
                <button
                    @click="navigateTo(menu.route)"
                    class="menu-item"
                    :class="{ active: route.path.startsWith(menu.route) }"
                >
                  {{ menu.name }}
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <!-- 无菜单权限兜底 -->
        <div v-else class="no-menu">
          <p>您暂无任何功能权限，请联系管理员。</p>
          <button @click="handleLogout" class="logout-btn">
            退出登录
          </button>
        </div>

        <!-- 主内容区 -->
        <main class="content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #edf4ef;
}

/* ================== 登录 ================== */
.login-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 48px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 24px 80px rgba(27, 74, 57, 0.12);
}

.brand-mark {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #217a58;
  color: #fff;
  font-size: 26px;
  font-weight: 700;
}

.eyebrow {
  margin: 24px 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #50816d;
}

.subtitle {
  margin: 8px 0 24px;
  color: #668077;
}

form {
  display: grid;
  gap: 18px;
}

label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

input {
  padding: 12px 14px;
  border: 1px solid #cbdad0;
  border-radius: 12px;
  background: #fbfdfb;
}

input:focus {
  border-color: #217a58;
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 122, 88, 0.12);
}

button {
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  background: #217a58;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.secondary {
  background: #e7f1eb;
  color: #217a58;
}

.error-message {
  color: #b53f3f;
  font-size: 14px;
}

.dev-hint {
  margin-top: 24px;
  font-size: 12px;
  color: #84968f;
  text-align: center;
}

/* ================== 主应用 ================== */
.main-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(25, 89, 66, 0.12);
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #16352c;
}

.user-info {
  font-size: 14px;
  color: #50816d;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ================== 侧边栏 ================== */
.sidebar {
  width: 220px;
  background: #f1f7f3;
  border-right: 1px solid rgba(25, 89, 66, 0.08);
  padding: 16px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  margin-bottom: 8px;
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #16352c;
}

.menu-item:hover {
  background: #e7f1eb;
}

.menu-item.active {
  background: #217a58;
  color: #fff;
}

/* ================== 无菜单权限 ================== */
.no-menu {
  flex: 1;
  display: grid;
  place-items: center;
  color: #668077;
  font-size: 16px;
}

/* ================== 内容区 ================== */
.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* ================== 动画 ================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>