<script setup>
import { onMounted, ref } from 'vue'
import { currentUser, login, logout } from './api'

const user = ref(null)
const username = ref('student01')
const password = ref('Dev@123456')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  user.value = await currentUser()
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    user.value = await login(username.value, password.value)
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    loading.value = false
  }
}

async function signOut() {
  await logout()
  user.value = null
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
      <p class="dev-hint">开发账号：student01 / Dev@123456</p>
    </section>

    <section v-else class="dashboard">
      <header>
        <div>
          <p class="eyebrow">高校绿色通道系统</p>
          <h1>你好，{{ user.realName }}</h1>
          <p class="subtitle">当前身份：{{ user.roleName }}</p>
        </div>
        <button class="secondary" @click="signOut">退出登录</button>
      </header>

      <div class="menu-grid">
        <article v-for="(menu, index) in user.menus" :key="menu">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <h2>{{ menu }}</h2>
          <p>模块功能正在按项目计划持续交付。</p>
        </article>
      </div>
    </section>
  </main>
</template>

