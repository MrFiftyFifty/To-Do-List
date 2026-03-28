export default defineNuxtPlugin(async () => {
  if (import.meta.env.PROD) return
  const { worker } = await import('~/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
  })
})
