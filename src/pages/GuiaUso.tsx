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
              Bem-vindo ao manual completo da Clínica SOUL. Aprenda como abrir novas avaliações
              clínicas, consultar prontuários oficiais, acompanhar a evolução dos pacientes ao longo
              do tempo e aproveitar ao máximo a inteligência clínica integrada.
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
                Você pode iniciar uma avaliação clínica por qualquer um dos 3 caminhos abaixo,
                conforme sua rotina:
              </p>
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
                      Salvar Rascunho vs. Concluir Avaliação
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      • <strong>Salvar Rascunho (botão cinza com disquete):</strong> Salva o
                      formulário exatamente no ponto onde você parou, ideal se a consulta for
                      interrompida ou se faltarem exames para anexar.
                      <br />• <strong>Concluir Avaliação (botão dourado com check):</strong>{' '}
                      Finaliza o atendimento, muda o status para "Concluída", cria um snapshot
                      automático na Timeline oficial do paciente e bloqueia edições acidentais
                      (permitindo revisões controladas).
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
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs">
                      <Activity className="h-4 w-4" />
                    </span>
                    <h5 className="font-bold text-sm text-[#1D4ED8]">
                      Fisioterapia (Modelo Exclusivo SOUL)
                    </h5>
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
                      <strong>Gerar com IA:</strong> na etapa 7, o assistente inteligente cruza
                      todos os achados com diretrizes científicas (Lancet, CPG) e sugere hipótese
                      diagnóstica + plano semanal de 8 semanas 100% editável.
                    </li>
                  </ul>
                </div>

                {/* Personal */}
                <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-bold text-xs">
                      <Dumbbell className="h-4 w-4" />
                    </span>
                    <h5 className="font-bold text-sm text-[#C2410C]">
                      Personal Trainer (Padrão Physical Test)
                    </h5>
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
                      <strong>Gerar com IA na etapa 8:</strong> gera síntese biomecânica, hipótese
                      funcional e periodização semanal de 12 semanas (adaptação, hipertrofia, força
                      e deload) totalmente editável.
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
                Como abrir um Prontuário Clínico
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Acesse o documento oficial detalhado de qualquer avaliação já realizada:
              </p>
            </div>

            {/* Passos */}
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

            {/* Dica de Impressão */}
            <div className="p-4 rounded-2xl bg-[#FAF4EA] border border-[#E3C89A] flex items-start gap-3">
              <Printer className="h-5 w-5 text-[#8C6527] shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <strong className="text-[#8C6527]">Dica para salvar em PDF:</strong> Ao clicar em{' '}
                <em>"Baixar PDF / Imprimir"</em>, a janela de impressão do seu navegador abrirá
                formatada sem os menus laterais nem botões. No destino da impressora, selecione{' '}
                <strong>"Salvar como PDF"</strong>. O documento sai pronto com o cabeçalho oficial e
                assinatura digital da clínica.
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
                    <br />• <strong>S (Subjetivo):</strong> relato do paciente, nível de dor (EVA),
                    resposta aos exercícios domiciliares.
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

              {/* Passo 5: Sincronização Google Agenda (.ics) */}
              <div className="flex gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] text-[#33221C] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  5
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[#33221C]">
                    Sincronização com Google Agenda (Feed .ics Automático)
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Você pode sincronizar todas as consultas da clínica e os alertas de reavaliação
                    no seu Google Agenda (ou Apple Calendar / Outlook) de forma simples e segura:
                    <br />• <strong>Como ativar:</strong> Na tela da <strong>Agenda</strong>, clique
                    no botão <strong>"Sincronizar com Google Agenda (via .ics)"</strong> e copie seu
                    link de feed pessoal.
                    <br />• <strong>Configurar no Google Agenda (apenas 1 vez):</strong> Acesse{' '}
                    <code>calendar.google.com</code> pelo computador → na barra lateral esquerda, em{' '}
                    <em>"Outros calendários"</em>, clique em <strong>+</strong> → selecione{' '}
                    <strong>"Do URL"</strong> → cole o link copiado e confirme em{' '}
                    <em>"Adicionar calendário"</em>.
                    <br />• <strong>Somente Leitura:</strong> A sincronização é unidirecional (as
                    consultas e alertas da clínica são lidos pelo Google Agenda; edições feitas no
                    Google não alteram o prontuário no sistema SOUL).
                    <br />• <strong>Atualização automática:</strong> O Google Agenda atualiza o feed
                    periodicamente em segundo plano (o tempo de sincronização depende do ciclo do
                    Google, podendo levar de algumas horas até 24h).
                    <br />• <strong>Segurança e Regeneração:</strong> Caso precise cancelar o acesso
                    de algum dispositivo antigo, clique em <em>"Regenerar link"</em> no modal da
                    Agenda para invalidar o token anterior e criar um novo endereço.
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
                    • <strong>Perfil do Paciente:</strong> Todas as evoluções aparecem organizadas
                    na aba "Evoluções" do paciente e na Timeline com as cores de cada especialidade,
                    com o selo de documento fechado e assinatura digital.
                    <br />• <strong>Impressão / PDF:</strong> O prontuário oficial preserva o
                    cabeçalho oficial SOUL com o logotipo em alta definição, layout A4, linha de
                    assinatura e anexo completo de todas as evoluções clínicas assinadas com seus
                    respectivos identificadores e carimbos de auditoria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: PERGUNTAS FREQUENTES (FAQ) */}
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
                value="faq-7-ics"
                className="border border-[#E9E1D2] rounded-2xl px-4 py-1"
              >
                <AccordionTrigger className="text-sm font-bold text-[#4A322A] hover:no-underline hover:text-[#8C6527]">
                  Como funciona a exportação .ics para o Google Agenda?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                  O sistema SOUL gera um{' '}
                  <strong>feed de calendário em formato padrão .ics (iCalendar)</strong> com
                  autenticação por token pessoal exclusivo. Você adiciona esse endereço uma única
                  vez no Google Agenda (opção <em>"Outros calendários → Do URL"</em>). A partir daí,
                  suas consultas e lembretes de alerta de reavaliação passam a ser visíveis no
                  Google Agenda do seu celular e computador. Por ser um feed de leitura gerado pelo
                  servidor, ele é 100% seguro e não permite que alterações no Google Agenda
                  sobrescrevam consultas oficiais da clínica.
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
