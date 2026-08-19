import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 项目站点部署在 https://<user>.github.io/<repo>/ 子路径下，
// 使用相对 base 保证静态资源在任何子路径下都能正确加载。
export default defineConfig({
  base: './',
  plugins: [react()],
})
