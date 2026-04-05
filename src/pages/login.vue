<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
  <div class="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl">
    <h1 class="mb-6 text-center text-2xl font-semibold text-white">Вход</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label for="email" class="mb-1 block text-sm text-slate-400">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="username"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-500/50 focus:border-emerald-500 focus:ring-2"
          required
        />
      </div>
      <div>
        <label for="password" class="mb-1 block text-sm text-slate-400">Пароль</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-500/50 focus:border-emerald-500 focus:ring-2"
          required
        />
      </div>
      <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
      <button
        type="submit"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        :disabled="loading"
      >
        <span
          v-if="loading"
          class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        />
        Войти
      </button>
    </form>
    <p class="mt-6 text-center text-xs text-slate-500">
      admin@test.com / user@test.com — пароль 123456
    </p>
  </div>
  </div>
</template>

<script setup lang="ts">
import { AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts } from '~/utils/authCookie'

definePageMeta({
  layout: false,
})

const { $api } = useNuxtApp()
const tokenCookie = useCookie<string | null>(AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts)

const email = ref('admin@test.com')
const password = ref('123456')
const loading = ref(false)
const formError = ref('')

async function submit() {
  formError.value = ''
  loading.value = true
  try {
    const { data } = await $api.post<{
      token: string
      user: { id: number; email: string; role: 'admin' | 'user' }
    }>('/auth/login', {
      email: email.value.trim(),
      password: password.value,
    })
    if (import.meta.client) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      tokenCookie.value = data.token
    }
    await navigateTo('/')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    formError.value = err.response?.data?.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>
