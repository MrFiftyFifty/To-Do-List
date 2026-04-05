<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header
      v-if="showHeader"
      class="border-b border-slate-800 bg-slate-900/80 backdrop-blur"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NuxtLink to="/" class="text-lg font-semibold tracking-tight text-emerald-400">
          To-Do
        </NuxtLink>
        <div v-if="user" class="flex flex-wrap items-center gap-3 text-sm">
          <span class="text-slate-400">{{ user.email }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="
              user.role === 'admin'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-600 text-slate-200'
            "
          >
            {{ user.role }}
          </span>
          <button
            type="button"
            class="rounded-lg border border-slate-600 px-3 py-1.5 text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            @click="logout"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts } from '~/utils/authCookie'

const route = useRoute()
const tokenCookie = useCookie<string | null>(AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts)

const user = ref<{ id: number; email: string; role: 'admin' | 'user' } | null>(null)

function loadUser() {
  if (!import.meta.client) return
  const raw = localStorage.getItem('user')
  if (!raw) {
    user.value = null
    return
  }
  try {
    user.value = JSON.parse(raw) as { id: number; email: string; role: 'admin' | 'user' }
  } catch {
    user.value = null
  }
}

const showHeader = computed(() => route.path !== '/login')

onMounted(() => {
  loadUser()
})

watch(
  () => route.path,
  () => {
    loadUser()
  },
)

function logout() {
  if (import.meta.client) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    tokenCookie.value = null
  }
  user.value = null
  navigateTo('/login')
}
</script>
