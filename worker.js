/**
 * worker.js — Cloudflare Worker Anycast para Feriados & Dias Úteis Pro API
 *
 * @license MIT
 * @see https://github.com/clepta2/feriados-pro
 */

import {
  listarFeriados,
  consultarData,
  contarDiasUteis,
  somarDiasUteis,
  proximosFeriados,
  feriadosProlongados,
  gerarIcs,
  listarCobertura,
  hojeBrasilia,
  toIso
} from './feriados-engine.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Ponte-Version': '3.0.0'
};

const PLANOS_CONFIG = {
  free: { nome: 'Free / Sandbox', rpm: 30, cotaDiaria: 500 },
  starter: { nome: 'Starter 86.400 (1 req/s)', rpm: 60, cotaDiaria: 86400 },
  pro: { nome: 'Pro (5 req/s)', rpm: 300, cotaDiaria: 250000 },
  business: { nome: 'Business (20 req/s)', rpm: 1200, cotaDiaria: 1000000 },
  master: { nome: 'Master Admin (Bypass)', rpm: 3000, cotaDiaria: Infinity }
};

const PREFIXOS = [
  ['master', ['fer_master_', 'pnt_master_']],
  ['business', ['fer_biz_', 'pnt_biz_']],
  ['pro', ['fer_pro_', 'pnt_pro_']],
  ['starter', ['fer_start_', 'pnt_start_']]
];

const minuteBuckets = new Map();
const dailyBuckets = new Map();
const BOOT_TIME = Date.now();

function resolverPlano(request, url) {
  const auth = request.headers.get('Authorization') || '';
  const token = (auth.startsWith('Bearer ') ? auth.slice(7) : (request.headers.get('x-api-key') || url.searchParams.get('key') || '')).trim();
  if (!token) {
    const ip = request.headers.get('cf-connecting-ip') || 'anonymous_ip';
    return { plano: 'free', keyId: `ip_${ip}`, config: PLANOS_CONFIG.free };
  }
  for (const [plano, prefixos] of PREFIXOS) {
    if (prefixos.some(p => token.startsWith(p))) return { plano, keyId: token, config: PLANOS_CONFIG[plano] };
  }
  return { plano: 'free', keyId: token, config: PLANOS_CONFIG.free };
}

function aplicarRateLimit(keyId, config) {
  const now = Date.now();
  let d = dailyBuckets.get(keyId);
  if (!d || now > d.resetAt) { d = { count: 0, resetAt: now + 86400000 }; dailyBuckets.set(keyId, d); }
  let m = minuteBuckets.get(keyId);
  if (!m || now > m.resetAt) { m = { count: 0, resetAt: now + 60000 }; minuteBuckets.set(keyId, m); }
  const isMaster = config.cotaDiaria === Infinity;
  if (!isMaster && d.count >= config.cotaDiaria) {
    return { ok: false, error: 'DAILY_LIMIT_EXCEEDED', message: `Cota diária excedida para o plano ${config.nome}.`, resetEmSegundos: Math.ceil((d.resetAt - now) / 1000) };
  }
  if (!isMaster && m.count >= config.rpm) {
    return { ok: false, error: 'RATE_LIMIT_EXCEEDED', message: `Limite de ${config.rpm} RPM excedido.`, resetEmSegundos: Math.ceil((m.resetAt - now) / 1000) };
  }
  d.count++; m.count++;
  return { ok: true, rpmRestante: Math.max(0, config.rpm - m.count) };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...extra }
  });
}

async function lerParametros(request, url) {
  const p = Object.fromEntries(url.searchParams.entries());
  if (request.method === 'POST') {
    try { Object.assign(p, await request.json()); } catch (_) { /* corpo vazio ou inválido: usa só a query */ }
  }
  return p;
}

function opcoesDe(p) {
  return {
    uf: p.uf || undefined,
    ibge: p.ibge || p.municipio || undefined,
    modo: p.modo === 'bancario' || p.bancario === 'true' || p.bancario === true ? 'bancario' : 'civil',
    sabadoUtil: p.sabadoUtil === 'true' || p.sabadoUtil === true
  };
}

export default {
  async fetch(request) {
    const t0 = performance.now();
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    const { plano, keyId, config } = resolverPlano(request, url);
    const rate = aplicarRateLimit(keyId, config);
    if (!rate.ok) return json(rate, 429, { 'Retry-After': String(rate.resetEmSegundos || 60) });

    const rh = {
      'x-feriados-plan': plano,
      'x-feriados-ratelimit-limit': String(config.rpm),
      'x-feriados-ratelimit-remaining': String(rate.rpmRestante),
      'x-feriados-edge-latency': `${Math.max(1, Math.round(performance.now() - t0))}ms`
    };

    try {
      const p = await lerParametros(request, url);
      const op = opcoesDe(p);

      if (path === '/' || path === '/health' || path === '/status' || path === '/api/feriados/health') {
        return json({
          ok: true,
          servico: 'Feriados & Dias Úteis Pro API',
          versao: '1.0.0',
          borda: 'Cloudflare Workers Anycast (<2ms)',
          uptimeSegundos: Math.floor((Date.now() - BOOT_TIME) / 1000),
          planoAtivo: config.nome,
          hojeBrasilia: toIso(hojeBrasilia()),
          rotas: [
            'GET /api/feriados/:ano?uf=SP&ibge=3550308',
            'GET /api/feriados/hoje',
            'GET /api/feriados/data/:data',
            'GET /api/feriados/proximos?uf=SP&quantidade=5',
            'GET /api/feriados/dias-uteis?inicio=2026-01-01&fim=2026-12-31&uf=SP',
            'GET|POST /api/feriados/prazo?data=2026-11-17&dias=15&modo=bancario',
            'GET /api/feriados/prolongados/:ano',
            'GET /api/feriados/:ano/calendario.ics',
            'GET /api/feriados/cobertura'
          ]
        }, 200, rh);
      }

      if (path === '/api/feriados/cobertura') return json(listarCobertura(), 200, rh);

      if (path === '/api/feriados/hoje') return json(consultarData(hojeBrasilia(), op), 200, rh);

      const mData = path.match(/^\/api\/feriados\/(?:data|dia-util)\/([0-9\-]+)$/i);
      if (mData || path === '/api/feriados/data' || path === '/api/feriados/dia-util') {
        const bruto = decodeURIComponent(mData ? mData[1] : (p.data || ''));
        const data = /^\d{2}-\d{2}-\d{4}$/.test(bruto) ? bruto.split('-').join('/') : bruto;
        return json(consultarData(data || hojeBrasilia(), op), 200, rh);
      }

      if (path === '/api/feriados/proximos') {
        return json(proximosFeriados({ ...op, quantidade: p.quantidade || p.qtd, aPartirDe: p.aPartirDe || p.data, incluirFacultativos: p.facultativos === 'true' }), 200, rh);
      }

      if (path === '/api/feriados/dias-uteis' || path === '/api/feriados/contar') {
        if (!p.inicio || !p.fim) return json({ ok: false, erro: 'PARAMETROS_OBRIGATORIOS', mensagem: 'Informe "inicio" e "fim" (AAAA-MM-DD).' }, 400, rh);
        return json(contarDiasUteis(p.inicio, p.fim, op), 200, rh);
      }

      if (path === '/api/feriados/prazo' || path === '/api/feriados/somar') {
        if (p.dias === undefined) return json({ ok: false, erro: 'PARAMETROS_OBRIGATORIOS', mensagem: 'Informe "dias" (inteiro) e opcionalmente "data".' }, 400, rh);
        return json(somarDiasUteis(p.data || hojeBrasilia(), parseInt(p.dias, 10), op), 200, rh);
      }

      const mProl = path.match(/^\/api\/feriados\/prolongados(?:\/(\d{4}))?$/i);
      if (mProl) return json(feriadosProlongados(Number(mProl[1] || p.ano || hojeBrasilia().getUTCFullYear()), op), 200, rh);

      const mIcs = path.match(/^\/api\/feriados\/(\d{4})\/calendario\.ics$/i);
      if (mIcs) {
        return new Response(gerarIcs(Number(mIcs[1]), op), {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="feriados-${mIcs[1]}${op.uf ? '-' + op.uf.toLowerCase() : ''}.ics"`,
            'Cache-Control': 'public, max-age=86400',
            ...CORS_HEADERS,
            ...rh
          }
        });
      }

      const mAno = path.match(/^\/api\/feriados(?:\/(\d{4}))?$/i);
      if (mAno) {
        const ano = Number(mAno[1] || p.ano || hojeBrasilia().getUTCFullYear());
        const feriados = listarFeriados(ano, { uf: op.uf, ibge: op.ibge, incluirFacultativos: p.facultativos !== 'false' });
        return json({
          ok: true,
          ano,
          uf: op.uf ? op.uf.toUpperCase() : null,
          ibge: op.ibge || null,
          total: feriados.length,
          totalFeriados: feriados.filter(f => f.tipo === 'feriado').length,
          feriados
        }, 200, { ...rh, 'Cache-Control': 'public, max-age=3600' });
      }

      return json({ ok: false, erro: 'ROTA_NAO_ENCONTRADA', mensagem: `Rota "${path}" não existe. Consulte GET /health.` }, 404, rh);
    } catch (e) {
      if (e instanceof RangeError) return json({ ok: false, erro: 'PARAMETRO_INVALIDO', mensagem: e.message }, 400, rh);
      return json({ ok: false, erro: 'ERRO_INTERNO', mensagem: 'Falha inesperada ao processar a requisição.' }, 500, rh);
    }
  }
};
