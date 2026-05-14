'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createGoal } from '@/actions/goals'
import { cn } from '@/lib/utils/cn'

const EMOJIS = ['🎯', '🏠', '✈️', '🚗', '💍', '👶', '🎓', '💻', '🎉', '🌴', '🛟', '🎁']
const COLORS = ['#22c55e', '#60a5fa', '#a78bfa', '#fb923c', '#f87171', '#fbbf24', '#22d3ee']

export function GoalForm({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#22c55e')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = parseFloat(target)
    if (!name) return toast.error('Cargá un nombre')
    if (!t || t <= 0) return toast.error('Cargá un monto válido')
    setSubmitting(true)
    const res = await createGoal({
      name,
      targetUsd: t,
      deadline: deadline || null,
      icon,
      color,
    })
    setSubmitting(false)
    if (res.success) {
      toast.success('Meta creada. ¡A ahorrar!')
      setName('')
      setTarget('')
      setDeadline('')
      onOpenChange(false)
    } else toast.error(res.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>¿Para qué ahorran?</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Casa, viaje, auto…" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>¿Cuánto necesitan?</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label>¿Para cuándo?</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center text-lg border transition-colors',
                    icon === e
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-[var(--border)] bg-bg-elevated hover:border-[var(--border-hover)]',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-9 w-9 rounded-lg border-2 transition-transform',
                    color === c ? 'border-text-primary scale-110' : 'border-transparent',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
              {submitting ? 'Guardando…' : 'Crear meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
