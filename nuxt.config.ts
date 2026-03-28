export default defineNuxtConfig({
  srcDir: 'src/',
  compatibilityDate: '2025-01-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    public: {
      apiBase: '/api',
    },
  },
})
