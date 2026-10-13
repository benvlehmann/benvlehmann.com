// Build-time only: the post-build step (src/integrations/paper-previews.mjs) reads
// this file, embeds each page's subset, and then deletes it from the output.
import type { APIRoute } from 'astro';
import { previewIndex } from '../lib/previews';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await previewIndex()), { headers: { 'Content-Type': 'application/json' } });
