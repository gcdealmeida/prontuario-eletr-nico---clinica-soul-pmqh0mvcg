import { isGestorRole } from '@/lib/roles'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { PainelRelatoriosAdmin } from '@/components/relatorios/PainelRelatoriosAdmin'
import { RelatorioProfissional } from '@/components/relatorios/RelatorioProfissional'

/**
 * Tela /relatorios — a partir da v0.0.137 é apenas uma FACHADA de roteamento:
 * - Gestor (ADM/Secretária/admin legado): redireciona para /gestao?tab=relatorios
 *   (o painel administrativo completo foi movido para dentro da Gestão da
 *   Clínica, aba Relatórios — padrão da aba Acesso).
 * - Profissional: mantém o relatório individual dele aqui, inalterado
 *   (a Gestão é exclusiva de gestores; nenhum acesso é perdido ou aberto).
 */
export default function Relatorios() {
  const { role } = useAuth()
  const isGestor = isGestorRole(role)

  if (isGestor) {
    return <Navigate to="/gestao?tab=relatorios" replace />
  }

  return <RelatorioProfissional />
}
