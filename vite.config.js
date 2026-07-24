import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
    plugins: [
        vue(),
        Components({
            resolvers: [ElementPlusResolver()]
        })
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        },
        watch: {
            ignored: [
                '**/.vs/**',
                '**/.vscode/**',
                '**/node_modules/**'
            ]
        }
    }
})
