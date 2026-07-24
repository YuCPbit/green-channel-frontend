import { useAuthStore } from '@/stores/auth'

export default {
    mounted(el, binding) {
        const authStore = useAuthStore()
        const { value } = binding

        if (!value) return

        const userPermissions = authStore.user?.permissions || []

        // value 支持两种写法：
        // v-permission="'workstudy:position:publish'"
        // v-permission="['workstudy:position:publish', 'workstudy:position:update']"
        const requiredPermissions = Array.isArray(value) ? value : [value]

        const hasPermission = requiredPermissions.some(p =>
            userPermissions.includes(p)
        )

        if (!hasPermission) {
            // ✅ 无权限直接移除 DOM（比 display:none 安全）
            el.parentNode?.removeChild(el)
        }
    }
}