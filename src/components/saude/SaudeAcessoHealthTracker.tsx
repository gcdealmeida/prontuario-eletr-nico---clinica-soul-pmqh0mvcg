import { useState } from 'react'
import { ExternalLink, Smartphone, Search, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { SOUL_HTR } from '@/lib/soulHtrTheme'
import type { SaudeClienteRecord } from '@/services/saudeBemEstar'

/** App Health Tracker de verdade — OUTRO projeto Skip (não é o /cliente interno). */
const URL_HEALTH_TRACKER = 'https://clinica-soul-health-tracker-333e7--preview.goskip.app/login'

interface Props {
  /** lista de clientes p/ o atalho de teste rápido (apenas admin) */
  clientes: SaudeClienteRecord[]
  isAdmin: boolean
}

/**
 * Acesso "Health Tracker (App do Cliente)":
 * - abre o app externo do Health Tracker (outro projeto Skip) em nova aba;
 * - para admin: atalho de teste que abre a tela de login do app externo
 *   (o e-mail digitado é copiado para a área de transferência para colar
 *   no login — a senha continua obrigatória, nada é burlado).
 */
export function SaudeAcessoHealthTracker({ clientes, isAdmin }: Props) {
  const [email, setEmail] = useState('')
  const [sugestoes, setSugestoes] = useState<SaudeClienteRecord[]>([])
  const { toast } = useToast()

  const abrirAppHealthTracker = () => {
    window.open(URL_HEALTH_TRACKER, '_blank', 'noopener')
  }

  const abrirLoginComEmail = (e: string) => {
    const limpo = e.trim().toLowerCase()
    if (!limpo) {
      toast({
        title: 'Informe um e-mail',
        description: 'Digite o e-mail do cliente cadastrado para abrir o app do Health Tracker.',
        variant: 'destructive',
      })
      return
    }
    // O app externo não documenta pré-preenchimento por query (?email=...),
    // então abrimos a tela de login simples e copiamos o e-mail para colar.
    window.open(URL_HEALTH_TRACKER, '_blank', 'noopener')
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(limpo).then(
        () =>
          toast({
            title: 'E-mail copiado',
            description: `Cole "${limpo}" na tela de login do Health Tracker (a senha continua necessária).`,
          }),
        () => {},
      )
    }
  }

  const filtrarSugestoes = (q: string) => {
    setEmail(q)
    const t = q.trim().toLowerCase()
    if (!t) {
      setSugestoes([])
      return
    }
    setSugestoes(
      clientes
        .filter((c) => c.email?.toLowerCase().includes(t) || c.nome.toLowerCase().includes(t))
        .slice(0, 6),
    )
  }

  return (
    <Card className="border-[#E2D4BF]" style={{ backgroundColor: SOUL_HTR.card }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: SOUL_HTR.bgAlt }}
          >
            <Smartphone className="h-4.5 w-4.5" style={{ color: SOUL_HTR.marrom }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold" style={{ color: SOUL_HTR.marromEscuro }}>
              Health Tracker (App do Cliente)
            </p>
            <p className="text-xs" style={{ color: SOUL_HTR.textoFraco }}>
              Abre o aplicativo externo do Health Tracker (outro sistema), em nova aba.
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          style={{ backgroundColor: SOUL_HTR.marrom, color: '#FFF8ED' }}
          onClick={abrirAppHealthTracker}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir Health Tracker em nova aba
        </Button>

        {isAdmin && (
          <div className="rounded-xl border border-[#E2D4BF] bg-[#FDFBF6] p-3 space-y-2">
            <p
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: SOUL_HTR.marrom }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Teste rápido (admin)
            </p>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#73574A]/60" />
              <Input
                placeholder="E-mail do cliente cadastrado..."
                value={email}
                onChange={(e) => filtrarSugestoes(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            {sugestoes.length > 0 && (
              <ul className="rounded-lg border border-[#E2D4BF] divide-y divide-[#F0E4D2]">
                {sugestoes.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#F5EFE6]"
                      onClick={() => abrirLoginComEmail(c.email || '')}
                    >
                      <span
                        className="min-w-0 flex-1 truncate"
                        style={{ color: SOUL_HTR.marromEscuro }}
                      >
                        {c.nome} — {c.email}
                      </span>
                      <Search className="h-3.5 w-3.5 shrink-0 text-[#A98D74]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              style={{ borderColor: SOUL_HTR.dourado, color: SOUL_HTR.marrom }}
              onClick={() => abrirLoginComEmail(email)}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Abrir login do Health Tracker com este e-mail
            </Button>
            <p className="text-[11px] leading-snug" style={{ color: SOUL_HTR.textoFraco }}>
              Abre a tela de login do app externo e copia o e-mail para colar. A senha continua
              necessária — nada é burlado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SaudeAcessoHealthTracker
