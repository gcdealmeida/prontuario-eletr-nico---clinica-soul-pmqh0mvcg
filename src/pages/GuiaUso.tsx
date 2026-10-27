import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  Paperclip,
  Printer,
  Edit,
  ArrowRight,
  HelpCircle,
  Activity,
  Dumbbell,
  Apple,
  Stethoscope,
  ChevronDown,
  Info,
  Layers,
  TrendingUp,
  RefreshCw,
  Bell,
  Search,
  UploadCloud,
  Check,
  ShieldCheck,
  UserCheck,
  Lock,
  FileSpreadsheet,
  CalendarCheck2,
  Zap,
  GitMerge,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { LogoSOUL } from '@/components/LogoSOUL'

export default function GuiaUso() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('passo-a-passo')

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* HERO BANNER ACOLHEDOR CLÍNICA SOUL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4A322A] via-[#33221C] to-[#251813] text-[#FAF4EA] p-6 sm:p-10 shadow-lg border border-[#C9A46A]/30">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#C9A46A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA]/10 border border-[#C9A46A]/40 text-[#E3C89A] text-xs font-semibold backdrop-blur-xs">
              <BookOpen className="h-3.5 w-3.5 text-[#C9A46A]" />
              <span>Manual Prático da Clínica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white">
              Guia de Uso — Sistema SOUL de Avaliação
            </h1>
            <p className="text-xs sm:text-sm text-[#FAF4EA]/80 leading-relaxed font-sans">
              Bem-vindo ao manual completo da Clínica SOUL (v0.0.35). Aprenda como abrir novas
              avaliações clínicas, consultar prontuários oficiais, acompanhar a evolução dos
              pacientes, prescrever programas de acompanhamento com divisão de treinos A/B/C e
              aproveitar ao máximo a inteligência clínica integrada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Button
              onClick={() => navigate('/prontuarios/novo')}
              className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-11 px-5 text-sm flex items-center justify-center gap-2 shadow-md border border-[#DFBF8E]/50 transition-transform active:scale-98"
            >
              <Plus className="h-4 w-4 text-[#33221C]" />
              Abrir Nova Avaliação
            </Button>
            <Button
              onClick={() => navigate('/prontuarios')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-[#FAF4EA] border-white/20 rounded-xl h-10 px-4 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-[#E3C89A]" />
              Ver Prontuários Salvos
            </Button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: VISÃO GERAL DOS 5 MÓDULOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#FAF4EA] border border-[#E3C89A]/60 flex items-center justify-center text-[#8C6527]">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#4A322A]">
                1. Visão Geral dos Módulos do Sistema
              </h2>
              <p className="text-xs text-[#73574A]">
                O aplicativo é estruturado em 5 áreas principais, acessíveis pelo menu lateral:
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Painel */}
          <div
            onClick={() => navigate('/painel')}
            className="group bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:border-[#C9A46A]/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/40 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Home className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#4A322A] group-hover:text-[#8C6527] transition-colors">
                Painel
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Central do dia: consultas de hoje com botão "Iniciar", resumo de pacientes ativos,
                estatísticas e atalhos rápidos.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-[#8C6527]">
              Acessar Painel{' '}
              <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Pacientes */}
          <div
            onClick={() => navigate('/pacientes')}
            className="group bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:border-[#C9A46A]/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FDF2EE] text-[#B87355] border border-[#E7BFB0]/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#4A322A] group-hover:text-[#B87355] transition-colors">
                Pacientes
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Cadastro de pacientes, busca rápida e perfil completo com Timeline cronológica e
                ficha de dados pessoais.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-[#B87355]">
              Ver Pacientes{' '}
              <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Agenda */}
          <div
            onClick={() => navigate('/agenda')}
            className="group bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:border-[#C9A46A]/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#F0F5FA] text-[#3B82F6] border border-[#BFDBFE]/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#4A322A] group-hover:text-[#3B82F6] transition-colors">
                Agenda
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Grade de agendamentos por especialidade, controle de status (Agendada, Confirmada,
                Concluída) e filtros por data.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-[#3B82F6]">
              Abrir Agenda{' '}
              <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Prontuários */}
          <div
            onClick={() => navigate('/prontuarios')}
            className="group bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:border-[#C9A46A]/60 transition-all cursor-pointer flex flex-col justify-between ring-1 ring-[#C9A46A]/30"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#C9A46A]/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#4A322A] group-hover:text-[#8C6527] transition-colors">
                Prontuários
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Coração clínico do app: todas as avaliações salvas, filtros por área, botão Nova
                Avaliação e impressão em PDF.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-[#8C6527]">
              Explorar Prontuários{' '}
              <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Relatórios */}
          <div
            onClick={() => navigate('/relatorios')}
            className="group bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:border-[#C9A46A]/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-[#F5F1EE] text-[#5C4033] border border-[#D9C8BE]/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#4A322A] group-hover:text-[#5C4033] transition-colors">
                Relatórios
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Métricas globais da clínica, comparativo de volume por especialidade, taxas de
                conclusão e exportação de dados.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center text-[11px] font-semibold text-[#5C4033]">
              Ver Relatórios{' '}
              <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: OS 3 GRANDES FLUXOS DO USUÁRIO */}
      <Tabs defaultValue="nova-avaliacao" className="w-full space-y-6">
        <TabsList className="bg-white border border-[#E9E1D2] rounded-2xl p-1.5 h-auto flex flex-wrap shadow-xs">
          <TabsTrigger
            value="nova-avaliacao"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            1. Como abrir Nova Avaliação
          </TabsTrigger>
          <TabsTrigger
            value="abrir-prontuario"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            2. Como abrir um Prontuário
          </TabsTrigger>
          <TabsTrigger
            value="atualizar-prontuario"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            3. Atualizações & Reavaliações
          </TabsTrigger>
          <TabsTrigger
            value="evolucoes-alertas"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <Activity className="h-4 w-4 text-amber-300" />
            4. Evoluções & Botão ALERTA
          </TabsTrigger>
          <TabsTrigger
            value="relatorios-ia"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            5. Relatórios Otimizados com IA
          </TabsTrigger>
          <TabsTrigger
            value="acessos-admin"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <ShieldCheck className="h-4 w-4 text-[#C9A46A]" />
            6. Aprovando Novos Acessos (Admin)
          </TabsTrigger>
          <TabsTrigger
            value="programas"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <Dumbbell className="h-4 w-4 text-[#C9A46A]" />
            7. Programas de Acompanhamento & Treinos A/B/C
          </TabsTrigger>
          <TabsTrigger
            value="importador-planilha"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#C9A46A]" />
            8. Importar Avaliação (.xlsx)
          </TabsTrigger>
          <TabsTrigger
            value="presencas"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <CalendarCheck2 className="h-4 w-4 text-[#C9A46A]" />
            9. Presença / Confirmação
          </TabsTrigger>
          <TabsTrigger
            value="mesclar-pacientes"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <GitMerge className="h-4 w-4 text-purple-400" />
            10. Mesclar Cadastros (Admin)
          </TabsTrigger>

          <TabsTrigger
            value="pre-cadastro-ativacao"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            11. Pré-Cadastro → Ativação → Prontuário
          </TabsTrigger>

          <TabsTrigger
            value="faq"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] transition-all py-2.5 px-4 flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Dúvidas Frequentes (FAQ)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: COMO ABRIR NOVA AVALIAÇÃO */}
        <TabsContent value="nova-avaliacao" className="space-y-6 pt-2">
          {/* 3 Caminhos Possíveis */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <Plus className="h-3.5 w-3.5" />
                <span>Fluxo 1</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Como abrir uma Nova Avaliação
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Você pode iniciar uma avaliação clínica por qualquer um dos 4 caminhos abaixo,
                incluindo os novos atalhos rápidos de 1 clique:
              </p>
            </div>

            {/* Destaque do Novo Acesso Rápido */}
            <div className="p-4 rounded-2xl bg-[#FAF4EA] border border-[#E3C89A] flex items-start gap-3">
              <Zap className="h-5 w-5 text-[#8C6527] shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <strong className="text-[#8C6527]">
                  Novo Acesso Rápido em 1 Clique (Topbar & Listas):
                </strong>{' '}
                Em qualquer tela do sistema, digite pelo menos 2 letras do paciente na barra do topo
                para abrir o dropdown instantâneo com os botões diretos de{' '}
                <strong>Avaliação</strong>, <strong>Prontuário</strong> e <strong>Evolução</strong>.
                Na tabela de Pacientes e na tela de Prontuários, cada registro agora possui os
                mesmos atalhos dedicados.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Caminho 1 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2 relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  Caminho 1 · Mais comum
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">Pelo Menu Prontuários</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Clique no menu lateral em <strong>"Prontuários"</strong> e depois no botão dourado{' '}
                  <strong>"Nova Avaliação"</strong> no canto superior direito (rota{' '}
                  <code className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-[#8C6527]">
                    /prontuarios/novo
                  </code>
                  ).
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate('/prontuarios/novo')}
                  className="w-full mt-2 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold text-xs rounded-xl h-8"
                >
                  Ir para /prontuarios/novo
                </Button>
              </div>

              {/* Caminho 2 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2 relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B87355] px-2 py-0.5 rounded-md bg-[#FDF2EE] border border-[#E7BFB0]">
                  Caminho 2 · No atendimento
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">
                  Pelo Painel (Consultas de Hoje)
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  No <strong>Painel</strong>, na seção "Consultas de Hoje", cada paciente agendado
                  possui um botão <strong>"Iniciar"</strong>. Clicar nele já abre a avaliação com o
                  paciente e a especialidade pré-selecionados.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/painel')}
                  className="w-full mt-2 border-[#E9E1D2] hover:bg-white text-xs rounded-xl h-8"
                >
                  Ver Consultas de Hoje
                </Button>
              </div>

              {/* Caminho 3 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2 relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#477A53] px-2 py-0.5 rounded-md bg-[#F2F6F1] border border-[#C1D7C4]">
                  Caminho 3 · No histórico
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">Pelo Perfil do Paciente</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Em <strong>Pacientes</strong>, clique no paciente desejado. Na página dele, abra a
                  aba <strong>"Avaliações Clínicas"</strong> e clique no botão correspondente à
                  especialidade desejada (+ Nova Avaliação de Fisio, Personal, etc.).
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/pacientes')}
                  className="w-full mt-2 border-[#E9E1D2] hover:bg-white text-xs rounded-xl h-8"
                >
                  Ir para Pacientes
                </Button>
              </div>
            </div>

            {/* Passo a Passo Detalhado */}
            <div className="pt-4 border-t border-[#E9E1D2] space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Passo a passo durante o preenchimento:
              </h4>

              <div className="space-y-4">
                {/* Passo 1 */}
                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Etapa 1: Selecionar o Paciente e a Especialidade
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Escolha o paciente cadastrado na lista suspensa (com busca por nome e CPF) e
                      selecione uma das 4 especialidades:
                      <strong> Fisioterapia</strong>, <strong>Personal Trainer</strong>,{' '}
                      <strong>Nutrição</strong> ou <strong>Médico</strong>. Depois, clique em{' '}
                      <em>"Prosseguir para Formulário"</em>.
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Etapa 2: Preencher o formulário guiado pelo Stepper
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      O formulário é dividido em abas/etapas claras no topo com barra de progresso.
                      Você pode avançar com "Próxima Etapa", voltar com "Etapa Anterior" ou clicar
                      diretamente em qualquer número da etapa.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Salvar Rascunho sem Sair da Página & Persistência Página a Página
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      • <strong>Salvar Rascunho (botão cinza com disquete):</strong> Salva o
                      formulário <strong>diretamente no servidor e PERMANECE na página</strong> para
                      você continuar o atendimento sem interrupções. Nunca fecha a tela nem
                      redireciona você antes da hora.
                      <br />• <strong>Salvamento automático página a página:</strong> Ao avançar ou
                      alternar qualquer etapa da avaliação (1 a 7 na Fisioterapia, 1 a 8 no
                      Personal), o sistema grava automaticamente o rascunho no servidor e no
                      navegador local (dupla camada de proteção). Se houver oscilação de internet ou
                      recarregamento acidental, nada é perdido no caminho.
                      <br />• <strong>Concluir Avaliação (botão dourado com check):</strong>{' '}
                      Finaliza a avaliação, altera o status de Rascunho para Oficial ("Concluída"),
                      registra a presença automática do paciente, gera o snapshot oficial na
                      Timeline e só então direciona para a visualização do prontuário concluído.
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Botão ANEXAR (Exames, Dinamômetro e Postura)
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Você pode anexar laudos de Ressonância Magnética, Raios-X, relatórios em PDF,
                      exportações do dinamômetro digital e fotos posturais. O sistema aceita
                      múltiplos arquivos e os mantém vinculados ao prontuário para download futuro.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Particularidades por Especialidade */}
            <div className="pt-4 border-t border-[#E9E1D2] space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Particularidades por Especialidade:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fisio */}
                <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs">
                        <Activity className="h-4 w-4" />
                      </span>
                      <h5 className="font-bold text-sm text-[#1D4ED8]">
                        Fisioterapia (Modelo Exclusivo SOUL)
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      Conclusão com IA & Periódicos
                    </span>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>Anamnese em 5 partes:</strong> queixas múltiplas com régua EVA de dor,
                      histórico, bandeiras vermelhas, vísceras e hábitos.
                    </li>
                    <li>
                      <strong>ADM optativa por segmento:</strong> ombro, quadril, joelho, coluna ou
                      tornozelo, apenas os segmentos avaliados no dia.
                    </li>
                    <li>
                      <strong>Força muscular & Dinamômetro:</strong> valores em kgf com ferramenta
                      que extrai leituras automaticamente de relatórios anexados.
                    </li>
                    <li>
                      <strong>Testes especiais:</strong> classificação objetiva em{' '}
                      <em>POSITIVO / NEGATIVO / NÃO REALIZADO</em>.
                    </li>
                    <li>
                      <strong>Seções complementares optativas:</strong> Berg Balance Scale (0-56),
                      Timed Up and Go (TUG), cirtometria com medidas repetidas por fase, goniometria
                      por segmento/movimento e prescrição de palmilha em sub-fluxo próprio.
                    </li>
                    <li>
                      <strong>Gerar Conclusão com IA (Base Científica em Periódicos):</strong> na
                      etapa 7, o assistente inteligente cruza numa síntese relacional explícita:{' '}
                      <em>(1) Queixa principal do paciente</em> ×{' '}
                      <em>(2) Diagnóstico médico e cinético-funcional</em> ×{' '}
                      <em>
                        (3) Achados da avaliação física (ADM, dinamometria/força, testes especiais,
                        Core e laudos de anexos)
                      </em>{' '}
                      × <em>(4) Literatura científica de referência</em> baseada nos principais
                      periódicos:
                      <div className="mt-1.5 p-2 rounded-xl bg-white/80 border border-blue-200 text-[11px] text-gray-700 space-y-1">
                        <div>
                          <strong>Ortopedia e Traumatologia:</strong> JBJS, AJSM, Spine, The Spine
                          Journal, Arthroscopy, RBO.
                        </div>
                        <div>
                          <strong>Medicina Esportiva & Performance:</strong> BJSM, Sports Medicine,
                          MSSE, RBME.
                        </div>
                        <div>
                          <strong>Fisioterapia Esportiva & Reabilitação:</strong> JOSPT, Physical
                          Therapy in Sport, BJPT, Fisioterapia Brasil.
                        </div>
                      </div>
                      Gera hipótese diagnóstica integrada, diagnóstico disfuncional e plano semana a
                      semana de 8 semanas, todos 100% editáveis pelo profissional.
                    </li>
                  </ul>
                </div>

                {/* Personal */}
                <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-bold text-xs">
                        <Dumbbell className="h-4 w-4" />
                      </span>
                      <h5 className="font-bold text-sm text-[#C2410C]">
                        Personal Trainer (Padrão Physical Test)
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      Conclusão com IA & Periódicos
                    </span>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>8 etapas estruturadas:</strong> Anamnese esportiva, Composição
                      corporal com protocolos de dobras (Pollock 3/7, Guedes, Faulkner),
                      Dinamometria manual e lombar, Flexibilidade (Banco de Wells), Postura
                      estática, Core McGill (3 pranchas), FMS (Functional Movement Screen) e Metas.
                    </li>
                    <li>
                      <strong>Cálculos automáticos:</strong> IMC, RCQ, %G, massa gorda e massa magra
                      em tempo real.
                    </li>
                    <li>
                      <strong>
                        Gerar Conclusão com IA na etapa 8 (Periódicos & Cruzamento com Medidas):
                      </strong>{' '}
                      gera a hipótese funcional fundamentada nas principais revistas científicas
                      (MSSE, RBME, BJSM, Sports Medicine, JOSPT, Physical Therapy in Sport, BJPT,
                      AJSM, Spine), relacionando objetivos, composição corporal (%G), assimetrias do
                      dinamômetro, postura, Core McGill e FMS, além de permitir o cruzamento
                      avançado "Objetivos × Fragilidades da Avaliação" com as medidas numéricas
                      exatas e periodização de 12 semanas editável.
                    </li>
                  </ul>
                </div>

                {/* Nutrição */}
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#22C55E] text-white flex items-center justify-center font-bold text-xs">
                      <Apple className="h-4 w-4" />
                    </span>
                    <h5 className="font-bold text-sm text-[#15803D]">Nutrição Clínica</h5>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Formulário em 3 etapas com anamnese ponderal, IMC automático, consumo de água,
                    recordatório alimentar de 24 horas (café, almoço, lanches, jantar) e prescrição
                    do plano alimentar com metas para o próximo retorno.
                  </p>
                </div>

                {/* Médico */}
                <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs">
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <h5 className="font-bold text-sm text-[#6D28D9]">Médico Especialista</h5>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Anamnese médica clássica (HDA, antecedentes e alergias), sinais vitais completos
                    (pressão arterial, frequências cardíaca e respiratória, temperatura), hipótese
                    diagnóstica com CID, exames solicitados e receituário/prescrição médica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: COMO ABRIR UM PRONTUÁRIO */}
        <TabsContent value="abrir-prontuario" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Fluxo 2</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Como abrir um Prontuário Oficial e Visualizar o Documento
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Acesse o documento oficial detalhado de qualquer avaliação já realizada:
              </p>
            </div>
            {/* Dica de Acesso Rápido em 1 Clique */}
            <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-3">
              <Zap className="h-5 w-5 text-[#2563EB] shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <strong className="text-[#1D4ED8]">Acesso Imediato por Nome:</strong> Na barra de
                busca superior do topo ou na tabela de Pacientes, clique no botão{' '}
                <strong>"Prontuário"</strong> de qualquer paciente para abrir a ficha oficial mais
                recente ou a aba de prontuário clínico sem precisar navegar por múltiplas etapas.
              </div>
            </div>
            {/* Passos */}{' '}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Caminho 1: Pela Lista de Prontuários (Geral)
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Acesse o menu lateral <strong>"Prontuários"</strong>. Use a barra de busca para
                    digitar o nome do paciente ou termo da queixa, ou use os filtros por
                    especialidade (Fisioterapia, Personal, Nutrição, Médico). Clique no cartão da
                    avaliação desejada.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Caminho 2: Pelo Histórico em Pacientes (Específico)
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Vá em <strong>Pacientes</strong>, localize a pessoa desejada e clique nela. Na
                    aba <strong>"Timeline"</strong> ou na aba <strong>"Avaliações Clínicas"</strong>
                    , clique sobre a avaliação para abrir o documento completo.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  3
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    O que você visualiza no Prontuário Oficial:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-[#FAF7F1] border border-[#E9E1D2]">
                      <span className="font-bold text-xs text-[#4A322A] block mb-1">
                        Cabeçalho Oficial SOUL
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Logo oficial intacto, identificação do paciente, data da sessão,
                        especialidade e profissional responsável.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF7F1] border border-[#E9E1D2]">
                      <span className="font-bold text-xs text-[#4A322A] block mb-1">
                        Todas as Seções Renderizadas
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Anamnese, gráficos de amplitude, testes especiais, tabelas de Core, escalas
                        e condutas prescritas.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF7F1] border border-[#E9E1D2]">
                      <span className="font-bold text-xs text-[#4A322A] block mb-1">
                        Anexos e Impressão em PDF
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Links diretos para ver exames complementares e botão superior{' '}
                        <em>"Baixar PDF / Imprimir"</em> pronto para impressão limpa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Dica e Opções de Impressão */}
            <div className="p-5 rounded-2xl bg-[#FAF4EA] border border-[#E3C89A] space-y-3">
              <div className="flex items-start gap-3">
                <Printer className="h-5 w-5 text-[#8C6527] shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700 leading-relaxed">
                  <strong className="text-[#8C6527] text-sm block mb-1">
                    Três Opções Oficiais de Impressão no botão "Baixar PDF / Imprimir":
                  </strong>
                  Ao clicar em <em>"Baixar PDF / Imprimir"</em> no topo do prontuário, você tem à
                  disposição:
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-white rounded-xl border border-[#E9E1D2] space-y-1">
                  <strong className="text-xs text-[#6A402D] block">
                    1. Somente Avaliação Clínica
                  </strong>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Imprime o documento institucional apenas com os dados e seções da
                    avaliação/prontuário atual, sem as evoluções SOAP. Ideal para laudos e registros
                    pontuais de entrada ou reavaliação.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E9E1D2] space-y-1">
                  <strong className="text-xs text-[#6A402D] block">
                    2. Avaliação + Evoluções (Tudo)
                  </strong>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Imprime no modelo institucional oficial a avaliação clínica completa seguida de
                    todas as evoluções SOAP assinadas do paciente em ordem cronológica, com quebras
                    de página limpas e rodapé oficial.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#D5AE6F] bg-gradient-to-br from-[#FAF5EE] to-white space-y-1">
                  <strong className="text-xs text-[#6A402D] flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-[#C9A46A]" />
                    3. Resumo de Evolução com IA
                  </strong>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    A IA analisa todas as avaliações e sessões SOAP do paciente e sintetiza as
                    principais queixas tratadas, data de início, incidência de lesões, trajetória da
                    dor (EVA inicial vs. atual), estado de saúde geral e diretrizes. Editável e
                    imprimível no Modelo Institucional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: COMO IR ATUALIZANDO O PRONTUÁRIO */}
        <TabsContent value="atualizar-prontuario" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Fluxo 3</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Como ir Atualizando o Prontuário ao Longo do Tratamento
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Entenda o ciclo contínuo de evolução clínica e reavaliações do paciente:
              </p>
            </div>

            <div className="space-y-4">
              {/* Passo 1 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Editar uma Avaliação Existente (Revisões ou Rascunhos)
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Ao abrir qualquer prontuário salvo, clique no botão <strong>"Editar"</strong> no
                    topo. Se a avaliação estava como "Rascunho", você voltará ao formulário com
                    todos os dados preenchidos anteriormente para continuar. Se já estava
                    "Concluída", você pode ajustar condutas, corrigir informações ou anexar novos
                    laudos trazidos pelo paciente.
                  </p>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Ciclo de Reavaliação: Criar uma Nova Avaliação Periódica
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    A melhor prática clínica é manter o histórico original intacto e{' '}
                    <strong>abrir uma NOVA avaliação</strong> quando o paciente completar um ciclo
                    (ex.: após 10 sessões de reabilitação, ou após 12 semanas de treino no
                    Personal). Dessa forma, o paciente terá a avaliação inicial (marco zero) e as
                    reavaliações subsequentes registradas em sequência.
                  </p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  3
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Comparativos Automáticos (Δ Variação em cm e Assimetrias)
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    O sistema compara medidas automaticamente para você:
                    <br />• <strong>Cirtometria:</strong> ao adicionar uma nova fase (ex: "Fase 2 -
                    Reavaliação"), o sistema calcula a variação em centímetros (Δ cm) comparando o
                    membro acometido e sadio.
                    <br />• <strong>Goniometria:</strong> compara amplitudes bilaterais (lado
                    direito vs. esquerdo) apontando assimetrias articulares.
                    <br />• <strong>Physical Test:</strong> acompanha a evolução do %G, peso e
                    testes de força ao longo das baterias.
                  </p>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  4
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Timeline Cronológica Unificada
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Cada avaliação concluída e cada consulta agendada entram automaticamente na{' '}
                    <strong>Timeline do paciente</strong> (visível em Pacientes → perfil do
                    paciente). Os eventos são coloridos pela especialidade (azul para Fisioterapia,
                    laranja para Personal, verde para Nutrição, roxo para Medicina), proporcionando
                    uma visão 360° do tratamento.
                  </p>
                </div>
              </div>

              {/* Passo 5 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  5
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Regenerar com IA quando os dados mudarem
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Se você alterar os testes especiais, a ADM ou os valores do dinamômetro, basta
                    clicar novamente em <strong>"Gerar com IA / Regenerar"</strong> na última etapa.
                    O assistente reprocessará os novos achados clínicos e atualizará a hipótese e o
                    plano semanal correspondente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: EVOLUÇÕES & BOTÃO ALERTA */}
        <TabsContent value="evolucoes-alertas" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                <Bell className="h-3.5 w-3.5 text-amber-600 fill-amber-500/20" />
                <span>Padrão Clínico Brasileiro</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Evoluções do Paciente (Sessões) e Botão ALERTA
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Como registrar sessões diárias pelo modelo SOAP e programar tarefas e lembretes
                automáticos na Agenda Clínica.
              </p>
            </div>

            {/* Dica de Acesso Rápido às Evoluções */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <Zap className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 leading-relaxed">
                <strong className="text-emerald-900">Atalho Direto para Evolução:</strong> Para ir
                direto para o registro ou consulta de sessões SOAP do paciente, basta clicar no
                botão verde <strong>"Evolução"</strong> na listagem de Pacientes, nos cartões de
                Prontuários ou no dropdown da busca global no topo do sistema.
              </div>
            </div>

            {/* Passo a Passo Estilo Círculos Dourados */}
            <div className="space-y-5 pt-2">
              {/* Passo 1 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Acessar as Evoluções dentro do Prontuário
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Na tela de Visualização do Prontuário (<code>/prontuarios/:id</code>), utilize
                    as abas no topo para alternar entre{' '}
                    <strong>"Avaliação Clínica (Prontuário Oficial)"</strong> e{' '}
                    <strong>"Evoluções do Paciente (Sessões)"</strong>. O contador de sessões já
                    registradas aparece na aba.
                  </p>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Registrar Sessões com o Modelo SOAP ou Evolução Rápida
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Clique em <strong>"Nova Evolução"</strong> para abrir o modal clínico
                    padronizado (mesmo padrão dos principais softwares como Amplimed, Ninsaúde e
                    iClinic):
                    <br />• <strong>Régua de EVA da Dor (0 a 10):</strong> logo acima do bloco
                    Subjetivo, selecione o nível de dor relatado na sessão com cores padronizadas da
                    SOUL (verde/azul para 0–3 Sem dor/Leve, âmbar 4–6 Moderada, vermelho 7–10
                    Intensa). Para agilizar seu processo clínico diário, o sistema
                    <strong>
                      {' '}
                      pré-carrega automaticamente o último valor de EVA registrado
                    </strong>{' '}
                    para aquele paciente e exibe a data como referência, bastando 1 clique para
                    manter ou ajustar.
                    <br />• <strong>S (Subjetivo):</strong> relato do paciente, queixas do dia e
                    resposta aos exercícios domiciliares (o valor da EVA fica registrado e
                    associado).
                    <br />• <strong>O (Objetivo):</strong> mensurações, goniometria do dia, testes
                    físicos executados, palpação.
                    <br />• <strong>A (Avaliação):</strong> análise clínica do profissional e
                    raciocínio terapêutico.
                    <br />• <strong>P (Plano):</strong> planejamento da próxima sessão e
                    orientações.
                    <br />• <strong>Conduta / Procedimentos:</strong> exercícios realizados, séries,
                    técnicas de terapia manual ou eletroterapia.
                    <br />
                    <em>
                      Dica: Para anotações diretas sem subdivisões, alterne para "Evolução Rápida
                      (Texto Único)".
                    </em>
                  </p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  3
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Salvar e Assinar: Conceito de Documento Clínico Fechado e Imutável
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Em conformidade com as normas do Conselho Federal de Fisioterapia e Terapia
                    Ocupacional (COFFITO), Conselho Federal de Medicina (CFM), CREF e CFN:
                    <br />• <strong>Fluxo Padrão:</strong> Ao clicar no botão dourado{' '}
                    <strong>"Salvar e Assinar (Documento Fechado)"</strong>, a evolução recebe
                    imediatamente o selo de assinatura digital da Clínica SOUL com nome completo do
                    profissional responsável, especialidade, número de registro exclusivo (ex:{' '}
                    <code>EVO-2026-XXXXXX</code>) e{' '}
                    <strong>carimbo temporal exato gerado no servidor</strong> (não adulterável no
                    cliente).
                    <br />• <strong>Imutabilidade Absoluta:</strong> A partir do momento em que é
                    assinada, a evolução passa a ser um <em>documento fechado</em>. Ela{' '}
                    <strong>NÃO pode ser editada nem excluída</strong>, nem pela interface nem
                    diretamente na API. Os botões de editar e excluir são bloqueados.
                    <br />• <strong>Rascunhos Editáveis:</strong> Se você ainda não concluiu a
                    sessão e deseja continuar depois, utilize o botão{' '}
                    <em>"Salvar como Rascunho"</em>. Evoluções em rascunho permanecem editáveis e
                    podem ser removidas até serem assinadas.
                    <br />• <strong>Como fazer correções?</strong> Conforme as boas práticas legais
                    de prontuário eletrônico, documentos assinados nunca são sobrescritos. Para
                    retificar ou acrescentar informações a uma sessão já fechada, clique no botão{' '}
                    <strong>"Evolução Corretiva"</strong> no card da evolução assinada: o sistema
                    abre uma nova evolução pré-preenchida com referência formal ao registro
                    anterior, preservando o histórico e a rastreabilidade completa.
                  </p>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  4
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Botão ALERTA: Lembrete Automático na Agenda
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    No topo do prontuário ou em qualquer evolução clínica, clique no botão âmbar{' '}
                    <strong>"ALERTA"</strong> com ícone de sino:
                    <br />• <strong>O que lembrar:</strong> digite o item (ex:{' '}
                    <em>"Reavaliar goniometria de ombro"</em>,{' '}
                    <em>"Refazer cirtometria — Fase 2"</em>, <em>"Reaplicar FMS"</em>) ou escolha
                    uma das sugestões rápidas.
                    <br />• <strong>Quando lembrar:</strong> selecione o atalho{' '}
                    <strong>"Daqui a 30 dias"</strong> (calcula a data automaticamente) ou clique em{' '}
                    <strong>"Data específica"</strong> para escolher o dia e horário exatos.
                    <br />• Ao confirmar, a tarefa é{' '}
                    <strong>lançada automaticamente na Agenda Clínica</strong> com destaque visual
                    âmbar e sininho de alerta, além de ser registrada na Timeline do paciente.
                  </p>
                </div>
              </div>

              {/* Passo 5: Sincronização Google Agenda Bidirecional (Entrada e Saída) */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  5
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Sincronização com Google Agenda (Importação Secreta e Feed de Saída)
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    A Agenda do Sistema SOUL oferece duas formas complementares de integração com o
                    Google Calendar, sem exigir senhas ou OAuth:
                    <br />• <strong>
                      A. Importar Google para o SOUL (Entrada Automática):
                    </strong> Na
                    tela <strong>Agenda</strong>, clique em{' '}
                    <strong>"Sincronizar com Google Agenda"</strong> → aba{' '}
                    <em>"Importar Google para SOUL"</em>. Cole o seu{' '}
                    <em>Endereço secreto em formato iCal</em> do Google Agenda. O sistema baixa seus
                    compromissos externos imediatamente e os sincroniza automaticamente a cada 15
                    minutos em segundo plano (via rotina cron do servidor). Eles aparecem destacados
                    com o selo dourado <strong>Google</strong> em modo <em>somente leitura</em>,
                    permitindo que você visualize todos os seus compromissos pessoais e
                    profissionais em um só lugar sem alterar as consultas da clínica.
                    <br />• <strong>Como obter o Endereço Secreto no Google Calendar:</strong>{' '}
                    Acesse <code>calendar.google.com</code> pelo computador → Configurações (ícone
                    de engrenagem) → selecione seu calendário principal na barra lateral → role até{' '}
                    <strong>"Integrar calendário"</strong> → copie o{' '}
                    <strong>"Endereço secreto em formato iCal"</strong> (não o público).
                    <br />• <strong>B. Exportar SOUL para seu Celular (Saída):</strong> Na aba{' '}
                    <em>"Exportar SOUL para Celular"</em>, copie o seu link de feed .ics pessoal
                    gerado pelo servidor SOUL e adicione-o no Google Agenda em{' '}
                    <em>"Outros calendários → Do URL"</em> para acompanhar consultas e alertas de
                    reavaliação no celular.
                    <br />• <strong>Diferença prática:</strong> A importação traz seus compromissos
                    do Google Agenda para dentro da tela de Agenda do SOUL a cada 15 min; a
                    exportação leva as consultas criadas na SOUL para o app do Google Agenda no seu
                    celular.
                  </p>
                </div>
              </div>

              {/* Passo 6 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  6
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Sincronização com o Perfil do Paciente e Impressão / PDF
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    • <strong>Perfil do Paciente e Gráfico de Trajetória da Dor:</strong> Todas as
                    evoluções aparecem organizadas na aba "Evoluções" do paciente e na Timeline com
                    as cores de cada especialidade, selo de documento fechado, assinatura digital e
                    o chip colorido da <strong>EVA (ex: EVA 3/10 • Leve)</strong>. Além disso, um{' '}
                    <strong>gráfico de linha interativo da Trajetória da Dor</strong> exibe o delta
                    de melhora entre a primeira e a última sessão avaliada.
                    <br />• <strong>Impressão / PDF:</strong> O prontuário oficial preserva o
                    cabeçalho oficial SOUL com o logotipo em alta definição, layout A4, linha de
                    assinatura, valor exato da EVA destacada no bloco Subjetivo (
                    <code>[EVA: X/10]</code>) e anexo completo de todas as evoluções clínicas
                    assinadas com seus respectivos identificadores e carimbos de auditoria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: RELATÓRIOS OTIMIZADOS COM IA */}
        <TabsContent value="relatorios-ia" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 fill-amber-500/20" />
                <span>SOUL IA Nativa · Comunicação Interprofissional</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Emissão de Relatórios Otimizados com IA
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Como transformar os dados do prontuário em laudos, resumos para médicos, personal
                trainers ou pacientes em segundos, orientados pela sua necessidade em linguagem
                livre.
              </p>
            </div>

            {/* Destaque do Botão RELATÓRIO IA */}
            <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#8C6527] shrink-0 mt-0.5" />
              <div className="text-xs text-[#73574A] leading-relaxed">
                <strong className="text-[#4A322A]">Botão Dourado no Prontuário:</strong> Na tela de
                visualização do prontuário (<code>/prontuarios/:id</code>), clique no botão{' '}
                <strong>"RELATÓRIO IA"</strong> localizado no cabeçalho superior direito.
              </div>
            </div>

            <div className="space-y-5 pt-2">
              {/* Passo 1 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Descrever a Necessidade em Linguagem Livre
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    No campo de instrução, digite com suas palavras o objetivo do documento. Por
                    exemplo:
                    <br />•{' '}
                    <em>
                      "Relatório para o médico ortopedista resumindo a anamnese, os testes especiais
                      positivos e a conduta proposta."
                    </em>
                    <br />•{' '}
                    <em>
                      "Parecer biomecânico para o personal trainer com amplitudes seguras e
                      recomendações de carga."
                    </em>
                    <br />• <em>"Resumo didático e acolhedor para o paciente levar para casa."</em>
                    <br />•{' '}
                    <em>"Relatório pericial/jurídico cronológico com datas e dados objetivos."</em>
                    <br />
                    Você também pode clicar nos <strong>modelos rápidos sugeridos</strong> para
                    preencher o prompt instantaneamente.
                  </p>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Estrutura Oficial das 6 Seções Numeradas
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    O agente nativo da Skip Cloud (<code>relatorios-clinica-soul</code>) lê os dados
                    reais da avaliação e redige o documento organizado rigorosamente no{' '}
                    <strong>Modelo Institucional de Documentos da Clínica SOUL</strong> nas 6 seções
                    oficiais:
                    <br />
                    <strong>1. OBJETIVO DO RELATÓRIO</strong> · Finalidade e contexto do documento.
                    <br />
                    <strong>2. HISTÓRICO E QUEIXA PRINCIPAL</strong> · Anamnese, cronologia,
                    sintomas e dor (EVA).
                    <br />
                    <strong>3. AVALIAÇÃO CLÍNICA E FUNCIONAL</strong> · ADM, dinamometria, testes
                    especiais, postura e dados instrumentais.
                    <br />
                    <strong>4. INTERPRETAÇÃO DOS ACHADOS</strong> · Relação clínica, déficits,
                    assimetrias e hipótese funcional.
                    <br />
                    <strong>5. CONDUTA / PLANO DE TRATAMENTO</strong> · Objetivos, recursos,
                    frequência e metas de reavaliação.
                    <br />
                    <strong>6. CONSIDERAÇÕES FINAIS</strong> · Conclusão clínica, orientações e
                    próximos passos.
                  </p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  3
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Padrão Visual Institucional e Impressão A4 sem Sobreposição
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    • <strong>Identidade Visual Oficial:</strong> Paleta Marrom SOUL (#6A402D),
                    Dourado Champagne (#D5AE6F), Bege Claro (#F7F2EC) no bloco PACIENTE, títulos em
                    Cormorant Garamond e seções em Montserrat caixa alta.
                    <br />• <strong>Visualização e Edição Livre:</strong> Alterne entre a
                    visualização oficial diagramada ou o editor de texto para fazer ajustes manuais
                    antes do envio.
                    <br />• <strong>Impressão / PDF A4 Perfeito:</strong> O CSS de impressão foi
                    otimizado para eliminar qualquer sobreposição visual. O documento sai limpo, em
                    folha A4 com logo no topo com respiro, linha dourada divisória, dados do
                    paciente, seções numeradas, bloco de assinatura e rodapé padrão da Clínica SOUL.
                    <br />• <strong>Copiar e Regenerar:</strong> Copie o texto puro para
                    WhatsApp/e-mail com um clique ou solicite nova redação da IA caso queira
                    enfatizar outros pontos.
                  </p>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  4
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Histórico Persistido e Auditoria Clínica
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Cada relatório gerado fica salvo na coleção <code>relatorios_ia</code> vinculado
                    ao prontuário. Na aba <strong>"Histórico"</strong> do modal, qualquer
                    profissional autorizado pode reabrir, revisar e reimprimir relatórios
                    anteriores. A emissão também gera log automático na trilha de auditoria clínica
                    e notificação para a administração.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 6: APROVANDO NOVOS ACESSOS (ADMIN) */}
        <TabsContent value="acessos-admin" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C9A46A]" />
                <span>Gestão & Governança da Clínica</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Perfis de Acesso: Visão do Profissional vs. Administrativa
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                O Sistema SOUL separa com precisão os perfis de acesso para garantir sigilo ético,
                foco clínico no paciente e proteção de dados estratégicos da clínica.
              </p>
            </div>

            {/* Comparativo de Perfis: Profissional vs Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#C9A46A]/60 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]">
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#4A322A]">
                      Perfil Profissional (Restrito)
                    </h4>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Foco no Cuidado Clínico
                    </span>
                  </div>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong>Dashboard Clínico Exclusivo:</strong> exibe apenas as consultas do dia
                    daquele profissional, seus pacientes em acompanhamento e suas evoluções no mês.
                  </li>
                  <li>
                    <strong>Sem Números Globais:</strong> não tem acesso a faturamento, relatórios
                    gerais, volume de outros colegas ou estatísticas amplas da clínica.
                  </li>
                  <li>
                    <strong>Acesso a Clientes e Cadastro:</strong> pode cadastrar novos pacientes,
                    buscar prontuários e gerenciar atendimentos.
                  </li>
                  <li>
                    <strong>Avaliações e Evoluções:</strong> cria e edita laudos clínicos em seu
                    nome com vinculação direta (<code>user_id</code>).
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#4A322A]/30 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#FAF4EA] text-[#4A322A] border border-[#E3C89A]">
                    <ShieldCheck className="h-4 w-4 text-[#C9A46A]" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#4A322A]">
                      Perfil Administrador (Gestão)
                    </h4>
                    <span className="text-[10px] text-[#4A322A] font-semibold bg-[#FAF4EA] px-2 py-0.5 rounded-full border border-[#C9A46A]/50">
                      Governança Total
                    </span>
                  </div>
                </div>
                <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    <strong>Dashboard Estratégico:</strong> métricas agregadas da clínica toda,
                    distribuição de atendimentos por especialidade e satisfação.
                  </li>
                  <li>
                    <strong>Aba Relatórios e Acessos:</strong> exclusiva para o administrador, com
                    filtros avançados e exportações.
                  </li>
                  <li>
                    <strong>Aprovação e Auditoria:</strong> aprova novos cadastros, define
                    especialidade e consulta trilhas completas de auditoria.
                  </li>
                  <li>
                    <strong>Segurança RLS ativa:</strong> permissões validadas diretamente no banco
                    de dados em cada requisição.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-lg font-serif font-bold text-[#4A322A]">
                Como Autorizar e Monitorar Novos Acessos Profissionais
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Para garantir a segurança, sigilo ético e proteção de dados clínicos da Clínica
                SOUL,{' '}
                <strong>
                  nenhum profissional consegue acessar o sistema sem a sua autorização expressa
                </strong>
                . Ao aprovar, o sistema atribui automaticamente o perfil profissional.
              </p>
            </div>

            {/* Como funciona o fluxo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  Etapa 1 · O Profissional
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">Cadastro em /signup</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  O fisioterapeuta, educador físico ou médico cria sua conta na tela de cadastro
                  informando nome, e-mail e especialidade. O cadastro entra automaticamente em
                  estado <strong>Pendente de Aprovação</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B87355] px-2 py-0.5 rounded-md bg-[#FDF2EE] border border-[#E7BFB0]">
                  Etapa 2 · Tentativa de Login
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">Bloqueio Seguro</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Se o profissional tentar entrar antes da sua liberação, ele recebe uma mensagem
                  clara: <em>"Sua conta aguarda aprovação da administração da clínica"</em> e o
                  backend bloqueia qualquer acesso a prontuários.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#477A53] px-2 py-0.5 rounded-md bg-[#F2F6F1] border border-[#C1D7C4]">
                  Etapa 3 · Você (Admin)
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">Aprovação em 1 Clique</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  No menu lateral, clique em <strong>"Acessos"</strong>. Na aba{' '}
                  <strong>"Pendentes"</strong>, você vê nome, e-mail, especialidade e data do
                  pedido. Basta clicar em <strong>"Aprovar Acesso"</strong> para liberar o
                  profissional imediatamente.
                </p>
              </div>
            </div>

            {/* Passo a Passo do Administrador */}
            <div className="pt-4 border-t border-[#E9E1D2] space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Passo a passo no painel "Acessos":
              </h4>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Acessar a página de Acessos
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Clique no item <strong>"Acessos"</strong> do menu lateral (visível
                      exclusivamente para administradores da clínica).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Aprovar ou Recusar solicitações pendentes
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Na aba <strong>"Pendentes"</strong>, revise quem solicitou o acesso. Clique em{' '}
                      <strong>"Aprovar Acesso"</strong> para liberar o usuário ou em{' '}
                      <strong>"Recusar"</strong> para vetar a entrada.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Suspender acessos e derrubar sessões ativas imediatamente
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Na aba <strong>"Ativos"</strong>, caso precise revogar o acesso de um
                      profissional que não atua mais na clínica, basta clicar no botão{' '}
                      <strong>"Suspender"</strong>. O servidor invalida os tokens de autenticação
                      instantaneamente, desconectando qualquer sessão aberta naquele momento.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Consultar a Auditoria de Acessos
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Na aba <strong>"Auditoria de Acessos"</strong>, veja todos os eventos
                      registrados: quem aprovou ou suspendeu quem, data e hora exatas, tentativas de
                      login bloqueadas e logins realizados com sucesso.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    5
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-[#33221C]">
                      Auditoria de Atualizações Clínicas & Notificações em Tempo Real
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Para conformidade e segurança clínica, cada criação ou edição em avaliações
                      (Fisioterapia, Personal, Nutrição, Médico), prontuários e assinaturas de
                      evoluções gera um registro de auditoria gravado diretamente pelo servidor na
                      aba <strong>"Atualizações Clínicas"</strong> (em <code>/acessos</code>). O
                      histórico empilha cronologicamente o nome do profissional, seu e-mail, ação,
                      especialidade, paciente e carimbo temporal exato do servidor. Além disso, o
                      ícone de sino no topo do sistema exibe alertas imediatos para o administrador
                      com link direto para o registro modificado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Button
                onClick={() => navigate('/acessos')}
                className="bg-[#4A322A] hover:bg-[#3D2922] text-[#FAF4EA] rounded-xl text-xs font-semibold h-10 px-5 flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-[#C9A46A]" />
                Abrir Painel de Acessos Agora
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/acessos?tab=atualizacoes')}
                className="border-[#C9A46A]/60 text-[#4A322A] hover:bg-[#FAF4EA] rounded-xl text-xs font-semibold h-10 px-4 flex items-center gap-2"
              >
                <Activity className="h-4 w-4 text-[#8C6527]" />
                Ver Atualizações Clínicas
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 6: PROGRAMAS DE ACOMPANHAMENTO & DIVISÃO DE TREINOS A, B, C */}
        <TabsContent value="programas" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Módulo de Periodização de Treino & Acompanhamento</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Programas de Acompanhamento: Divisão em Múltiplos Treinos por Semana (Treino A, B,
                C...)
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Prescreva rotinas personalizadas com múltiplos treinos independentes em cada semana,
                atendendo a alunos que executam exercícios diferentes para cada dia da semana com
                objetivos distintos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  Etapa 1 · Matriz & Metas
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">Metas e Semanas</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Defina os objetivos prioritários do aluno (ex: Fortalecimento de Core, Hipertrofia
                  de MMII, Mobilidade Torácica). A matriz visual de periodização mapeia a cobertura
                  de cada meta ao longo das semanas do programa.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B87355] px-2 py-0.5 rounded-md bg-[#FDF2EE] border border-[#E7BFB0]">
                  Etapa 2 · Divisão Flexível
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">
                  Múltiplos Treinos na Semana
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Dentro de cada semana, clique em <strong>"Novo Treino"</strong> para criar
                  divisões nomeáveis (ex: <em>Treino A</em>, <em>Treino B</em>, <em>Treino C</em>,
                  ou <em>"Pernas & Glúteo"</em>, <em>"Superiores"</em>). Você pode renomear e
                  excluir divisões a qualquer momento com facilidade.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#477A53] px-2 py-0.5 rounded-md bg-[#F2F6F1] border border-[#C1D7C4]">
                  Etapa 3 · Entrega & Carga
                </span>
                <h4 className="font-bold text-sm text-[#4A322A] mt-2">
                  Link do Aluno & Curva de Carga
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  O aluno recebe um link público direto ou PDF onde cada treino (A, B, C) é exibido
                  como um bloco organizado com fotos e vídeos explicativos. A curva de carga
                  registra e grafica a evolução de kg ao longo das semanas por exercício.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9E1D2] space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Recursos Chave dos Treinos por Semana:
              </h4>

              <ul className="text-xs text-gray-700 space-y-2 list-disc pl-5 leading-relaxed">
                <li>
                  <strong>Criação Automática de Treino A:</strong> semanas recém-criadas ou
                  programas legados recebem automaticamente o "Treino A" padrão, mantendo
                  compatibilidade e agilidade imediata.
                </li>
                <li>
                  <strong>Banco de Exercícios Integrado:</strong> puxe exercícios com foto, link de
                  execução, séries, contagem de reps ou segundos e tempo de intervalo diretamente do
                  catálogo ou adicione livremente.
                </li>
                <li>
                  <strong>Renomeação em Linha:</strong> clique no ícone de lápis em qualquer aba de
                  treino para ajustar o nome da divisão (ex: "Treino A - Peito e Tríceps") e
                  pressione Enter.
                </li>
                <li>
                  <strong>Visualização Clara para o Cliente (/programas/:id/cliente):</strong> na
                  versão entregue ao aluno e no PDF de impressão, cada bloco de treino aparece com
                  banner estilizado nas cores SOUL (dourado/rosé), ícones e instruções de execução.
                </li>
                <li>
                  <strong>Evolução e Curva de Carga:</strong> registros de carga continuam
                  vinculados a cada exercício, permitindo plotar o gráfico de progressão mesmo
                  quando o exercício faz parte de um treino específico.
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* TAB 7: IMPORTADOR DE AVALIAÇÃO VIA PLANILHA */}
        <TabsContent value="importador-planilha" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Módulo de Importação Inteligente</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Importador de Avaliações e Histórico Clínico (.xlsx)
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Cadastre pacientes e insira avaliações completas de Fisioterapia com evolução
                histórica diretamente a partir de suas planilhas de avaliação anteriores.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  1. Processamento Local
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">100% no Navegador</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  O arquivo da planilha é lido e interpretado na memória do seu próprio navegador
                  web, garantindo total sigilo dos dados do paciente e rapidez no processamento.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  2. Mapeamento Tolerante
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Detecção Multiabas</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Reconhece abas como <em>ANAMNESE</em>, <em>EXAME FÍSICO</em>, <em>Evolução</em>,{' '}
                  <em>Testes Funcionais</em>, <em>Cirtometria</em> e <em>Goniometria</em>, tolerando
                  acentuação e pontuações variadas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  3. Sem Perda de Dados
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Bloco Dados Importados</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Qualquer informação complementar, como laudos de exames extensos ou testes
                  específicos, é preservada dentro de uma seção especial na avaliação oficial.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#E9E1D2]">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Como realizar a importação passo a passo:
              </h4>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong>Onde encontrar o botão:</strong> Em <strong>Pacientes</strong> (no topo
                    da lista) ou dentro do perfil de qualquer paciente, clique no botão{' '}
                    <strong>"Importar Avaliação (Planilha)"</strong>.
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong>Upload do arquivo:</strong> Arraste ou selecione a pasta de trabalho{' '}
                    <code>.xlsx</code> com a avaliação do paciente.
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong>Revisão e Vínculo:</strong> O sistema buscará o paciente pelo CPF ou
                    Nome. Se já existir, a avaliação será vinculada a ele; caso contrário, um novo
                    cadastro será criado. Você pode revisar e editar qualquer campo antes de
                    confirmar.
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <strong>Histórico de Evolução:</strong> As anotações de evolução são agrupadas
                    por data e criadas como rascunhos não assinados, respeitando os requisitos
                    legais de prontuário.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 8: NOVO PROCESSO DE PRESENÇA / CONFIRMAÇÃO */}
        <TabsContent value="presencas" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                <span>Novo Processo Operacional</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Processo de Presença / Confirmação de Atendimentos (Controle Mensal)
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Controle de presença mensal dos pacientes e alunos com escopo por mês, diferenciado
                conforme o papel de acesso: painel analítico completo para administradores e fluxo
                direto e descomplicado para colaboradores.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  1. Automação por Prontuário
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">
                  Lançamento Automático em Evoluções
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ao <strong>assinar ou finalizar uma evolução de prontuário</strong> (ou ao
                  concluir uma avaliação clínica), o sistema <strong>gera automaticamente</strong> o
                  lançamento de presença com status <em>Presente</em>, área/serviço da especialidade
                  (dos 13 serviços oficiais), data do atendimento, profissional responsável e rastro
                  no campo de observação. Sem esforço manual!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  2. Navegação Mensal e Período Livre
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">
                  Por Mês ou Período Personalizado
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Colaboradores contam com navegação ágil mês a mês (‹ Mês Anterior | [Mês/Ano] |
                  Próximo Mês ›). Já os administradores contam com o seletor entre{' '}
                  <strong>"Por Mês"</strong> e <strong>"Período Personalizado"</strong>, permitindo
                  consultar qualquer intervalo digitado livremente (ex: 15/09/2026 até 14/10/2026)
                  com validação de datas e atalho rápido "Mês atual".
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  3. Visão do Administrador
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Painel Analítico e Exportações</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  O administrador visualiza os cards de estatísticas (Total no período, Confirmados,
                  Pacientes únicos e Profissionais ativos), painel de filtros combináveis (paciente,
                  profissional, serviço, status), 3 modos de visualização (Lista, Por Profissional e
                  Por Paciente) e exportação em Excel (<code>.xlsx</code>) e PDF/Imprimir refletindo
                  o intervalo exato selecionado.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  4. Visão do Colaborador
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Simples, Direta e Sem Ruído</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Para fisioterapeutas, personais e demais colaboradores, a página exibe no topo o
                  botão
                  <strong>"+ Lançar Presença"</strong> (para atendimentos que não geram prontuário)
                  e, abaixo, a lista com os atendimentos dele no mês selecionado (tanto os
                  automáticos vindos de evoluções quanto os lançados manualmente).
                </p>
              </div>
            </div>
            <div className="space-y-4 pt-2 border-t border-[#E9E1D2]">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Diferenças entre o Papel de Administrador e o Colaborador:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FAF4EA] border border-[#E3C89A] space-y-2">
                  <span className="font-bold text-sm text-[#8C6527] block">
                    👑 Administrador (gcdealmeida@gmail.com)
                  </span>
                  <ul className="text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>Cards estatísticos do período:</strong> Total do período, confirmados,
                      pacientes únicos atendidos e profissionais ativos recalculados em tempo real.
                    </li>
                    <li>
                      <strong>Busca por Período Livre:</strong> toggle entre "Por Mês" e "Período
                      Personalizado" com dois campos de calendário (Data Inicial e Data Final),
                      botão "Aplicar" e atalho para o mês atual.
                    </li>
                    <li>
                      <strong>Painel de filtros combináveis:</strong> busca textual, seleção de
                      paciente, filtro por qualquer profissional da clínica, área e status.
                    </li>
                    <li>
                      <strong>3 Visualizações:</strong> Lista Cronológica geral, agrupamento Por
                      Profissional e agrupamento Por Paciente — todas respeitando o período
                      filtrado.
                    </li>
                    <li>
                      <strong>Exportação e Relatório Inteligentes:</strong> exportação em Excel (
                      <code>.xlsx</code>) com nome refletindo o período exato (ex:{' '}
                      <code>presencas_15-09-2026_a_14-10-2026.xlsx</code> ou por mês) e
                      impressão/PDF com cabeçalho oficial SOUL indicando o intervalo pesquisado.
                    </li>
                    <li>
                      <strong>Lançamento flexível:</strong> pode atribuir presenças para si ou em
                      nome de qualquer profissional da equipe.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#F0F5FA] border border-[#BFDBFE] space-y-2">
                  <span className="font-bold text-sm text-[#2563EB] block">
                    👤 Colaborador (Fisio, Personal, Nutri, etc.)
                  </span>
                  <ul className="text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>Página simples e limpa:</strong> sem cards agregados de estatística e
                      sem painel de filtros complexos, focada 100% no trabalho diário.
                    </li>
                    <li>
                      <strong>Botão em destaque no topo:</strong> "+ Lançar Presença" com o
                      profissional já pré-selecionado como ele mesmo.
                    </li>
                    <li>
                      <strong>Lista cronológica própria:</strong> exibe apenas os pacientes e/ou
                      alunos que vieram com ele no mês selecionado.
                    </li>
                    <li>
                      <strong>Navegação mensal preservada:</strong> pode avançar ou retroceder meses
                      para conferir atendimentos passados ou voltar ao "Mês atual".
                    </li>
                    <li>
                      <strong>Autonomia com segurança:</strong> pode visualizar, editar ou excluir
                      seus próprios lançamentos com rastreamento completo na auditoria clínica.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#E9E1D2]">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Como utilizar o módulo passo a passo:
              </h4>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong>Acessar o Menu:</strong> No menu lateral, clique em{' '}
                    <strong>"Presença / Confirmação"</strong> (rota <code>/presencas</code>).
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong>Navegar no Mês ou Escolher Período Personalizado:</strong> Utilize o
                    seletor mensal com setas (ex.: "Fevereiro de 2026") ou, se for administrador,
                    alterne para <strong>"Período Personalizado"</strong> e digite o intervalo
                    desejado (ex: 15/09/2026 a 14/10/2026) clicando em "Aplicar".
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong>Lançamento Automático ou Manual:</strong> <br />•{' '}
                    <strong>Automático:</strong> Ao preencher e assinar a evolução clínica do
                    paciente (ou ao concluir uma avaliação), a presença entra{' '}
                    <em>instantaneamente</em> na lista com status "Presente", vinculada ao
                    profissional que atendeu e com a nota de origem (ex.:{' '}
                    <code>Gerado automaticamente pela evolução EVO-2026-XXXX</code>).
                    <br />• <strong>Manual:</strong> Se precisar registrar um atendimento avulso sem
                    prontuário, clique no botão dourado <strong>"+ Lançar Presença"</strong>,
                    selecione o paciente, confirme a data, serviço oficial e status.
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <strong>Conferência e Acompanhamento:</strong> O colaborador confere sua lista
                    de pacientes atendidos no mês; o administrador visualiza contadores e pode
                    cruzar filtros por equipe ou exportar relatórios gerenciais em XLSX ou PDF.
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    5
                  </div>
                  <div>
                    <strong>Auditoria e Governança Clínica:</strong> Toda ação de registro, edição
                    ou exclusão de presença gera registro nos logs de auditoria e notifica a
                    administração automaticamente.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 11: PRÉ-CADASTRO → ATIVAÇÃO → PRONTUÁRIO */}
        <TabsContent value="pre-cadastro-ativacao" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Fluxo de Entrada & Captação Digital</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Pré-Cadastro Público, Lembrete no Painel e Ativação de Prontuário
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Como novos clientes preenchem o link público da clínica e aparecem instantaneamente
                no painel geral para ativação e abertura do prontuário oficial.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E3C89A] flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#8C6527] shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <strong className="text-[#8C6527]">Lembrete Automático no Painel Geral:</strong>{' '}
                Toda vez que um cliente novo preenche o link de pré-avaliação (
                <code>/pre-cadastro</code>), o card{' '}
                <strong>"Pré-Cadastros Aguardando Abertura de Prontuário"</strong> aparece em
                destaque logo no início do Dashboard. Ele mostra o nome do cliente, data de
                preenchimento, contato, endereço completo e o botão direto{' '}
                <strong>"Ativar Cadastro & Abrir Prontuário"</strong>.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  1. Link Público Completo
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Envio ao Cliente</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  No Dashboard ou em Pacientes, clique em <strong>"Copiar Link"</strong> ou{' '}
                  <strong>"WhatsApp"</strong>. O paciente acessa sem login e preenche seus dados
                  completos de identificação e contato (<strong>Celular/WhatsApp</strong> e{' '}
                  <strong>E-mail</strong>), endereço completo estruturado (
                  <strong>
                    Rua, Número, Complemento, Bairro, Cidade, Estado e CEP com busca automática
                    ViaCEP
                  </strong>
                  ), além do motivo da procura, histórico de dores e expectativas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  2. Alerta em Tempo Real
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Notificação & Card no Painel</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Assim que enviado, o cadastro entra com status <em>"Pré-cadastro"</em> com todos
                  os dados estruturados de contato e endereço preservados. O card dourado surge no
                  Painel Geral e os administradores recebem notificação no sino para que nenhum novo
                  cliente fique sem acolhimento.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  3. 1 Clique para Prontuário
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Ativar & Abrir Prontuário</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ao clicar em <strong>"Ativar Cadastro & Abrir Prontuário"</strong>, o status do
                  paciente muda imediatamente para <em>"Ativo"</em> e o formulário clínico é aberto
                  com o cabeçalho de identificação (endereço completo, celular e e-mail) e respostas
                  da anamnese automaticamente integrados.
                </p>
              </div>
            </div>{' '}
          </div>
        </TabsContent>

        {/* TAB 10: MESCLAR CADASTROS DUPLICADOS (ADMIN) */}
        <TabsContent value="mesclar-pacientes" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold mb-2">
                <GitMerge className="h-3.5 w-3.5 text-purple-600" />
                <span>Gestão Avançada de Prontuários · Exclusivo Administradores</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Mesclar Cadastros Duplicados de Pacientes
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Como unificar dois cadastros do mesmo paciente em um único registro consolidado,
                preservando 100% da história clínica (avaliações, evoluções assinadas, laudos,
                consultas e presenças).
              </p>
            </div>

            {/* Alerta de Restrição de Acesso */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-950 leading-relaxed">
                <strong className="text-purple-900">Ação Restrita a Administradores:</strong> O
                botão <strong>"Mesclar Cadastros"</strong> aparece exclusivamente para usuários com
                papel de <em>Administrador</em> (ex: <code>gcdealmeida@gmail.com</code>).
                Profissionais com acesso restrito (como Fisioterapeutas e Personais) não visualizam
                o botão na interface e qualquer tentativa de chamada direta é bloqueada no servidor
                com código HTTP 403.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  1. Seleção Lado a Lado
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Principal vs. Duplicado</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  O administrador define com clareza qual cadastro é o <strong>Principal</strong>{' '}
                  (que permanece) e qual é o <strong>Duplicado</strong> (que será absorvido e
                  excluído). Há também um botão de inversão rápida de papéis.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  2. Migração Integral
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">História Preservada</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Avaliações de todas as áreas (Fisio, Personal, Nutrição, Medicina), exames
                  anexados (ressonâncias, laudos), evoluções fechadas (<code>EVO-XXXX</code> com
                  imutabilidade), presenças e relatórios IA são transferidos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E3C89A]">
                  3. Transacional & Seguro
                </span>
                <h4 className="font-bold text-sm text-[#4A322A]">Auditoria e Zero Perda</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Executado em transação única no banco de dados SQLite do servidor. Campos
                  cadastrais vazios do principal são preenchidos com dados do duplicado (CPF,
                  telefone, nascimento). A auditoria registra data, autor e contagens.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#E9E1D2]">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#4A322A]">
                Como executar a mesclagem passo a passo:
              </h4>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong>Onde iniciar:</strong> Na página <strong>Pacientes</strong>, clique no
                    botão superior <strong>"Mesclar Cadastros"</strong> (ou no menu de três
                    pontinhos de qualquer paciente → <em>"Mesclar com Outro..."</em>, ou no
                    cabeçalho do perfil do paciente).
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong>Escolher o Duplicado e o Principal:</strong> Selecione na coluna
                    esquerda o cadastro duplicado (que será absorvido) e na coluna direita o
                    cadastro principal oficial (que continuará no sistema).
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong>Confirmação de Segurança:</strong> Confira os nomes, CPFs e status dos
                    dois pacientes. Marque a caixa de confirmação explícita de ação irreversível.
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-[#8C6527] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <strong>Execução e Resumo:</strong> Clique em{' '}
                    <strong>"Confirmar e Mesclar Cadastros"</strong>. O servidor consolida todos os
                    registros, emite registro nos logs de auditoria clínica, notifica os
                    administradores e exibe o painel verde com o total de registros movidos por
                    tabela.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 11: PERGUNTAS FREQUENTES (FAQ) */}
        <TabsContent value="faq" className="space-y-6 pt-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-2">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Tire suas Dúvidas</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#4A322A]">
                Perguntas Frequentes sobre o Uso do App
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Respostas rápidas para as dúvidas mais comuns dos profissionais da clínica:
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem
                value="faq-1"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Salvei a avaliação como rascunho. Onde posso reencontrá-la?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  No menu <strong>Prontuários</strong>, sua avaliação estará listada com uma tag
                  amarela <strong>"Rascunho"</strong>. Ao clicar nela e depois no botão "Editar" (ou
                  ao abrir diretamente), o formulário reabrirá exatamente na etapa e com todos os
                  campos preenchidos anteriormente, permitindo que você continue sem perder nada.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-2"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Posso editar uma avaliação depois de marcá-la como "Concluída"?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  <strong>Sim para a Avaliação Base, mas NÃO para as Evoluções de Sessão.</strong>{' '}
                  Ao abrir o prontuário concluído, clique no botão <strong>"Editar"</strong> no topo
                  da página para ajustar condutas da avaliação geral. Já as{' '}
                  <strong>Evoluções de Sessão</strong> (aba "Evoluções do Paciente") que foram
                  salvas e assinadas tornam-se <em>documentos fechados e imutáveis</em> com
                  assinatura digital permanente. Para qualquer correção em uma sessão assinada, o
                  fluxo oficial é clicar no botão <strong>"Evolução Corretiva"</strong>, criando um
                  novo registro formal com referência ao anterior.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-2-evolucoes"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Por que a evolução assinada não pode ser editada nem excluída?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  Trata-se de uma exigência legal e regulatória para Prontuários Eletrônicos de
                  Saúde (COFFITO, CFM e LGPD). Após a assinatura digital, o documento passa a ter
                  validade jurídica como documento fechado com carimbo de tempo gerado no servidor.
                  Permitir alteração posterior violaria a autenticidade e a auditoria do prontuário.
                  O sistema oferece a ferramenta <strong>"Evolução Corretiva"</strong> para que você
                  retifique ou complemente qualquer dado mantendo o rastro documental 100% íntegro.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-3"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  A Inteligência Artificial pode errar? Posso editar o plano gerado por ela?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  <strong>Absolutamente, todos os campos são 100% editáveis!</strong> A IA do SOUL
                  funciona como um copiloto clínico avançado: ela cruza dados objetivos com
                  diretrizes científicas e gera uma proposta inicial. O profissional responsável tem
                  autonomia total para reescrever a hipótese diagnóstica, mudar o foco de qualquer
                  semana, alterar exercícios prescritos ou deletar trechos conforme seu julgamento
                  clínico soberano.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-4"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Onde ficam guardados os arquivos que anexo (PDFs, exames, fotos)?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  Todos os arquivos são enviados com segurança para o banco de dados em nuvem do
                  sistema. Eles ficam salvos e vinculados à avaliação específica. Ao abrir o
                  prontuário no modo visualização, há uma seção de anexos com miniaturas de fotos e
                  links diretos para abrir e baixar qualquer exame em PDF em alta resolução.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-5"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Como faço para imprimir o prontuário ou enviar em PDF para o paciente/médico?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  Abra a avaliação em <strong>Prontuários</strong> e clique no botão escuro superior{' '}
                  <strong>"Baixar PDF / Imprimir"</strong>. Na caixa de impressão do navegador,
                  escolha "Salvar como PDF". O layout é formatado profissionalmente para papel A4,
                  com o cabeçalho oficial SOUL, logotipo fiel em alta definição, resumo dos achados
                  e linha de assinatura do profissional.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-6"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Como funciona o botão "Iniciar" consulta no Painel?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  O botão "Iniciar" é um atalho inteligente: ele identifica qual paciente está
                  agendado e qual é a especialidade do atendimento (ex: Maria Silva - Fisioterapia
                  às 14:00) e já abre a tela de Nova Avaliação com tudo pré-preenchido, pulando a
                  etapa de seleção e levando você direto para o preenchimento clínico.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-atalhos-pos-login"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Como funcionam os botões de acesso rápido "Presença e Confirmação" e "Evolução"?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  Logo após fazer o login no Sistema SOUL, tanto no topo do Dashboard quanto na
                  barra superior (Topbar), você encontra dois botões de acesso ultra-rápido:
                  <br />• <strong>Presença e Confirmação:</strong> Leva diretamente à tela de
                  lançamentos de atendimento diário (<code>/presencas</code>). Os registros entram
                  tanto
                  <strong>
                    automaticamente ao assinar uma evolução de prontuário ou concluir avaliação
                  </strong>
                  , quanto de forma manual pelo botão <em>"+ Lançar Presença"</em>. Permite
                  registrar e auditar pacientes, área/serviço dentre os 13 oficiais da SOUL,
                  profissional e status (Presente, Confirmado, Justificado, Cancelado). Alimenta em
                  tempo real as contagens de atendimentos e a conferência administrativa.
                  <br />• <strong>Evolução Clínica:</strong> Permite buscar e selecionar qualquer
                  paciente ativo para registrar a sessão de atendimento no modelo SOAP com régua EVA
                  de 1 clique,{' '}
                  <em>
                    mesmo que o paciente ainda não possua avaliação prévia ou prontuário cadastrado
                  </em>{' '}
                  (o sistema redireciona automaticamente para a aba de evoluções do histórico do
                  paciente). Ao assinar a evolução, o lançamento na lista de Presenças é gerado de
                  forma 100% automática!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-7-ics"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Como funciona a sincronização entre o Google Agenda e o Sistema SOUL?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  Você conta com duas funções distintas e independentes no modal da Agenda:
                  <br />
                  <strong>1. Como lançar minha Google Agenda automaticamente aqui dentro?</strong>
                  <br />
                  Basta obter o seu <em>"Endereço secreto em formato iCal"</em> no Google Calendar
                  (Configurações → Integrar calendário) e colar na aba{' '}
                  <strong>"Importar Google para SOUL"</strong>. O servidor do app fará a importação
                  imediata de todos os eventos e continuará buscando alterações a cada 15 minutos
                  automaticamente. Na grade de horários, esses eventos ganham identificação visual
                  própria (badge Google e cor dourada suave) e não interferem no prontuário nem nos
                  pacientes clínicos.
                  <br />
                  <br />
                  <strong>
                    2. Como ver os pacientes da SOUL no meu aplicativo de calendário do celular?
                  </strong>
                  <br />
                  Basta copiar o <em>Link Pessoal de Feed de Saída (.ics)</em> na aba{' '}
                  <strong>"Exportar SOUL para Celular"</strong> e colá-lo no Google Agenda (opção{' '}
                  <em>"Outros calendários → Do URL"</em>). O Google Agenda cuidará de exibir suas
                  consultas e alertas de reavaliação da clínica diretamente no seu smartphone.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-8-treinos"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Como dividir os treinos da semana em Treino A, Treino B, etc. no Programa de
                  Acompanhamento?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  Na etapa <strong>4 (Prescrição de Exercícios)</strong> do editor de programas,
                  cada semana da periodização agora conta com abas de treinos:
                  <br />• Clique em <strong>"Novo Treino"</strong> para adicionar uma nova divisão
                  àquela semana (por exemplo, <em>Treino A</em>, <em>Treino B</em>,{' '}
                  <em>Treino C</em>, ou nomes livres como <em>"Dia 1 - Inferiores"</em>).
                  <br />• Cada treino possui sua própria lista independente de exercícios do
                  catálogo, séries, reps/tempo, carga e descanso.
                  <br />• Para renomear um treino, basta clicar no ícone de lápis na aba do treino.
                  <br />• Na <strong>Versão do Cliente</strong> (acessível pelo botão superior ou
                  pelo link público/WhatsApp do aluno), cada treino é exibido claramente com seu
                  próprio banner dourado, identificando a divisão para cada dia da semana.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>

      {/* FOOTER CALL TO ACTION */}
      <div className="bg-[#FAF4EA] rounded-3xl p-6 sm:p-8 border border-[#E3C89A] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-[#E3C89A] flex items-center justify-center text-[#8C6527] shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#4A322A]">
              Pronto para começar seu atendimento?
            </h4>
            <p className="text-xs text-[#73574A]">
              Inicie agora mesmo uma nova avaliação e aproveite toda a fluidez do Sistema SOUL.
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/prontuarios/novo')}
          className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-5 text-xs shadow-sm shrink-0 border border-[#DFBF8E]/40"
        >
          <Plus className="h-4 w-4 mr-1 text-[#33221C]" /> Abrir Nova Avaliação
        </Button>
      </div>
    </div>
  )
}
