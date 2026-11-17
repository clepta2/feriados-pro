# 📅 Feriados & Dias Úteis Pro API • Calendário Nacional, Estadual, Municipal e Bancário

> **API e SDK oficial na borda Cloudflare Anycast (<2ms) para feriados nacionais, estaduais e municipais do Brasil, contagem de dias úteis (civil e bancário ANBIMA), cálculo de prazos e vencimentos, feriados prolongados e calendário `.ics`.**

[![Status](https://img.shields.io/badge/Status-Produção%20Tier--1-success.svg)](#)
[![Infra](https://img.shields.io/badge/Infra-Cloudflare%20Workers%20Anycast-orange.svg)](#)
[![Offline](https://img.shields.io/badge/Dados-100%25%20Offline-blue.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 🧭 Visão Geral

1. **Feriados nacionais** conforme a Lei 662/1949, a Lei 6.802/1980 e a Lei 14.759/2023 (Consciência Negra, a partir de 2024).
2. **Datas móveis** (Carnaval, Sexta-feira Santa, Páscoa e Corpus Christi) calculadas pelo algoritmo de Meeus/Jones/Butcher, válidas de 1900 a 2199.
3. **Feriados estaduais** das 27 UFs e **municipais** das principais capitais (por código IBGE).
4. **Dia útil civil ou bancário**: o modo `bancario` segue o calendário ANBIMA, que inclui Carnaval e Corpus Christi.
5. **Prazos e vencimentos**: soma ou subtrai N dias úteis e lista os feriados pulados.
6. **Feriados prolongados**: identifica fins de semana de 3 dias e "pontes" possíveis.
7. **Calendário iCalendar (RFC 5545)** para assinar no Google Agenda, Outlook ou Apple.

> ⚠️ Feriados municipais fora das capitais cadastradas e decretos extraordinários não são cobertos. Use `GET /api/feriados/cobertura` para ver a base.

---

## 📦 Planos

| Plano | Limite RPM | Cota Diária | Prefixo de Chave |
|---|---|---|---|
| **Free / Sandbox** | 30 RPM | 500 req/dia | (sem chave) |
| **Starter** | 60 RPM | 86.400 req/dia | `fer_start_` / `pnt_start_` |
| **Pro** | 300 RPM | 250.000 req/dia | `fer_pro_` / `pnt_pro_` |
| **Business** | 1.200 RPM | 1.000.000 req/dia | `fer_biz_` / `pnt_biz_` |
| **Master Admin** | 3.000 RPM | Ilimitada | `fer_master_` / `pnt_master_` |

---

## 🚀 Endpoints REST

Parâmetros comuns: `uf` (ex.: `SP`), `ibge` (ex.: `3550308`), `modo` (`civil` | `bancario`).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/feriados/:ano` | Lista feriados e pontos facultativos (`facultativos=false` para omitir) |
| GET | `/api/feriados/hoje` | Diz se hoje (horário de Brasília) é dia útil |
| GET | `/api/feriados/data/:data` | Consulta uma data (`AAAA-MM-DD` ou `DD-MM-AAAA`) |
| GET | `/api/feriados/proximos?quantidade=5` | Próximos feriados |
| GET | `/api/feriados/dias-uteis?inicio=&fim=` | Conta dias úteis no intervalo (inclusivo) |
| GET/POST | `/api/feriados/prazo?data=&dias=` | Soma N dias úteis (negativo para subtrair) |
| GET | `/api/feriados/prolongados/:ano` | Feriados prolongados e pontes |
| GET | `/api/feriados/:ano/calendario.ics` | Calendário iCalendar |
| GET | `/api/feriados/cobertura` | UFs e municípios cobertos |

```bash
curl "https://feriados-pro-api.maputo2.workers.dev/api/feriados/prazo?data=2026-11-18&dias=5&uf=SP"
```

---

## 💻 SDK

```javascript
import { FeriadosPro } from 'feriados-pro';

FeriadosPro.configure({ apiKey: process.env.PONTE_API_KEY });

const venc = await FeriadosPro.prazo('2026-11-18', 5, { modo: 'bancario' });
console.log(venc.dataFinal); // 2026-11-26

const sp = await FeriadosPro.listar(2026, { ibge: '3550308' });
```

---

## 🧪 Testes

```bash
npm test
```

## 📄 Licença

MIT — consulte [LICENSE](LICENSE).
