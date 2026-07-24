import {apiRequest} from "@/api/request.js";

export async function getCurrentUser() {
    const token = localStorage.getItem('green_channel_token')
    if (!token) return null

    try {
        const user = await apiRequest.get('/auth/me')
        // ✅ 关键：后端必须返回 permissions
        // 如果后端还没返回，先 mock（开发阶段）
        if (!user.permissions) {
            user.permissions = mockPermissionsByRole(user.roleName)
        }
        return user
    } catch (error) {
        if (error.status === 401) {
            localStorage.removeItem('green_channel_token')
        }
        return null
    }
}
