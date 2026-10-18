import { handleVisitorStats } from './visitor-stats';

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === '/api/visitors') {
      return handleVisitorStats(request, env.DB);
    }
    return env.ASSETS.fetch(request);
  },
};
