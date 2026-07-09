const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '')
const CACHE = 'pourfolio-shell-v6'

/** Keep install tiny — large catalog JSON is cached lazily on fetch, not during install. */
const SHELL = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icons/icon.svg`,
]

function shouldCache(url) {
  return (
    url.pathname.includes('/assets/') ||
    url.pathname.includes('/catalog/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

/** Network-first so deploys reach installed apps; cache is offline fallback only. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && shouldCache(url)) {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
