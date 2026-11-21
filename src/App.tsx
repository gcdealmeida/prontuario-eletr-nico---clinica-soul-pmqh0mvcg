/* Main App Component - Handles routing (using react-router-dom) */
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
import { isAcessosSubTab } from '@/pages/Acessos'

/**
 * /acessos saiu de circulação: redireciona para o painel de Acessos &
 * Governança embutido na aba Acesso da Gestão, preservando a query
 * (?tab=atualizacoes → &sub=atualizacoes etc.) para não quebrar os links
 * das notificações e do Guia de Uso.
 */
const RedirectAcessos = () => {
  const location = useLocation()
  const tabParam = new URLSearchParams(location.search).get('tab')
  const sub = isAcessosSubTab(tabParam) ? `&sub=${tabParam}` : ''
  return <Navigate to={`/gestao?tab=acesso${sub}`} replace />
}
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import {
  ProtectedRoute,
  AdminOnlyRoute,
  GestorOnlyRoute,
  PublicOnlyRoute,
} from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

// Public Auth Pages
import Login from '@/pages/Index'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import VerifyEmail from '@/pages/VerifyEmail'
import ConfirmEmailChange from '@/pages/ConfirmEmailChange'
import PreCadastroPublico from '@/pages/PreCadastroPublico'
import AguardandoAprovacao from '@/pages/AguardandoAprovacao'

// Protected Clinic Pages
import Dashboard from '@/pages/Dashboard'
import Gestao from '@/pages/Gestao'
import PainelAtendimento from '@/pages/atendimento/PainelAtendimento'
import Pacientes from '@/pages/Pacientes'
import PacienteDetalhe from '@/pages/PacienteDetalhe'
import Agenda from '@/pages/Agenda'
import Presencas from '@/pages/Presencas'
import Prontuarios from '@/pages/Prontuarios'
import NovaAvaliacao from '@/pages/NovaAvaliacao'
import AvaliacaoDetalhe from '@/pages/AvaliacaoDetalhe'
import Relatorios from '@/pages/Relatorios'
import GuiaUso from '@/pages/GuiaUso'
import { Programas } from '@/pages/Programas'
import { ProgramaDetalhe } from '@/pages/ProgramaDetalhe'
import { ProgramaVersaoCliente } from '@/components/programas/ProgramaVersaoCliente'
import NotFound from '@/pages/NotFound'

const RootAppLayout = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Outlet />
    </TooltipProvider>
  </AuthProvider>
)

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootAppLayout />}>
      {/* Public Auth Routes */}
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPassword />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPassword />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PublicOnlyRoute>
            <VerifyEmail />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/confirm-email-change"
        element={
          <PublicOnlyRoute>
            <ConfirmEmailChange />
          </PublicOnlyRoute>
        }
      />

      {/* Public Patient Pre-Registration Link (token opcional) */}
      <Route path="/pre-cadastro" element={<PreCadastroPublico />} />
      <Route path="/pre-cadastro/:token" element={<PreCadastroPublico />} />

      {/* Versão Pública do Programa de Treino para o Cliente (acesso por token sem login) */}
      <Route
        path="/programa-cliente/:token"
        element={<ProgramaVersaoCliente modoPublico={true} />}
      />

      {/* Página de espera de aprovação de acesso */}
      <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao />} />

      {/* Protected Routes inside Global Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/painel" element={<Dashboard />} />
          <Route path="/atendimento" element={<PainelAtendimento />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/:id" element={<PacienteDetalhe />} />
          <Route
            path="/pacientes/:id/avaliacao"
            element={<Navigate to="..?tab=avaliacoes" replace relative="path" />}
          />
          <Route
            path="/pacientes/:id/evolucoes"
            element={<Navigate to="..?tab=evolucoes" replace relative="path" />}
          />
          <Route
            path="/pacientes/:id/programas"
            element={<Navigate to="..?tab=programas" replace relative="path" />}
          />
          <Route
            path="/pacientes/:id/dados"
            element={<Navigate to="..?tab=dados" replace relative="path" />}
          />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/presencas" element={<Presencas />} />
          <Route path="/prontuarios" element={<Prontuarios />} />
          <Route path="/prontuarios/novo" element={<NovaAvaliacao />} />
          <Route path="/prontuarios/:id" element={<AvaliacaoDetalhe />} />
          <Route path="/programas" element={<Programas />} />
          <Route path="/programas/novo" element={<ProgramaDetalhe />} />
          <Route path="/programas/:id" element={<ProgramaDetalhe />} />
          <Route
            path="/programas/:id/cliente"
            element={<ProgramaVersaoCliente modoPublico={false} />}
          />
          <Route element={<GestorOnlyRoute />}>
            <Route path="/gestao" element={<Gestao />} />
          </Route>
          <Route element={<AdminOnlyRoute />}>
            <Route path="/relatorios" element={<Relatorios />} />
            {/* /acessos saiu de circulação: redireciona (preservando ?tab=)
                para o painel de Acessos & Governança embutido na aba Acesso
                da Gestão da Clínica — /gestao?tab=acesso&sub=... */}
            <Route path="/acessos" element={<RedirectAcessos />} />
          </Route>
          <Route path="/guia" element={<GuiaUso />} />
        </Route>
      </Route>
      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
)

const App = () => <RouterProvider router={router} />

export default App
