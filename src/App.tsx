/* Main App Component - Handles routing (using react-router-dom) */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, AdminOnlyRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
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
import Pacientes from '@/pages/Pacientes'
import PacienteDetalhe from '@/pages/PacienteDetalhe'
import Agenda from '@/pages/Agenda'
import Prontuarios from '@/pages/Prontuarios'
import NovaAvaliacao from '@/pages/NovaAvaliacao'
import AvaliacaoDetalhe from '@/pages/AvaliacaoDetalhe'
import Relatorios from '@/pages/Relatorios'
import GuiaUso from '@/pages/GuiaUso'
import Acessos from '@/pages/Acessos'
import { Programas } from '@/pages/Programas'
import { ProgramaDetalhe } from '@/pages/ProgramaDetalhe'
import { ProgramaVersaoCliente } from '@/components/programas/ProgramaVersaoCliente'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
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
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/:id" element={<PacienteDetalhe />} />
              <Route path="/agenda" element={<Agenda />} />
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
              <Route element={<AdminOnlyRoute />}>
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/acessos" element={<Acessos />} />
              </Route>
              <Route path="/guia" element={<GuiaUso />} />
            </Route>
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
