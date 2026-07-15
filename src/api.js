const TOKEN_KEY = 'green_channel_token'

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const payload = await response.json()
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
  return payload.data
}

export async function login(username, password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
  localStorage.setItem(TOKEN_KEY, result.token)
  return result.user
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' })
  } finally {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export async function currentUser() {
  if (!localStorage.getItem(TOKEN_KEY)) return null
  try {
    return await request('/api/auth/me')
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
}

