/* ═══════════════════════════════════════════════════════════════════
   _lib/rateLimit.js — best-effort in-memory rate limiting  ·  taak 05
   ───────────────────────────────────────────────────────────────────
   Zero-dependency, zero-config throttle keyed by client IP.

   ⚠ SERVERLESS CAVEAT: Netlify Function instances are ephemeral and can
   run in parallel, so this state is PER WARM INSTANCE — not a global
   guarantee. In practice a single IP hammering a warm container IS caught
   (rapid bursts + brute-force from one source), which is exactly the
   cost/DoS and credential-stuffing vector we care about here. For a HARD
   global limit, front the site with an edge/CDN rate rule (Netlify/
   Cloudflare) or a durable store (Supabase/Upstash). This module is the
   cheap first layer that costs nothing and ships today.

   Sliding-window counters. Memory is bounded by opportunistic pruning.
═══════════════════════════════════════════════════════════════════ */
'use strict';

const buckets = new Map(); // key -> sorted array of hit timestamps (ms)

function clientIp(event) {
  const h = (event && event.headers) || {};
  return h['x-nf-client-connection-ip']
      || (h['x-forwarded-for'] || '').split(',')[0].trim()
      || h['client-ip']
      || 'unknown';
}

function arr(key) {
  let a = buckets.get(key);
  if (!a) { a = []; buckets.set(key, a); }
  return a;
}
function prune(a, cutoff) { while (a.length && a[0] <= cutoff) a.shift(); }
function gc(now) {
  if (buckets.size <= 5000) return;
  for (const [k, v] of buckets) { prune(v, now - 60 * 60 * 1000); if (!v.length) buckets.delete(k); }
}

/* Peek: is this key already at/over the limit in the window? (no recording) */
function isOver(key, limit, windowMs) {
  const now = Date.now();
  const a = arr(key);
  prune(a, now - windowMs);
  return a.length >= limit;
}

/* Record one event for this key (used for failure counting). */
function record(key, windowMs) {
  const now = Date.now();
  const a = arr(key);
  prune(a, now - windowMs);
  a.push(now);
  gc(now);
}

/* Record-and-check (request-rate limiting). Returns { ok, retryAfter (s) }. */
function hit(key, limit, windowMs) {
  const now = Date.now();
  const a = arr(key);
  prune(a, now - windowMs);
  if (a.length >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((a[0] + windowMs - now) / 1000)) };
  }
  a.push(now);
  gc(now);
  return { ok: true, retryAfter: 0 };
}

function clear(key) { buckets.delete(key); }

module.exports = { clientIp, isOver, record, hit, clear };
