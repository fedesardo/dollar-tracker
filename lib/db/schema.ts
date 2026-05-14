import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  varchar,
  date,
  boolean,
  uuid,
  jsonb,
  primaryKey,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import type { AdapterAccount } from '@auth/core/adapters'

// ───────────────── ENUMS ─────────────────

export const walletTypeEnum = pgEnum('wallet_type', ['virtual', 'physical', 'receivable'])
export const ownerEnum = pgEnum('owner', ['fede', 'flor', 'joint'])
export const transactionTypeEnum = pgEnum('transaction_type', [
  'income',
  'expense',
  'purchase',
  'transfer',
  'cash_out',
  'loan_out',
  'loan_in',
])
export const legDirectionEnum = pgEnum('leg_direction', ['in', 'out'])
export const loanStatusEnum = pgEnum('loan_status', [
  'active',
  'partially_paid',
  'paid',
  'written_off',
])

// ───────────────── AUTH TABLES (Drizzle adapter) ─────────────────

export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
})

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
)

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => ({
    compoundKey: primaryKey({ columns: [t.identifier, t.token] }),
  }),
)

// ───────────────── DOMAIN TABLES ─────────────────

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: walletTypeEnum('type').notNull(),
  owner: ownerEnum('owner').notNull(),
  initialBalance: decimal('initial_balance', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  color: varchar('color', { length: 7 }).notNull().default('#6366f1'),
  icon: varchar('icon', { length: 50 }).notNull().default('wallet'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),
    type: transactionTypeEnum('type').notNull(),
    description: varchar('description', { length: 200 }).notNull(),
    amountUsd: decimal('amount_usd', { precision: 12, scale: 2 }).notNull(),
    amountArs: decimal('amount_ars', { precision: 15, scale: 2 }),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }),
    grossAmount: decimal('gross_amount', { precision: 12, scale: 2 }),
    feePercentage: decimal('fee_percentage', { precision: 5, scale: 2 }),
    feeUsd: decimal('fee_usd', { precision: 10, scale: 2 }),
    beneficiary: ownerEnum('beneficiary'),
    category: varchar('category', { length: 50 }),
    notes: text('notes'),
    groupId: uuid('group_id'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    dateIdx: index('transactions_date_idx').on(t.date),
    typeIdx: index('transactions_type_idx').on(t.type),
  }),
)

export const transactionLegs = pgTable(
  'transaction_legs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id),
    direction: legDirectionEnum('direction').notNull(),
    amountUsd: decimal('amount_usd', { precision: 12, scale: 2 }).notNull(),
  },
  (t) => ({
    txIdx: index('legs_tx_idx').on(t.transactionId),
    walletIdx: index('legs_wallet_idx').on(t.walletId),
  }),
)

export const loans = pgTable('loans', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id'),
  debtorName: varchar('debtor_name', { length: 100 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  dueDate: date('due_date'),
  status: loanStatusEnum('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const monthlySnapshots = pgTable('monthly_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  totalUsd: decimal('total_usd', { precision: 12, scale: 2 }).notNull(),
  byWallet: jsonb('by_wallet').notNull(),
  incomeUsd: decimal('income_usd', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  expenseUsd: decimal('expense_usd', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  purchaseUsd: decimal('purchase_usd', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  purchaseArs: decimal('purchase_ars', { precision: 15, scale: 2 })
    .notNull()
    .default('0'),
  cashOutFees: decimal('cash_out_fees', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  avgRate: decimal('avg_rate', { precision: 10, scale: 4 }),
  blueClose: decimal('blue_close', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  targetUsd: decimal('target_usd', { precision: 12, scale: 2 }).notNull(),
  deadline: date('deadline'),
  color: varchar('color', { length: 7 }).notNull().default('#22c55e'),
  icon: varchar('icon', { length: 10 }).notNull().default('🎯'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ───────────────── INFERRED TYPES ─────────────────

export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type TransactionLeg = typeof transactionLegs.$inferSelect
export type NewTransactionLeg = typeof transactionLegs.$inferInsert
export type Loan = typeof loans.$inferSelect
export type NewLoan = typeof loans.$inferInsert
export type MonthlySnapshot = typeof monthlySnapshots.$inferSelect
export type Goal = typeof goals.$inferSelect
export type NewGoal = typeof goals.$inferInsert

export type WalletType = (typeof walletTypeEnum.enumValues)[number]
export type Owner = (typeof ownerEnum.enumValues)[number]
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number]
export type LegDirection = (typeof legDirectionEnum.enumValues)[number]
export type LoanStatus = (typeof loanStatusEnum.enumValues)[number]
