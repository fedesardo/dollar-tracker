import { ShieldX } from 'lucide-react'
import { signOutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="relative min-h-screen overflow-hidden mesh-login grain flex items-center justify-center px-6">
      <div className="relative z-10 max-w-md w-full text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-accent-red/10 border border-accent-red/30 flex items-center justify-center mb-6">
          <ShieldX className="h-8 w-8 text-accent-red" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Esta app no es para vos.
        </h1>
        <p className="mt-3 text-base text-white/70">
          Solo pueden entrar Fede y Flor. Si sos otro, ni te molestes.
        </p>
        <form action={signOutAction} className="mt-10">
          <Button type="submit" variant="secondary" size="lg">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  )
}
