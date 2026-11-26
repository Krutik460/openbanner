import { handleProfileRequest } from '../server/handler'

/**
 * Cloudflare Worker entry point. Only /api/* reaches this code (see
 * `run_worker_first` in wrangler.jsonc); every other request is answered
 * straight from the static build, so the editor itself never runs a Worker.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname === '/api/profile') return handleProfileRequest(request)
    return new Response('Not found', { status: 404 })
  },
}
