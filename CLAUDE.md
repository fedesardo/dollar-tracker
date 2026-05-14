# CLAUDE.md

Este archivo es el contexto operativo para cualquier agente (Claude Code u otro) que abra una sesión nueva en este proyecto. Leelo entero antes de tocar nada.

---

## Qué es esto

**finanzas** (a.k.a. dollar-tracker) — herramienta financiera personal **para una pareja específica: Fede Sardo y Florencia Evans**. NO es una app multi-tenant ni un SaaS. Whitelist de exactamente 2 emails: `fedesardo@gmail.com` y `florenciaevans@gmail.com`.

### Contexto de negocio

- **Flor cobra USD ~2.200/mes el día 20** (o el día hábil cercano si cae fin de semana). Sueldo fijo en USD.
- **Fede compra USD con pesos** al blue cuando tiene oportunidad.
- Sus dólares viven en 3 bolsillos:
  - **Wise Flor** (virtual): donde le entra el sueldo
  - **Santander Fede** (virtual)
  - **Físicos** (physical): billetes en mano
- Existe el concepto de **préstamos otorgados** — plata que prestaron a alguien y van a cobrar después (parcial o total).
- Cuando Flor saca billetes de Wise, paga **comisión a una financiera** (2-3%). Esa comisión es plata perdida (no va a ningún wallet, se destruye).

### URLs

- **Producción:** https://finanzas.fedesardo.com (Vercel + Neon + Cloudflare DNS)
- **Repo:** github.com/fedesardo/dollar-tracker
- **Local dev:** http://localhost:3003

---

## Stack técnico

| Cosa | Qué |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript estricto (`noEmit` siempre debe pasar; **no** se permite `any` explícito) |
| DB | PostgreSQL — Neon en producción, Postgres en Docker para local (puerto 5436) |
| ORM | Drizzle |
| Auth | Auth.js v5 (NextAuth) + Google OAuth + whitelist por email |
| UI | Tailwind + shadcn/ui-style components (componentes propios) — **dark mode exclusivo** |
| Charts | Recharts |
| Animaciones | framer-motion |
| Forms | react-hook-form + zod (en algunos forms; otros usan estado local con validación zod) |
| Toasts | sonner |
| Confetti | canvas-confetti |
| Hosting | Vercel (Hobby plan, gratis) |
| DNS | Cloudflare → CNAME `finanzas` → `cname.vercel-dns.com` (Proxy DESACTIVADO/gris, sino Vercel no emite SSL) |

### Puertos en local

Esta máquina tiene varios proyectos. Para no chocar:
- **App:** `localhost:3003` (`npm run dev` ya tiene `-p 3003` hardcodeado)
- **Postgres local (Docker):** `localhost:5436` → mapea al 5432 del contenedor

---

## Workflow del día a día

```bash
# Setup inicial (una vez)
cp .env.example .env.local
# Llenar .env.local con DATABASE_URL local + AUTH_SECRET + AUTH_GOOGLE_ID/SECRET + ALLOWED_EMAILS
docker compose up -d
npm install
npm run db:push       # crea tablas en local
npm run db:seed       # crea 3 wallets en cero (NO crea préstamos)
npm run dev           # localhost:3003

# Cambios al código
git add .
git commit -m "..."
git push              # Vercel auto-deploya en ~2 min

# Cambios al schema (lib/db/schema.ts)
# Hoy es manual contra Neon — esto está pendiente de automatizar:
# 1. Cambiar .env.local DATABASE_URL a la URL de Neon (guardada aparte)
# 2. npm run db:push
# 3. Devolver .env.local a localhost
# (Hay una memoria pendiente para implementar GitHub Action con drizzle-kit migrate)

# Validaciones antes de pushear
npm run typecheck     # tsc --noEmit, debe dar exit 0
# El build de Vercel correrá npm run build automático en el deploy
```

---

## Modelo de datos (LO MÁS IMPORTANTE)

El modelo es **double-entry-style**: una transacción tiene metadatos + N legs (entradas/salidas) por bolsillo. Esto permite que un solo movimiento afecte múltiples wallets (ej: un préstamo que sale de Santander + Físicos a la vez).

### Tablas (ver `lib/db/schema.ts`)

- **`wallets`** — bolsillos donde vive la plata. Atributo crítico: `initialBalance` que **NUNCA se modifica por transacciones**, solo manualmente desde `/settings`.
- **`transactions`** — la "cabecera" de cada movimiento. Tiene type, descripción, monto, fecha, etc.
- **`transaction_legs`** — entradas/salidas atómicas por wallet. Una transacción tiene 1+ legs.
- **`loans`** — préstamos otorgados. **DEBE tener `transactionId`** apuntando a una `transactions` de tipo `loan_out`. Hoy puede haber préstamos con `transactionId: null` (legacy del seed viejo) — son inconsistencia que se debe corregir, no diseño aceptado.
- **`goals`** — metas de ahorro.
- **`monthly_snapshots`** — preparada pero no se usa todavía (sería cache mensual para acelerar dashboards).
- **`user/account/session/verificationToken`** — Auth.js + DrizzleAdapter.

### Reglas contables por tipo de transacción

**Saldo de un wallet** = `initialBalance + Σ legs IN - Σ legs OUT` — calculado en runtime, **NUNCA persistido** en `wallets`.

| `type` | Legs |
|---|---|
| `income` (sueldo) | 1 IN al wallet destino |
| `expense` (gasto) | 1+ OUT (suma == amountUsd), `category` requerido |
| `purchase` (compra USD) | 1 IN al wallet destino. `amountArs` y `exchangeRate` requeridos. `amountUsd` se calcula como `amountArs / exchangeRate` |
| `transfer` | 1 OUT + 1 IN del mismo monto |
| `cash_out` (extracción a físico) | 1 OUT por `grossAmount` + 1 IN por `amountUsd` (= grossAmount − feeUsd). El `feeUsd` **NO tiene leg** — se destruye. |
| `loan_out` | 1+ OUT (suma == amountUsd) **+** crear registro en `loans` con `transactionId` |
| `loan_in` (cobro) | 1+ IN **+** actualizar `loans.amountPaid` y `status`. Guardado con `groupId == loan.id` para poder linkearlo después. |

### Patrimonio total vs Disponible

Diseño consciente del hero del dashboard, **respetar al modificar**:

- **Patrimonio total** = `Σ wallet balances + Σ loans pending` (pendiente == `totalAmount - amountPaid`, solo loans en status `active` o `partially_paid`)
- **Disponible** = `Σ wallet balances` solamente

El número grande del hero es Total. El secundario es Disponible. Los préstamos cuentan en el patrimonio porque son plata que les pertenece, solo que está prestada.

---

## Estructura de carpetas

```
app/
├─ (app)/                      # rutas autenticadas con shell (sidebar + header + bottom nav)
│  ├─ layout.tsx              # AppShellLayout con auth guard + nav
│  ├─ page.tsx                # dashboard (HeroTotal + insights + cards + métricas + chart)
│  ├─ transactions/page.tsx
│  ├─ analysis/page.tsx
│  ├─ loans/page.tsx
│  ├─ portfolio/page.tsx
│  ├─ stats/page.tsx
│  ├─ goals/page.tsx
│  └─ settings/page.tsx        # gestión de wallets + zona peligrosa (resets)
├─ (auth)/login/page.tsx       # /login con Google
├─ auth/error/page.tsx         # /auth/error con copy de la app
└─ api/
   ├─ auth/[...nextauth]
   └─ rates                    # proxy de dolarapi.com con cache 5 min

components/
├─ ui/                         # primitivos (button, dialog, input, select, tabs, tooltip, etc.)
├─ shared/                     # Amount, Navigation, BlueRateBadge, InfoTooltip, EmptyState
├─ dashboard/                  # HeroTotal, WalletCard, MetricsRow, InsightPanel, EvolutionChart, QuickActions, QuickSalaryPrompt
├─ transactions/               # TransactionList, TransactionModal, TransactionDetailModal, TransactionFAB, MultiWalletSelector
│  └─ forms/                   # 7 forms, uno por type
├─ analysis/                   # AvgRateCard, PurchaseVsBlueChart, UsdSimulator, CashOutCostPanel, AnalysisEmptyState
├─ loans/                      # LoanCard, LoansHeaderActions
├─ portfolio/                  # DistributionChart, ArsValuePanel, ProjectionChart, DistributionEvolution
├─ stats/                      # MonthlyStatsTable, SavingsRateChart, CategoryPie, YearComparison
├─ goals/                      # GoalCard, GoalForm, GoalsHeader
└─ settings/                   # WalletList, WalletForm, DangerZone

lib/
├─ db/                         # schema, seed, drizzle client (decide si usa Neon o pg según DATABASE_URL)
├─ queries/                    # lecturas (server-only) por entidad
├─ services/dolar.ts           # cotizaciones (server-only)
├─ utils/                      # cn, format, calculations, insights
├─ validations/                # esquemas zod
├─ auth.config.ts              # config Auth.js edge-safe (sin adapter, para middleware)
└─ auth.ts                     # config Auth.js completa (con DrizzleAdapter)

actions/                       # Server Actions (mutaciones)
├─ transactions.ts             # createIncome/Expense/Purchase/Transfer/CashOut/LoanOut/LoanIn + deleteTransaction
├─ wallets.ts                  # create/update/archive/restore/delete + resetAllData/resetEverythingToZero
├─ loans.ts                    # writeOff/deleteLoan
├─ goals.ts
└─ auth.ts                     # signIn/signOut wrappers
```

---

## Convenciones críticas (NO romper)

### Diseño visual ("Liquid Dark")

- **Dark mode exclusivo**, no hay light mode ni se planea agregarlo.
- Variables CSS en `app/globals.css` (`--bg-base`, `--text-primary`, etc.). Usá las variables, no hex hardcodeado.
- Paleta de tipografía:
  - `font-display` (Syne) — headings, número del hero
  - `font-sans` (Plus Jakarta Sans) — body, labels, UI
  - `font-mono` (DM Mono) — **TODOS los números financieros** (montos, cotizaciones, %)
- **Regla absoluta:** cualquier número financiero usa `font-mono tabular-nums`. Nunca un monto en sans-serif.
- Formato `es-AR`: `1.234,56` (punto para miles, coma para decimales). Usá los helpers de `lib/utils/format.ts`: `formatUSD`, `formatARS`, `formatRate`, `formatPct`, `formatDate`, `formatDateShort`, `formatMonthYear`.
- Componente `Amount` (`components/shared/Amount.tsx`) para mostrar montos con tamaños predefinidos (`xs/sm/md/lg/xl`).

### Copy y tono (Español argentino, tuteo)

La app habla como **un amigo cordobés** que entiende de plata. Directo, sin vueltas, con humor sutil. Nunca "usted". Sin tecnicismos innecesarios.

Ejemplos del tono:
- Toast éxito sueldo: `"¡Joya! Sueldo de Flor registrado."`
- Toast éxito compra: `"Dale. Compraste USD 500 a $1.420."`
- Empty state préstamos: `"Ningún préstamo activo. Bien así."`
- Confirmación destructiva: `"¿Borrás esta transacción? No hay vuelta atrás."`
- Insight: `"Lucho debe USD 5.000. Ya van 35 días — no te olvides de cobrarle."`

Etiquetas de formularios usan lenguaje directo: `"¿Cuánto?"` en vez de `"Monto en USD"`, `"¿De dónde?"` en vez de `"Bolsillo de origen"`, `"¿A quién?"` en vez de `"Destinatario"`.

Fechas en español, no formato numérico: `"lunes 14 de mayo"`, no `"14/05/2025"` (excepto donde el espacio obliga, como en `formatDateShort`).

### Auth & Middleware

- `lib/auth.config.ts` = config edge-safe **sin adapter** (DB driver no anda en Edge runtime). El middleware importa de acá.
- `lib/auth.ts` = config completa con `DrizzleAdapter`. Server actions importan de acá.
- Sesiones usan **JWT strategy** (`session: { strategy: 'jwt' }`), NO database. Esto es porque el middleware necesita decodear la session sin tocar la DB.
- Whitelist de emails va en env var `ALLOWED_EMAILS` (comma-separated, lowercase).

### Server Actions

Todas las mutaciones son Server Actions en `/actions/*.ts` con la marca `'use server'` arriba del archivo. Patrón estándar:

```ts
export async function createSomething(input: Input): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')
    const data = schema.parse(input)
    await db.transaction(async (tx) => { /* ... */ })
    revalidateAll()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}
```

Las queries de lectura (`/lib/queries/`) son funciones async que usan `db` directamente y se importan desde React Server Components. No hay un fetch layer client-side para datos principales.

### Cotizaciones

- Source of truth: **dolarapi.com** (gratis, sin auth).
- El cliente JAMÁS llama a dolarapi.com directamente — siempre via `/api/rates` para cachear con `revalidate: 300` (5 min).
- Hook `useRates()` en `components/shared/BlueRateBadge.tsx` para componentes cliente.
- Server-side: `getCurrentRates()` en `lib/services/dolar.ts`.
- `getBlueHistory()` y `getMonthlyBlueClose()` para serie histórica del blue (usado en gráficos).
- **Limitación conocida:** dolarapi NO tiene cotizaciones por banco/billetera específica (Brubank, Naranja, Santander individuales). Solo tipos: blue, oficial, MEP, CCL, tarjeta, cripto.

---

## Qué NO hacer (anti-patterns)

1. **No persistir saldos calculados en `wallets`.** El balance se computa siempre desde `initialBalance + legs`. Si necesitás cachear, usá `monthly_snapshots` (preparada para eso).
2. **No mezclar copy genérico** ("Save", "Submit", "Cancel" en inglés). Todo el copy en castellano argentino — ver convenciones de copy arriba.
3. **No agregar features sin discutir con el usuario.** Esta es una app personal de 2 usuarios, las decisiones de UX las toma Fede. Si dudás, preguntá.
4. **No tocar el modelo contable sin entenderlo entero.** Cualquier cambio en types o legs puede romper cálculos en cascada en dashboard, analysis, portfolio, stats. Releé esta sección entera antes.
5. **No subir light mode.** Decisión tomada, dark mode exclusivo.
6. **No agregar deps innecesarias.** Stack ya cubre 95% de necesidades.
7. **No commitear `.env.local`.** Está en `.gitignore` por algo. Cualquier secreto va a Vercel Environment Variables o GitHub Secrets.
8. **No tocar la lógica de Lucho/préstamos legacy sin pensarlo.** Hoy puede haber préstamos con `transactionId: null` (creados por seed viejo). Idealmente todos los préstamos deberían tener `transactionId`. Cuando el usuario haga "Reset completo" y reconfigure, todos los nuevos préstamos van a quedar consistentes.
9. **No olvidar `revalidatePath`** en server actions que muten datos. Hay un helper `revalidateAll()` en cada archivo de actions.
10. **No usar `pg` en Edge runtime.** El middleware importa solo `auth.config.ts` (edge-safe). Si rompés esa separación, el bundle del middleware se infla y rompe deploy.

---

## Estado actual y pendientes

### Lo que funciona

- Dashboard con hero (Total + Disponible), insights automáticos (7 reglas + payday detection), cards de wallets con sparklines, métricas del mes, gráfico de evolución con overlay del blue, atajos.
- Movimientos: lista con filtros + 7 forms (income, expense, purchase, transfer, cash_out, loan_out, loan_in), detalle clickeable con eliminar.
- Análisis: cotización promedio ponderada, simulador, gráfico compras vs blue, costo de extracciones. Empty states ricos cuando no hay datos.
- Préstamos: cards con aging, eliminar préstamos directamente desde la card, registrar cobros parciales/totales.
- Portfolio: distribución, valor en ARS a 4 cotizaciones, proyección.
- Stats: tabla mensual exportable a CSV, savings rate, categorías, comparativa anual.
- Metas con progreso + ETA.
- Settings: gestión de wallets (CRUD), zona peligrosa con dos resets (soft/hard).
- Auth con whitelist, middleware, JWT sessions, DrizzleAdapter.
- Tooltips "?" en métricas y paneles importantes.
- Payday detection: sabe que Flor cobra el 20 (con manejo de fines de semana).

### Pendientes guardados en `~/.claude/projects/.../memory/`

- **Migraciones versionadas con GitHub Actions** (drizzle-kit migrate en push a main, en lugar del flujo manual actual).
- **Tracking de inversiones** (CEDEARs, FIMA, plazos fijos) como expansión grande con modelo de assets separado.
- **Edición de transacciones** (hoy solo se puede eliminar y recargar). Se discutió y se postergó.

### Decisiones de diseño tomadas

- **Hero Total + Disponible (variante B)**: dos columnas en desktop, stack en mobile. NO cambiar a otra variante sin acuerdo.
- **Confetti cada USD 3.000** (era 5.000, lo bajamos).
- **Header muestra Blue + Oficial** (NO solo Blue como antes).
- **Sin light mode**, sin PWA, sin push notifications nativas.
- **Vercel + Neon, NO autohospedado**. El usuario tiene VPS compartido para fedesardo.com pero NO quiere meterle más carga.

---

## Memoria persistente

Hay un sistema de memoria en `~/.claude/projects/-Users-fedesardo-proyectos-dollar-tracker/memory/` con notas para próximas sesiones. Leelo si vas a tomar decisiones de arquitectura o implementar algo grande. Index en `MEMORY.md`.

---

## Cuando dudes

- Si dudás sobre el modelo contable → releé "Reglas contables por tipo de transacción".
- Si dudás sobre tono/copy → mirá los toasts existentes en los forms y replicá el tono.
- Si dudás sobre UX → preguntá al usuario antes de implementar. Esta no es una app que tolere decisiones unilaterales del agente.
- Si dudás sobre stack → no agregues. Lo que está alcanza para 95% de necesidades.
