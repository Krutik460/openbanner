import { handleProfileRequest } from '../server/handler'

/** Serverless entry point (web-standard handler, e.g. Vercel Functions). */
export function POST(request: Request): Promise<Response> {
  return handleProfileRequest(request)
}
