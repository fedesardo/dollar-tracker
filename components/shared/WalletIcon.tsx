import {
  CreditCard,
  Landmark,
  Banknote,
  Clock,
  Wallet,
  PiggyBank,
  Coins,
  type LucideIcon,
} from 'lucide-react'

const map: Record<string, LucideIcon> = {
  'credit-card': CreditCard,
  landmark: Landmark,
  banknote: Banknote,
  banknotes: Banknote,
  clock: Clock,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  coins: Coins,
}

export function WalletIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Wallet
  return <Icon className={className} />
}
