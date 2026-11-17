/**
 * feriados-engine.js — Motor de Feriados Nacionais, Estaduais e Municipais do Brasil,
 * Cálculo de Dias Úteis (Civil e Bancário ANBIMA), Prazos e Feriados Prolongados.
 *
 * 100% offline e determinístico: Páscoa calculada pelo algoritmo de Meeus/Jones/Butcher,
 * datas móveis derivadas (Carnaval, Sexta-feira Santa, Corpus Christi) e tabelas legais.
 *
 * @license MIT
 * @see https://github.com/clepta2/feriados-pro
 */

const DIA_MS = 86400000;
const NOMES_DIA_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Feriados nacionais fixos (Lei 662/1949, Lei 6.802/1980, Lei 10.607/2002, Lei 14.759/2023)
const NACIONAIS_FIXOS = [
  { mmdd: '01-01', nome: 'Confraternização Universal', lei: 'Lei 662/1949' },
  { mmdd: '04-21', nome: 'Tiradentes', lei: 'Lei 662/1949' },
  { mmdd: '05-01', nome: 'Dia do Trabalho', lei: 'Lei 662/1949' },
  { mmdd: '09-07', nome: 'Independência do Brasil', lei: 'Lei 662/1949' },
  { mmdd: '10-12', nome: 'Nossa Senhora Aparecida', lei: 'Lei 6.802/1980' },
  { mmdd: '11-02', nome: 'Finados', lei: 'Lei 662/1949' },
  { mmdd: '11-15', nome: 'Proclamação da República', lei: 'Lei 662/1949' },
  { mmdd: '11-20', nome: 'Dia Nacional de Zumbi e da Consciência Negra', lei: 'Lei 14.759/2023', desde: 2024 },
  { mmdd: '12-25', nome: 'Natal', lei: 'Lei 662/1949' }
];

// Feriados estaduais (datas magnas e leis estaduais vigentes)
export const FERIADOS_ESTADUAIS = {
  AC: [
    { mmdd: '01-23', nome: 'Dia do Evangélico' },
    { mmdd: '03-08', nome: 'Alusivo ao Dia Internacional da Mulher' },
    { mmdd: '06-15', nome: 'Aniversário do Estado do Acre' },
    { mmdd: '09-05', nome: 'Dia da Amazônia' },
    { mmdd: '11-17', nome: 'Assinatura do Tratado de Petrópolis' }
  ],
  AL: [
    { mmdd: '06-24', nome: 'São João' },
    { mmdd: '06-29', nome: 'São Pedro' },
    { mmdd: '09-16', nome: 'Emancipação Política de Alagoas' },
    { mmdd: '11-30', nome: 'Dia do Evangélico' }
  ],
  AP: [
    { mmdd: '03-19', nome: 'Dia de São José' },
    { mmdd: '07-25', nome: 'Dia de São Tiago' },
    { mmdd: '10-05', nome: 'Criação do Estado do Amapá' }
  ],
  AM: [
    { mmdd: '09-05', nome: 'Elevação do Amazonas à Categoria de Província' }
  ],
  BA: [
    { mmdd: '07-02', nome: 'Independência da Bahia' }
  ],
  CE: [
    { mmdd: '03-19', nome: 'Dia de São José' },
    { mmdd: '03-25', nome: 'Data Magna do Ceará (Abolição da Escravatura)' }
  ],
  DF: [
    { mmdd: '04-21', nome: 'Fundação de Brasília' },
    { mmdd: '11-30', nome: 'Dia do Evangélico' }
  ],
  ES: [],
  GO: [],
  MA: [
    { mmdd: '07-28', nome: 'Adesão do Maranhão à Independência do Brasil' }
  ],
  MT: [],
  MS: [
    { mmdd: '10-11', nome: 'Criação do Estado de Mato Grosso do Sul' }
  ],
  MG: [
    { mmdd: '04-21', nome: 'Data Magna de Minas Gerais' }
  ],
  PA: [
    { mmdd: '08-15', nome: 'Adesão do Grão-Pará à Independência do Brasil' }
  ],
  PB: [
    { mmdd: '08-05', nome: 'Fundação do Estado da Paraíba' }
  ],
  PR: [
    { mmdd: '12-19', nome: 'Emancipação Política do Paraná' }
  ],
  PE: [
    { mmdd: '03-06', nome: 'Data Magna de Pernambuco (Revolução de 1817)' },
    { mmdd: '06-24', nome: 'São João' }
  ],
  PI: [
    { mmdd: '03-13', nome: 'Dia da Batalha do Jenipapo' },
    { mmdd: '10-19', nome: 'Dia do Piauí' }
  ],
  RJ: [
    { mmdd: '04-23', nome: 'Dia de São Jorge' }
  ],
  RN: [
    { mmdd: '10-03', nome: 'Mártires de Cunhaú e Uruaçu' }
  ],
  RS: [
    { mmdd: '09-20', nome: 'Revolução Farroupilha' }
  ],
  RO: [
    { mmdd: '01-04', nome: 'Criação do Estado de Rondônia' },
    { mmdd: '06-18', nome: 'Dia do Evangélico' }
  ],
  RR: [
    { mmdd: '10-05', nome: 'Criação do Estado de Roraima' }
  ],
  SC: [
    { mmdd: '08-11', nome: 'Data Magna de Santa Catarina' },
    { mmdd: '11-25', nome: 'Dia de Santa Catarina de Alexandria' }
  ],
  SP: [
    { mmdd: '07-09', nome: 'Revolução Constitucionalista de 1932' }
  ],
  SE: [
    { mmdd: '07-08', nome: 'Emancipação Política de Sergipe' }
  ],
  TO: [
    { mmdd: '03-18', nome: 'Autonomia do Estado do Tocantins' },
    { mmdd: '09-08', nome: 'Nossa Senhora da Natividade' },
    { mmdd: '10-05', nome: 'Criação do Estado do Tocantins' }
  ]
};

// Feriados municipais das capitais (código IBGE). Datas móveis usam offset em dias a partir da Páscoa.
export const FERIADOS_MUNICIPAIS = {
  '3550308': { cidade: 'São Paulo', uf: 'SP', feriados: [
    { mmdd: '01-25', nome: 'Aniversário de São Paulo' },
    { pascoa: 60, nome: 'Corpus Christi' }
  ] },
  '3304557': { cidade: 'Rio de Janeiro', uf: 'RJ', feriados: [
    { mmdd: '01-20', nome: 'Dia de São Sebastião' }
  ] },
  '3106200': { cidade: 'Belo Horizonte', uf: 'MG', feriados: [
    { mmdd: '08-15', nome: 'Assunção de Nossa Senhora' },
    { mmdd: '12-08', nome: 'Imaculada Conceição' },
    { pascoa: 60, nome: 'Corpus Christi' }
  ] },
  '2927408': { cidade: 'Salvador', uf: 'BA', feriados: [
    { mmdd: '06-24', nome: 'São João' },
    { mmdd: '12-08', nome: 'Nossa Senhora da Conceição da Praia' }
  ] },
  '4106902': { cidade: 'Curitiba', uf: 'PR', feriados: [
    { mmdd: '09-08', nome: 'Nossa Senhora da Luz dos Pinhais' },
    { pascoa: 60, nome: 'Corpus Christi' }
  ] },
  '4314902': { cidade: 'Porto Alegre', uf: 'RS', feriados: [
    { mmdd: '02-02', nome: 'Nossa Senhora dos Navegantes' }
  ] },
  '2611606': { cidade: 'Recife', uf: 'PE', feriados: [
    { mmdd: '07-16', nome: 'Nossa Senhora do Carmo' },
    { mmdd: '12-08', nome: 'Nossa Senhora da Conceição' }
  ] },
  '2304400': { cidade: 'Fortaleza', uf: 'CE', feriados: [
    { mmdd: '08-15', nome: 'Nossa Senhora da Assunção' }
  ] },
  '1302603': { cidade: 'Manaus', uf: 'AM', feriados: [
    { mmdd: '10-24', nome: 'Aniversário de Manaus' },
    { mmdd: '12-08', nome: 'Nossa Senhora da Conceição' }
  ] },
  '5208707': { cidade: 'Goiânia', uf: 'GO', feriados: [
    { mmdd: '05-24', nome: 'Nossa Senhora Auxiliadora' },
    { mmdd: '10-24', nome: 'Aniversário de Goiânia' }
  ] },
  '4205407': { cidade: 'Florianópolis', uf: 'SC', feriados: [
    { mmdd: '03-23', nome: 'Aniversário de Florianópolis' }
  ] },
  '3205309': { cidade: 'Vitória', uf: 'ES', feriados: [
    { pascoa: 8, nome: 'Nossa Senhora da Penha' },
    { mmdd: '09-08', nome: 'Aniversário de Vitória' }
  ] },
  '2408102': { cidade: 'Natal', uf: 'RN', feriados: [
    { mmdd: '01-06', nome: 'Santos Reis' },
    { mmdd: '11-21', nome: 'Nossa Senhora da Apresentação' }
  ] },
  '1501402': { cidade: 'Belém', uf: 'PA', feriados: [
    { mmdd: '01-12', nome: 'Aniversário de Belém' },
    { mmdd: '12-08', nome: 'Nossa Senhora da Conceição' }
  ] }
};

// ─── Utilidades de data (sempre em UTC puro para evitar desvios de fuso) ───

function pad(n) { return String(n).padStart(2, '0'); }

export function toIso(dt) {
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function parseData(valor) {
  if (valor instanceof Date) return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));
  const s = String(valor || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

export function hojeBrasilia(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
  return parseData(partes);
}

function addDias(dt, n) { return new Date(dt.getTime() + n * DIA_MS); }

/** Domingo de Páscoa (algoritmo anônimo gregoriano de Meeus/Jones/Butcher). */
export function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function validarAno(ano) {
  const n = Number(ano);
  if (!Number.isInteger(n) || n < 1900 || n > 2199) {
    throw new RangeError('Ano inválido. Informe um ano entre 1900 e 2199.');
  }
  return n;
}

function normalizarUf(uf) {
  if (!uf) return null;
  const u = String(uf).trim().toUpperCase();
  if (!UFS.includes(u)) throw new RangeError(`UF inválida: "${uf}".`);
  return u;
}

function montarItem(dt, nome, tipo, abrangencia, extra = {}) {
  return {
    data: toIso(dt),
    diaSemana: NOMES_DIA_SEMANA[dt.getUTCDay()],
    nome,
    tipo,
    abrangencia,
    ...extra
  };
}

/**
 * Lista os feriados e pontos facultativos de um ano.
 * @param {number} ano
 * @param {{ uf?: string, ibge?: string, incluirFacultativos?: boolean }} [opcoes]
 */
export function listarFeriados(ano, opcoes = {}) {
  const y = validarAno(ano);
  let uf = normalizarUf(opcoes.uf);
  const ibge = opcoes.ibge ? String(opcoes.ibge).trim() : null;
  const municipio = ibge ? FERIADOS_MUNICIPAIS[ibge] : null;
  if (municipio && !uf) uf = municipio.uf;
  const incluirFacultativos = opcoes.incluirFacultativos !== false;

  const pascoa = calcularPascoa(y);
  const lista = [];

  for (const f of NACIONAIS_FIXOS) {
    if (f.desde && y < f.desde) continue;
    lista.push(montarItem(parseData(`${y}-${f.mmdd}`), f.nome, 'feriado', 'nacional', { lei: f.lei }));
  }
  lista.push(montarItem(addDias(pascoa, -2), 'Sexta-feira Santa (Paixão de Cristo)', 'feriado', 'nacional', { movel: true }));

  if (incluirFacultativos) {
    lista.push(montarItem(addDias(pascoa, -48), 'Carnaval (segunda-feira)', 'ponto_facultativo', 'nacional', { movel: true, bancario: true }));
    lista.push(montarItem(addDias(pascoa, -47), 'Carnaval (terça-feira)', 'ponto_facultativo', 'nacional', { movel: true, bancario: true }));
    lista.push(montarItem(addDias(pascoa, -46), 'Quarta-feira de Cinzas (até 14h)', 'ponto_facultativo', 'nacional', { movel: true }));
    lista.push(montarItem(pascoa, 'Páscoa', 'data_comemorativa', 'nacional', { movel: true }));
    lista.push(montarItem(addDias(pascoa, 60), 'Corpus Christi', 'ponto_facultativo', 'nacional', { movel: true, bancario: true }));
    lista.push(montarItem(parseData(`${y}-10-28`), 'Dia do Servidor Público', 'ponto_facultativo', 'federal'));
    lista.push(montarItem(parseData(`${y}-12-24`), 'Véspera de Natal (após 14h)', 'ponto_facultativo', 'nacional'));
    lista.push(montarItem(parseData(`${y}-12-31`), 'Véspera de Ano Novo (após 14h)', 'ponto_facultativo', 'nacional'));
  }

  if (uf) {
    for (const f of FERIADOS_ESTADUAIS[uf] || []) {
      lista.push(montarItem(parseData(`${y}-${f.mmdd}`), f.nome, 'feriado', 'estadual', { uf }));
    }
  }

  if (municipio) {
    for (const f of municipio.feriados) {
      const dt = f.pascoa !== undefined ? addDias(pascoa, f.pascoa) : parseData(`${y}-${f.mmdd}`);
      lista.push(montarItem(dt, f.nome, 'feriado', 'municipal', { ibge, cidade: municipio.cidade, uf: municipio.uf, movel: f.pascoa !== undefined || undefined }));
    }
  }

  lista.sort((a, b) => a.data.localeCompare(b.data) || prioridade(a) - prioridade(b));
  return lista;
}

function prioridade(item) {
  if (item.tipo === 'feriado') return { nacional: 0, estadual: 1, municipal: 2 }[item.abrangencia] ?? 3;
  return item.tipo === 'ponto_facultativo' ? 4 : 5;
}

const cacheAno = new Map();
function feriadosDoDia(dt, opcoes) {
  const chave = `${dt.getUTCFullYear()}|${opcoes.uf || ''}|${opcoes.ibge || ''}`;
  let mapa = cacheAno.get(chave);
  if (!mapa) {
    mapa = new Map();
    for (const f of listarFeriados(dt.getUTCFullYear(), { uf: opcoes.uf, ibge: opcoes.ibge })) {
      if (!mapa.has(f.data)) mapa.set(f.data, []);
      mapa.get(f.data).push(f);
    }
    if (cacheAno.size > 500) cacheAno.clear();
    cacheAno.set(chave, mapa);
  }
  return mapa.get(toIso(dt)) || [];
}

/**
 * Modo "civil": não úteis = sábado, domingo e feriados (nacionais/estaduais/municipais conforme uf/ibge).
 * Modo "bancario": calendário ANBIMA (feriados nacionais + Carnaval seg/ter + Corpus Christi), ignora uf/ibge.
 */
export function ehDiaUtil(data, opcoes = {}) {
  const dt = parseData(data);
  if (!dt) throw new RangeError('Data inválida. Use AAAA-MM-DD ou DD/MM/AAAA.');
  const modo = opcoes.modo === 'bancario' ? 'bancario' : 'civil';
  const dow = dt.getUTCDay();
  const fimDeSemana = dow === 0 || (dow === 6 && !opcoes.sabadoUtil);
  const efOpcoes = modo === 'bancario' ? {} : { uf: normalizarUf(opcoes.uf), ibge: opcoes.ibge };
  const doDia = feriadosDoDia(dt, efOpcoes);
  const bloqueantes = doDia.filter(f => f.tipo === 'feriado' || (modo === 'bancario' && f.bancario));
  return { util: !fimDeSemana && bloqueantes.length === 0, fimDeSemana, feriados: bloqueantes, outros: doDia.filter(f => !bloqueantes.includes(f)) };
}

export function consultarData(data, opcoes = {}) {
  const dt = parseData(data);
  if (!dt) throw new RangeError('Data inválida. Use AAAA-MM-DD ou DD/MM/AAAA.');
  const r = ehDiaUtil(dt, opcoes);
  return {
    ok: true,
    data: toIso(dt),
    diaSemana: NOMES_DIA_SEMANA[dt.getUTCDay()],
    diaUtil: r.util,
    fimDeSemana: r.fimDeSemana,
    feriado: r.feriados.length > 0,
    feriados: r.feriados,
    pontosFacultativosEDatas: r.outros,
    proximoDiaUtil: r.util ? toIso(dt) : somarDiasUteis(dt, 1, opcoes).dataFinal,
    modo: opcoes.modo === 'bancario' ? 'bancario' : 'civil',
    uf: opcoes.uf ? String(opcoes.uf).toUpperCase() : null,
    ibge: opcoes.ibge || null
  };
}

/** Conta dias úteis no intervalo [inicio, fim] (inclusivo nas duas pontas). */
export function contarDiasUteis(inicio, fim, opcoes = {}) {
  let a = parseData(inicio);
  let b = parseData(fim);
  if (!a || !b) throw new RangeError('Datas inválidas. Use AAAA-MM-DD ou DD/MM/AAAA.');
  let sinal = 1;
  if (a > b) { [a, b] = [b, a]; sinal = -1; }
  const totalCorridos = Math.round((b - a) / DIA_MS) + 1;
  if (totalCorridos > 366 * 30) throw new RangeError('Intervalo máximo de 30 anos.');

  let uteis = 0;
  let fds = 0;
  const feriadosNoPeriodo = [];
  for (let dt = a; dt <= b; dt = addDias(dt, 1)) {
    const r = ehDiaUtil(dt, opcoes);
    if (r.util) uteis++;
    else if (r.fimDeSemana) fds++;
    if (r.feriados.length && !r.fimDeSemana) feriadosNoPeriodo.push(...r.feriados);
  }
  return {
    ok: true,
    inicio: toIso(a),
    fim: toIso(b),
    diasCorridos: totalCorridos * sinal,
    diasUteis: uteis * sinal,
    fimDeSemana: fds,
    feriadosEmDiasDeSemana: feriadosNoPeriodo.length,
    feriados: feriadosNoPeriodo,
    modo: opcoes.modo === 'bancario' ? 'bancario' : 'civil'
  };
}

/** Soma (ou subtrai, se negativo) N dias úteis a partir de uma data, sem contar a própria data. */
export function somarDiasUteis(data, dias, opcoes = {}) {
  const dt0 = parseData(data);
  if (!dt0) throw new RangeError('Data inválida. Use AAAA-MM-DD ou DD/MM/AAAA.');
  const n = Number(dias);
  if (!Number.isInteger(n) || Math.abs(n) > 5000) throw new RangeError('Quantidade de dias deve ser inteira entre -5000 e 5000.');
  const passo = n >= 0 ? 1 : -1;
  let restante = Math.abs(n);
  let dt = dt0;
  const pulados = [];
  while (restante > 0) {
    dt = addDias(dt, passo);
    const r = ehDiaUtil(dt, opcoes);
    if (r.util) restante--;
    else if (r.feriados.length) pulados.push(...r.feriados);
  }
  return {
    ok: true,
    dataInicial: toIso(dt0),
    diasUteis: n,
    dataFinal: toIso(dt),
    diaSemanaFinal: NOMES_DIA_SEMANA[dt.getUTCDay()],
    diasCorridos: Math.round((dt - dt0) / DIA_MS),
    feriadosPulados: pulados,
    modo: opcoes.modo === 'bancario' ? 'bancario' : 'civil'
  };
}

export function proximosFeriados(opcoes = {}) {
  const base = opcoes.aPartirDe ? parseData(opcoes.aPartirDe) : hojeBrasilia();
  if (!base) throw new RangeError('Data inválida.');
  const qtd = Math.min(Math.max(parseInt(opcoes.quantidade, 10) || 5, 1), 50);
  const iso = toIso(base);
  const res = [];
  for (let y = base.getUTCFullYear(); res.length < qtd && y <= base.getUTCFullYear() + 3; y++) {
    for (const f of listarFeriados(y, { uf: opcoes.uf, ibge: opcoes.ibge, incluirFacultativos: !!opcoes.incluirFacultativos })) {
      if (f.data < iso || f.tipo === 'data_comemorativa') continue;
      res.push({ ...f, diasAte: Math.round((parseData(f.data) - base) / DIA_MS) });
      if (res.length >= qtd) break;
    }
  }
  return { ok: true, aPartirDe: iso, total: res.length, feriados: res };
}

/** Identifica feriados prolongados: feriados em sexta/segunda (fim de semana de 3 dias) e terça/quinta (possível ponte). */
export function feriadosProlongados(ano, opcoes = {}) {
  const lista = listarFeriados(ano, { ...opcoes, incluirFacultativos: false }).filter(f => f.tipo === 'feriado');
  const vistos = new Set();
  const res = [];
  for (const f of lista) {
    if (vistos.has(f.data)) continue;
    vistos.add(f.data);
    const dt = parseData(f.data);
    const dow = dt.getUTCDay();
    let tipo = null, inicio, fim, diaPonte = null;
    if (dow === 5) { tipo = 'FIM_DE_SEMANA_PROLONGADO'; inicio = dt; fim = addDias(dt, 2); }
    else if (dow === 1) { tipo = 'FIM_DE_SEMANA_PROLONGADO'; inicio = addDias(dt, -2); fim = dt; }
    else if (dow === 4) { tipo = 'PONTE_POSSIVEL'; inicio = dt; fim = addDias(dt, 3); diaPonte = addDias(dt, 1); }
    else if (dow === 2) { tipo = 'PONTE_POSSIVEL'; inicio = addDias(dt, -3); fim = dt; diaPonte = addDias(dt, -1); }
    if (!tipo) continue;
    res.push({
      feriado: f.nome,
      data: f.data,
      diaSemana: f.diaSemana,
      abrangencia: f.abrangencia,
      tipo,
      diaPonte: diaPonte ? toIso(diaPonte) : null,
      descanso: { inicio: toIso(inicio), fim: toIso(fim), dias: Math.round((fim - inicio) / DIA_MS) + 1 }
    });
  }
  return { ok: true, ano: Number(ano), total: res.length, prolongados: res };
}

function escaparIcs(s) { return String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n'); }

/** Gera calendário iCalendar (RFC 5545) para importar no Google Agenda / Outlook / Apple. */
export function gerarIcs(ano, opcoes = {}) {
  const lista = listarFeriados(ano, opcoes).filter(f => f.tipo !== 'data_comemorativa');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ponte API//Feriados Pro//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escaparIcs(`Feriados ${ano}${opcoes.uf ? ' ' + String(opcoes.uf).toUpperCase() : ''} • Ponte API`)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo'
  ];
  for (const f of lista) {
    const ini = f.data.replace(/-/g, '');
    const fim = toIso(addDias(parseData(f.data), 1)).replace(/-/g, '');
    linhas.push(
      'BEGIN:VEVENT',
      `UID:${ini}-${f.abrangencia}-${f.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@feriados.ponte`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ini}`,
      `DTEND;VALUE=DATE:${fim}`,
      `SUMMARY:${escaparIcs(f.nome)}`,
      `DESCRIPTION:${escaparIcs(`${f.tipo === 'feriado' ? 'Feriado' : 'Ponto facultativo'} ${f.abrangencia}`)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  }
  linhas.push('END:VCALENDAR');
  return linhas.join('\r\n') + '\r\n';
}

export function listarCobertura() {
  return {
    ok: true,
    nacionais: NACIONAIS_FIXOS.length + 1,
    estados: UFS.map(uf => ({ uf, feriadosEstaduais: (FERIADOS_ESTADUAIS[uf] || []).map(f => ({ data: f.mmdd.split('-').reverse().join('/'), nome: f.nome })) })),
    capitais: Object.entries(FERIADOS_MUNICIPAIS).map(([ibge, m]) => ({ ibge, cidade: m.cidade, uf: m.uf, feriadosMunicipais: m.feriados.map(f => f.nome) }))
  };
}

export const FeriadosEngine = {
  UFS,
  FERIADOS_ESTADUAIS,
  FERIADOS_MUNICIPAIS,
  calcularPascoa,
  listarFeriados,
  ehDiaUtil,
  consultarData,
  contarDiasUteis,
  somarDiasUteis,
  proximosFeriados,
  feriadosProlongados,
  gerarIcs,
  listarCobertura,
  hojeBrasilia,
  parseData,
  toIso
};

export default FeriadosEngine;
