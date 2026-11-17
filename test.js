import assert from 'node:assert/strict';
import {
  calcularPascoa,
  listarFeriados,
  consultarData,
  contarDiasUteis,
  somarDiasUteis,
  proximosFeriados,
  feriadosProlongados,
  gerarIcs,
  toIso
} from './feriados-engine.js';
import worker from './worker.js';

console.log('🧪 Iniciando bateria de testes do Feriados & Dias Úteis Pro...');

let pass = 0;
async function t(nome, fn) {
  await fn();
  pass++;
  console.log('  ✅ ' + nome);
}

const call = async (path, init) => {
  const res = await worker.fetch(new Request('https://api.test' + path, init));
  const ct = res.headers.get('Content-Type') || '';
  return { res, body: ct.includes('json') ? await res.json() : await res.text() };
};

await t('Páscoa correta em anos de referência', () => {
  assert.equal(toIso(calcularPascoa(2024)), '2024-03-31');
  assert.equal(toIso(calcularPascoa(2025)), '2025-04-20');
  assert.equal(toIso(calcularPascoa(2026)), '2026-04-05');
  assert.equal(toIso(calcularPascoa(2027)), '2027-03-28');
  assert.equal(toIso(calcularPascoa(2038)), '2038-04-25');
});

await t('Datas móveis de 2026 (Carnaval, Sexta Santa, Corpus Christi)', () => {
  const f = listarFeriados(2026);
  const por = nome => f.find(x => x.nome.startsWith(nome))?.data;
  assert.equal(por('Carnaval (terça'), '2026-02-17');
  assert.equal(por('Sexta-feira Santa'), '2026-04-03');
  assert.equal(por('Corpus Christi'), '2026-06-04');
});

await t('Consciência Negra nacional só a partir de 2024', () => {
  assert.ok(listarFeriados(2024, { incluirFacultativos: false }).some(f => f.data === '2024-11-20'));
  assert.ok(!listarFeriados(2023, { incluirFacultativos: false }).some(f => f.data === '2023-11-20'));
});

await t('10 feriados nacionais (sem facultativos) em 2026', () => {
  const nac = listarFeriados(2026, { incluirFacultativos: false });
  assert.equal(nac.length, 10);
  assert.ok(nac.every(f => f.tipo === 'feriado' && f.abrangencia === 'nacional'));
});

await t('Feriado estadual SP (9 de julho) e municipal SP (25 de janeiro)', () => {
  const f = listarFeriados(2026, { ibge: '3550308' });
  assert.ok(f.some(x => x.data === '2026-07-09' && x.abrangencia === 'estadual'));
  assert.ok(f.some(x => x.data === '2026-01-25' && x.abrangencia === 'municipal'));
});

await t('Feriados estaduais e municipais saem marcados como não verificados, com aviso na API', async () => {
  const f = listarFeriados(2026, { ibge: '3550308' });
  assert.ok(f.filter(x => x.abrangencia !== 'nacional' && x.tipo === 'feriado').every(x => x.verificado === false));
  assert.ok(f.filter(x => x.abrangencia === 'nacional').every(x => x.verificado === undefined));
  const comEstadual = (await call('/api/feriados/2026?uf=SP')).body;
  assert.ok(comEstadual.aviso && /NÃO foram conferidos/.test(comEstadual.aviso));
  assert.equal((await call('/api/feriados/2026')).body.aviso, undefined);
  assert.ok((await call('/api/feriados/cobertura')).body.aviso);
});

await t('Dia útil civil x bancário (Carnaval)', () => {
  assert.equal(consultarData('2026-02-16').diaUtil, true);
  assert.equal(consultarData('2026-02-16', { modo: 'bancario' }).diaUtil, false);
  assert.equal(consultarData('2026-04-03').diaUtil, false);
  assert.equal(consultarData('2026-11-21').fimDeSemana, true);
});

await t('Contagem de dias úteis em novembro/2026 (nacional)', () => {
  const r = contarDiasUteis('2026-11-01', '2026-11-30');
  // 21 dias de semana - 02/11 (seg) - 20/11 (sex); 15/11 cai no domingo
  assert.equal(r.diasUteis, 19);
  assert.equal(r.diasCorridos, 30);
});

await t('Contagem com intervalo invertido retorna negativo', () => {
  assert.equal(contarDiasUteis('2026-11-30', '2026-11-01').diasUteis, -19);
});

await t('Prazo de 5 dias úteis pulando feriados', () => {
  const r = somarDiasUteis('2026-11-18', 5);
  // 19, (20 feriado), 23, 24, 25, 26
  assert.equal(r.dataFinal, '2026-11-26');
  assert.equal(r.feriadosPulados.length, 1);
  assert.equal(somarDiasUteis('2026-11-26', -5).dataFinal, '2026-11-18');
});

await t('Próximos feriados a partir de data fixa', () => {
  const r = proximosFeriados({ aPartirDe: '2026-11-17', quantidade: 3 });
  assert.deepEqual(r.feriados.map(f => f.data), ['2026-11-20', '2026-12-25', '2027-01-01']);
  assert.equal(r.feriados[0].diasAte, 3);
});

await t('Feriados prolongados identifica ponte e fim de semana longo', () => {
  const r = feriadosProlongados(2026);
  assert.ok(r.prolongados.some(p => p.data === '2026-11-20' && p.tipo === 'FIM_DE_SEMANA_PROLONGADO' && p.descanso.dias === 3));
  assert.ok(r.prolongados.some(p => p.data === '2026-06-04') === false, 'Corpus Christi não é feriado nacional');
});

await t('Calendário ICS RFC 5545 válido', () => {
  const ics = gerarIcs(2026, { uf: 'SP' });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260709'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
});

await t('Validação de entradas inválidas', () => {
  assert.throws(() => consultarData('2026-02-30'), RangeError);
  assert.throws(() => listarFeriados(2026, { uf: 'XX' }), RangeError);
  assert.throws(() => listarFeriados(1500), RangeError);
});

await t('HTTP /health', async () => {
  const { res, body } = await call('/health');
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
});

await t('HTTP /api/feriados/2026?uf=RJ', async () => {
  const { res, body } = await call('/api/feriados/2026?uf=RJ');
  assert.equal(res.status, 200);
  assert.ok(body.feriados.some(f => f.nome === 'Dia de São Jorge'));
});

await t('HTTP /api/feriados/data/20-11-2026', async () => {
  const { body } = await call('/api/feriados/data/20-11-2026');
  assert.equal(body.feriado, true);
  assert.equal(body.proximoDiaUtil, '2026-11-23');
});

await t('HTTP POST /api/feriados/prazo modo bancário', async () => {
  const { body } = await call('/api/feriados/prazo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: '2026-02-13', dias: 1, modo: 'bancario' })
  });
  assert.equal(body.dataFinal, '2026-02-18');
});

await t('HTTP .ics com Content-Type text/calendar', async () => {
  const { res, body } = await call('/api/feriados/2026/calendario.ics?uf=SP');
  assert.ok(res.headers.get('Content-Type').startsWith('text/calendar'));
  assert.ok(body.includes('Revolução Constitucionalista'));
});

await t('HTTP 400 para parâmetro inválido e 404 para rota inexistente', async () => {
  assert.equal((await call('/api/feriados/2026?uf=ZZ')).res.status, 400);
  assert.equal((await call('/api/feriados/dias-uteis')).res.status, 400);
  assert.equal((await call('/api/nada')).res.status, 404);
});

console.log(`\n🎉 Todos os ${pass} testes do Feriados Pro passaram!`);
