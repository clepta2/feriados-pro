/**
 * feriados-pro.js
 * SDK Oficial para Node.js, Browser e Edge Runtimes
 * Feriados & Dias Úteis Pro API — Calendário Nacional, Estadual, Municipal e Bancário
 *
 * @license MIT
 * @see https://github.com/clepta2/feriados-pro
 */

export class FeriadosPro {
  static baseUrl = 'https://feriados-pro-api.maputo2.workers.dev';
  static apiKey = '';

  /** @param {{ apiKey?: string, baseUrl?: string }} config */
  static configure(config = {}) {
    if (config.baseUrl) this.baseUrl = config.baseUrl.replace(/\/$/, '');
    if (config.apiKey) this.apiKey = config.apiKey;
  }

  static _headers() {
    const h = { 'Accept': 'application/json', 'User-Agent': 'FeriadosPro-SDK/1.0.0' };
    if (this.apiKey) {
      h['Authorization'] = `Bearer ${this.apiKey}`;
      h['x-api-key'] = this.apiKey;
    }
    return h;
  }

  static async _get(path, params = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
    const resp = await fetch(`${this.baseUrl}${path}${qs ? '?' + qs : ''}`, { headers: this._headers() });
    if (!resp.ok) throw new Error(`FeriadosPro: HTTP ${resp.status} em ${path}`);
    return resp.json();
  }

  /** Lista feriados do ano (nacionais + estaduais da UF + municipais do IBGE). */
  static listar(ano, { uf, ibge, facultativos } = {}) {
    return this._get(`/api/feriados/${ano}`, { uf, ibge, facultativos });
  }

  /** Verifica se uma data é dia útil (modo 'civil' ou 'bancario'). */
  static consultarData(data, { uf, ibge, modo } = {}) {
    return this._get(`/api/feriados/data/${encodeURIComponent(data)}`, { uf, ibge, modo });
  }

  static hoje(opcoes = {}) {
    return this._get('/api/feriados/hoje', opcoes);
  }

  static proximos({ uf, ibge, quantidade = 5 } = {}) {
    return this._get('/api/feriados/proximos', { uf, ibge, quantidade });
  }

  static contarDiasUteis(inicio, fim, { uf, ibge, modo } = {}) {
    return this._get('/api/feriados/dias-uteis', { inicio, fim, uf, ibge, modo });
  }

  /** Calcula o vencimento/prazo somando N dias úteis a uma data. */
  static prazo(data, dias, { uf, ibge, modo } = {}) {
    return this._get('/api/feriados/prazo', { data, dias, uf, ibge, modo });
  }

  static prolongados(ano, { uf, ibge } = {}) {
    return this._get(`/api/feriados/prolongados/${ano}`, { uf, ibge });
  }

  /** URL pública do calendário .ics (assinável no Google Agenda / Outlook). */
  static urlCalendarioIcs(ano, { uf, ibge } = {}) {
    const qs = new URLSearchParams(Object.entries({ uf, ibge }).filter(([, v]) => v)).toString();
    return `${this.baseUrl}/api/feriados/${ano}/calendario.ics${qs ? '?' + qs : ''}`;
  }
}

export default FeriadosPro;
