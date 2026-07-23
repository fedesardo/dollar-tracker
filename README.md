# finanzas — Dollar Tracker

Herramienta financiera personal para Fede & Flor. Next.js 14 + TypeScript + Drizzle + Neon + Auth.js + shadcn/ui.

Vivo en `https://finanzas.fedesardo.com`.

---

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript estricto
- **DB:** PostgreSQL (Neon serverless) + Drizzle ORM
- **Auth:** Auth.js v5 + Google OAuth (whitelist por email)
- **UI:** Tailwind + shadcn/ui (dark mode exclusivo) + framer-motion + Recharts
- **Hosting:** Vercel

---

## Desarrollo local

```bash
cp .env.example .env.local
# Editá .env.local con tus credenciales

# Levantá Postgres local
docker compose up -d

# DATABASE_URL local: postgresql://finanzas:finanzas@localhost:5432/finanzas

npm install
npm run db:push        # crea las tablas
npm run db:seed        # carga wallets iniciales + Lucho
npm run dev
```

Abrir http://localhost:3000.

---

## Deploy en Vercel + Neon

### 1. Neon

1. Cuenta gratis en [neon.tech](https://neon.tech)
2. Crear proyecto `finanzas`
3. Copiar **Pooled connection string** → `DATABASE_URL`
4. Copiar **Direct connection** → `DATABASE_URL_UNPOOLED`

### 2. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized redirect URIs:
   - `https://finanzas.fedesardo.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (dev)
4. Copiar Client ID → `AUTH_GOOGLE_ID`
5. Copiar Client Secret → `AUTH_GOOGLE_SECRET`

### 3. Variables de entorno

Generar `AUTH_SECRET` con:

```bash
openssl rand -base64 32
```

Variables a configurar (ver `.env.example`):

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `ALLOWED_EMAILS` (separados por coma, ej: `fedesardo@gmail.com,florenciaevans@gmail.com`)
- `NEXT_PUBLIC_APP_URL`

### 4. Vercel

1. Push a GitHub
2. Importar en [vercel.com](https://vercel.com)
3. Pegar todas las variables de entorno en Settings → Environment Variables
4. Deploy

### 5. Migración inicial

Desde local con `DATABASE_URL_UNPOOLED` apuntando a Neon:

```bash
npm run db:push
npm run db:seed
```

### 6. Dominio

1. Vercel → Settings → Domains → agregar `finanzas.fedesardo.com`
2. Cloudflare DNS → CNAME `finanzas` → `cname.vercel-dns.com` (proxy DESACTIVADO, nube gris)

---

## Estructura del proyecto

```
app/
├─ (app)/                # rutas autenticadas con shell
│  ├─ page.tsx           # dashboard
│  ├─ transactions/      # movimientos + 7 formularios
│  ├─ analysis/          # cotización promedio + simulador
│  ├─ loans/             # préstamos
│  ├─ portfolio/         # distribución + proyección
│  ├─ horizon/           # Casita Horizonte (ARS, independiente de wallets USD)
│  ├─ stats/             # tabla mensual + categorías
│  └─ goals/             # metas
├─ (auth)/login          # /login
├─ auth/error            # /auth/error
└─ api/
   ├─ auth/[...nextauth]
   └─ rates              # proxy de dolarapi.com (cache 5 min)

components/
├─ ui/                   # primitivos shadcn
├─ shared/               # Amount, Navigation, BlueRateBadge, etc.
├─ dashboard/
├─ transactions/forms/   # IncomeForm, ExpenseForm, ...
├─ analysis/
├─ loans/
├─ portfolio/
├─ stats/
└─ goals/

lib/
├─ db/                   # schema, seed, drizzle client
├─ queries/              # lecturas (wallets, transactions, loans, ...)
├─ services/dolar.ts     # cotizaciones
├─ utils/                # format, calculations, insights, cn
├─ validations/          # Zod
└─ auth.ts

actions/                 # Server Actions (mutaciones)
```

---

## Modelo contable (resumen)

Cada `transaction` tiene 0..N `transaction_legs` que describen movimientos atómicos por bolsillo:

| tipo       | legs                                                      |
| ---------- | --------------------------------------------------------- |
| `income`   | 1 IN al destino                                           |
| `expense`  | 1+ OUT (suma == amountUsd)                                |
| `purchase` | 1 IN al destino · `amountArs` y `exchangeRate` requeridos |
| `transfer` | 1 OUT + 1 IN del mismo monto                              |
| `cash_out` | 1 OUT por `grossAmount` + 1 IN por `amountUsd` (= gross − fee). El `feeUsd` se pierde, **no tiene leg**. |
| `loan_out` | 1+ OUT (suma == amountUsd) + crea registro en `loans`     |
| `loan_in`  | 1+ IN + actualiza `loans.amountPaid` y `status`           |

Saldo de wallet = `initialBalance + Σ legs IN − Σ legs OUT` (calculado en runtime, jamás persistido en `wallets`).

### Casita Horizonte

El módulo `/horizon` registra el plan de vivienda en ARS mediante tablas propias:
`horizon_plans`, `horizon_valuations` y `horizon_contributions`.

No crea transacciones ni legs y, por diseño, no modifica saldos, patrimonio ni
estadísticas de ahorro en USD. El histórico inicial se importa de forma
idempotente al abrir el módulo por primera vez.

---

## Scripts

| Script              | Descripción                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Dev server                               |
| `npm run build`     | Build prod                               |
| `npm run typecheck` | tsc --noEmit                             |
| `npm run db:generate` | Genera SQL desde schema.ts             |
| `npm run db:push`   | Push schema a la DB sin migraciones      |
| `npm run db:migrate` | Aplica migraciones                      |
| `npm run db:seed`   | Inserta wallets + préstamo a Lucho       |
| `npm run db:studio` | Drizzle studio                           |
