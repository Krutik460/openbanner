import { fileURLToPath, URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleProfileRequest } from './server/handler'

/** Serves /api/profile in `vite dev` and `vite preview`, using the same handler as production. */
function profileApi(): Plugin {
  const middleware = async (req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const response = await handleProfileRequest(
      new Request(`http://localhost${req.url ?? ''}`, {
        method: req.method,
        headers: { 'content-type': req.headers['content-type'] ?? 'application/json' },
        body: hasBody ? Buffer.concat(chunks) : undefined,
      }),
    )
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
  }
  return {
    name: 'profile-api',
    configureServer(server) {
      server.middlewares.use('/api/profile', middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/profile', middleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), profileApi()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
