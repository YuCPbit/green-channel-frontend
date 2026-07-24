const TOKEN_KEY = 'green_channel_token'

class ApiRequest {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`
        const token = localStorage.getItem(TOKEN_KEY)

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers
            }
        }

        try {
            const response = await fetch(url, config)

            // 处理401未授权
            if (response.status === 401) {
                this.clearAuth()
                window.location.href = '/'
                return
            }

            const payload = await response.json()

            if (!response.ok || payload.code !== 0) {
                throw new ApiError(
                    payload.message || '请求失败',
                    payload.code,
                    response.status
                )
            }

            return payload.data
        } catch (error) {
            if (error instanceof ApiError) {
                throw error
            }
            throw new ApiError('网络请求失败', 500, 0)
        }
    }

    clearAuth() {
        localStorage.removeItem(TOKEN_KEY)
    }

    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString()
        const url = queryString ? `${endpoint}?${queryString}` : endpoint
        return this.request(url, { method: 'GET' })
    }

    post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' })
    }
}

class ApiError extends Error {
    constructor(message, code, status) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.status = status
    }
}

export const apiRequest = new ApiRequest()
export { ApiError }