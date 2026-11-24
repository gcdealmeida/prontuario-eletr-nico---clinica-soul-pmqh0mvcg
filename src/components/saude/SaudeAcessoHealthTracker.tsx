import { useState } from 'react'
import { ExternalLink, Smartphone, Search, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { SOUL_HTR, NOME_APP_CLIENTE } from '@/lib/soulHtrTheme'
import type { SaudeClienteRecord } from '@/services/saudeBemEstar'

interface Props {
  /** lista de clientes p/ o atalho de teste rápido (apenas admin) */
  clientes: SaudeClienteRecord[]
  isAdmin: boolean
}

/**
 * Acesso "Health Tracker (App do Cliente)":
 * - abre o app do cliente (/cliente) em nova aba, para testes;
 * - para admin: atalho que gera /cliente?email=<email> — o link APENAS
 *   preenche o campo de login do app do cliente; a senha continua obrigatória.
 */
export function SaudeAcessoHealthTracker({ clientes, isAdmin }: Props) {
  const [email, setEmail] = useState('')
  const [sugestoes, setSugestoes] = useState<SaudeClienteRecord[]>([])
  const { toast } = useToast()

  const abrirAppCliente = () => {
    window.open('/cliente', '_blank', 'noopener')
  }

  const gerarLinkComEmail = (e: string) => {
    const limpo = e.trim().toLowerCase()
    if (!limpo) {
      toast({
        title: 'Informe um e-mail',
        description: 'Digite o e-mail do cliente cadastrado para gerar o link de teste.',
        variant: 'destructive',
      })
      return
    }
    const url = `${window.location.origin}/cliente?email=${encodeURIComponent(limpo)}`
    window.open(url, '_blank', 'noopener')
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
              {NOME_APP_CLIENTE} (App do Cliente)
            </p>
            <p className="text-xs" style={{ color: SOUL_HTR.textoFraco }}>
              Abre o aplicativo que o cliente usa, em nova aba — para testes.
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          style={{ backgroundColor: SOUL_HTR.marrom, color: '#FFF8ED' }}
          onClick={abrirAppCliente}
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
                      onClick={() => gerarLinkComEmail(c.email || '')}
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
              onClick={() => gerarLinkComEmail(email)}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Gerar link de teste com este e-mail
            </Button>
            <p className="text-[11px] leading-snug" style={{ color: SOUL_HTR.textoFraco }}>
              O link apenas preenche o e-mail na tela de login do app do cliente. A senha continua
              necessária — nada é burlado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SaudeAcessoHealthTracker
