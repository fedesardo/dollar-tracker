'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, RotateCcw, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetAllData, resetEverythingToZero } from '@/actions/wallets'

type Mode = 'soft' | 'hard'

export function DangerZone() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [working, setWorking] = useState(false)

  const closeAll = () => {
    setMode(null)
    setConfirmText('')
  }

  const handleConfirm = async () => {
    if (confirmText !== 'BORRAR') {
      toast.error('Tenés que escribir BORRAR para confirmar')
      return
    }
    setWorking(true)
    const res = mode === 'hard' ? await resetEverythingToZero() : await resetAllData()
    setWorking(false)
    if (res.success) {
      toast.success(
        mode === 'hard'
          ? 'Todo en cero. Editá cada bolsillo con su saldo actual.'
          : 'Movimientos borrados. Los saldos iniciales quedaron como estaban.',
      )
      closeAll()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="rounded-2xl border border-accent-red/20 bg-accent-red/5 p-5">
      <h2 className="font-display text-lg font-semibold text-accent-red flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Zona peligrosa
      </h2>
      <p className="text-xs text-text-secondary mt-1">
        Acciones que borran datos. Pensalo dos veces antes de tocar.
      </p>

      {!mode && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Option
            Icon={Eraser}
            title="Borrar movimientos"
            description="Borra todas las transacciones y préstamos. Los saldos iniciales de los bolsillos QUEDAN como están."
            cta="Borrar movimientos"
            onClick={() => setMode('soft')}
          />
          <Option
            Icon={RotateCcw}
            title="Reset completo"
            description="Borra todo Y pone los saldos iniciales en cero. Después editás cada bolsillo con su saldo actual."
            cta="Resetear todo a cero"
            onClick={() => setMode('hard')}
            destructive
          />
        </div>
      )}

      {mode && (
        <div className="mt-4 space-y-3 rounded-xl bg-bg-card p-4 border border-accent-red/20">
          <p className="text-sm text-text-primary">
            {mode === 'hard' ? (
              <>
                Vas a borrar <strong>todos los movimientos y préstamos</strong>, y poner los{' '}
                <strong>saldos iniciales en cero</strong>. Después tenés que editar cada
                bolsillo con su saldo real de hoy.
              </>
            ) : (
              <>
                Vas a borrar <strong>todas las transacciones y préstamos</strong>. Los
                bolsillos quedan con los saldos iniciales actuales (no se tocan).
              </>
            )}
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">
              Escribí <span className="font-mono text-accent-red">BORRAR</span> para confirmar
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="BORRAR"
              className="font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeAll}
              className="flex-1"
              disabled={working}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              disabled={working || confirmText !== 'BORRAR'}
              className="flex-1"
            >
              {working
                ? 'Borrando…'
                : mode === 'hard'
                  ? 'Sí, todo a cero'
                  : 'Sí, borrar movimientos'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Option({
  Icon,
  title,
  description,
  cta,
  onClick,
  destructive,
}: {
  Icon: typeof Eraser
  title: string
  description: string
  cta: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-bg-card p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={`h-4 w-4 ${destructive ? 'text-accent-red' : 'text-accent-orange'}`}
        />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <p className="text-xs text-text-secondary mb-3 flex-1">{description}</p>
      <Button
        variant={destructive ? 'destructive' : 'outline'}
        size="sm"
        onClick={onClick}
        className="w-full"
      >
        {cta}
      </Button>
    </div>
  )
}
