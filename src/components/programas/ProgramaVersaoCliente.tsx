import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Printer,
  ArrowLeft,
  Share2,
  Calendar,
  Dumbbell,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  QrCode,
  Lock,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogoSOUL } from '@/components/LogoSOUL'
import { useToast } from '@/hooks/use-toast'
import {
  getProgramaById,
  getProgramaByToken,
  getMetasByPrograma,
  getSemanasByPrograma,
  getExerciciosByPrograma,
  getRegistrosCargaPorPrograma,
  getFotoExercicioUrl,
} from '@/services/programas'
import { formatDataPTBR } from '@/lib/constants'
import type {
  ProgramaAcompanhamentoRecord,
  ProgramaMetaRecord,
  ProgramaSemanaRecord,
  ProgramaExercicioRecord,
  ProgramaRegistroCargaRecord,
} from '@/types/database'

interface ProgramaVersaoClienteProps {
  modoPublico?: boolean
}

export const ProgramaVersaoCliente: React.FC<ProgramaVersaoClienteProps> = ({
  modoPublico = false,
}) => {
  const { id, token } = useParams<{ id?: string; token?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [programa, setPrograma] = useState<ProgramaAcompanhamentoRecord | null>(null)
  const [metas, setMetas] = useState<ProgramaMetaRecord[]>([])
  const [semanas, setSemanas] = useState<ProgramaSemanaRecord[]>([])
  const [exercicios, setExercicios] = useState<ProgramaExercicioRecord[]>([])
  const [cargas, setCargas] = useState<Record<string, ProgramaRegistroCargaRecord[]>>({})

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true)
        setErro(null)

        let prog: ProgramaAcompanhamentoRecord
        if (modoPublico && token) {
          prog = await getProgramaByToken(token)
        } else if (id) {
          prog = await getProgramaById(id)
        } else {
          throw new Error('Identificador de programa não fornecido.')
        }

        setPrograma(prog)

        const [metasDb, semanasDb, exDb, cargasDb] = await Promise.all([
          getMetasByPrograma(prog.id).catch(() => []),
          getSemanasByPrograma(prog.id).catch(() => []),
          getExerciciosByPrograma(prog.id).catch(() => []),
          getRegistrosCargaPorPrograma(prog.id).catch(() => []),
        ])

        setMetas(metasDb)
        setSemanas(semanasDb)
        setExercicios(exDb)

        const mapaCargas: Record<string, ProgramaRegistroCargaRecord[]> = {}
        cargasDb.forEach((c) => {
          if (!mapaCargas[c.exercicio_id]) mapaCargas[c.exercicio_id] = []
          mapaCargas[c.exercicio_id].push(c)
        })
        setCargas(mapaCargas)
      } catch (err: any) {
        console.error('Erro ao carregar programa do cliente:', err)
        setErro(err?.message || 'Programa não encontrado ou link expirado/desativado.')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id, token, modoPublico])

  const handleImprimir = () => {
    window.print()
  }

  const handleCopiarLink = () => {
    if (!programa?.token_compartilhamento) return
    const link = `${window.location.origin}/programa-cliente/${programa.token_compartilhamento}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copiado!',
      description: 'O cliente pode abrir este endereço diretamente no celular.',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1] p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#C9A46A] mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Carregando Programa de Treino...</p>
        </div>
      </div>
    )
  }

  if (erro || !programa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1] p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-[#E9E1D2] shadow-sm text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Programa Indisponível</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{erro}</p>
          {!modoPublico && (
            <Button
              onClick={() => navigate('/programas')}
              className="bg-[#C9A46A] text-[#33221C] font-bold text-xs rounded-xl"
            >
              Voltar aos Programas
            </Button>
          )}
        </div>
      </div>
    )
  }

  const alunoNome = programa.expand?.paciente_id?.nome || 'Aluno SOUL'
  const singular =
    programa.unidade_duracao === 'dias'
      ? 'Dia'
      : programa.unidade_duracao === 'meses'
        ? 'Mês'
        : 'Semana'
  const plural =
    programa.unidade_duracao === 'dias'
      ? 'Dias'
      : programa.unidade_duracao === 'meses'
        ? 'Meses'
        : 'Semanas'

  // Períodos 1..total_periodos
  const periodos = Array.from({ length: programa.total_periodos }, (_, i) => i + 1)
  const mapaSemanas = new Map<number, string[]>()
  semanas.forEach((s) => {
    mapaSemanas.set(s.indice, Array.isArray(s.metas_ids) ? s.metas_ids : [])
  })

  return (
    <div className="min-h-screen bg-[#FAF7F1] text-gray-900 py-6 px-4 sm:px-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra de Ações Superior (Oculta na Impressão) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden bg-white p-4 rounded-2xl border border-[#E9E1D2] shadow-2xs">
          <div className="flex items-center gap-2">
            {!modoPublico && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/programas/${programa.id}`)}
                className="text-gray-600 hover:text-gray-900 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Editar
              </Button>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] block">
                {modoPublico ? 'Visualização do Aluno' : 'Versão Limpa para Entrega'}
              </span>
              <h1 className="text-sm font-bold text-gray-900">{programa.nome}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImprimir}
              className="rounded-xl border-[#E9E1D2] hover:bg-[#FAF7F1] text-[#8C6527] font-semibold text-xs h-9 flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </Button>
            {!modoPublico && programa.token_compartilhamento && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleCopiarLink}
                className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs h-9 rounded-xl shadow-2xs flex items-center gap-1.5"
              >
                <Share2 className="h-4 w-4" /> Copiar Link do Aluno
              </Button>
            )}
          </div>
        </div>

        {/* CARTÃO PRINCIPAL DO PROGRAMA (Impressão + Visual Web) */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E9E1D2] shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Topo / Cabeçalho SOUL Oficial - Arte Empilhada Limpa e Desobstruída */}
          <div className="pb-6 border-b-2 border-[#E9E1D2] flex flex-col items-center justify-center text-center gap-3 overflow-visible">
            <LogoSOUL
              variant="full"
              size="md"
              theme="light"
              className="shrink-0 mx-auto overflow-visible select-none"
            />
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8C6527] font-bold block leading-tight">
                Programa de Treino & Acompanhamento
              </span>
              <span className="text-[#D4B278]">•</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E9E1D2] text-[10px] font-semibold text-[#8C6527] uppercase tracking-wider">
                Personal Trainer SOUL
              </span>
              <span className="text-[#D4B278]">•</span>
              <span className="text-[11px] text-[#73574A]">
                Atualizado em {formatDataPTBR(programa.updated || programa.created)}
              </span>
            </div>
          </div>

          {/* Dados do Aluno e do Programa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8C6527] block mb-0.5">
                Periodização Individualizada
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {programa.nome}
              </h2>
              <p className="text-xs text-gray-600 font-medium mt-1">
                Aluno(a): <strong className="text-gray-900">{alunoNome}</strong> • Duração Total:{' '}
                <strong className="text-[#8C6527]">
                  {programa.total_periodos} {plural.toLowerCase()}
                </strong>
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 uppercase">
                {programa.status}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                {programa.unidade_duracao === 'dias'
                  ? 'Periodização diária'
                  : programa.unidade_duracao === 'meses'
                    ? 'Periodização mensal'
                    : 'Periodização semanal'}
              </p>
            </div>
          </div>

          {/* Observações Gerais / Mensagem do Treinador */}
          {programa.observacoes && (
            <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527]">
                Orientação do Treinador:
              </span>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {programa.observacoes}
              </p>
            </div>
          )}

          {/* 1. OBJETIVOS E METAS DO PROGRAMA */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6527] flex items-center gap-1.5">
              <Target className="h-4 w-4" /> Objetivos e Metas do Programa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metas.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      {m.ordem}º Objetivo: {m.titulo}
                    </span>
                    {m.duracao_periodos && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold text-[10px] border border-amber-200">
                        {m.duracao_periodos} {plural.toLowerCase()}
                      </span>
                    )}
                  </div>
                  {m.descricao && <p className="text-gray-600 text-[11px]">{m.descricao}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* 2. GRADE DE DISTRIBUIÇÃO SEMANA A SEMANA (MODELO DO USUÁRIO) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6527] flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Distribuição da Periodização
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {periodos.map((p) => {
                const metasAtivasIds = mapaSemanas.get(p) || []
                const metasAtivas = metas.filter((m) => metasAtivasIds.includes(m.id))

                return (
                  <div
                    key={p}
                    className="p-3 rounded-xl bg-[#FAF7F1] border border-gray-200/80 flex items-center justify-between gap-3"
                  >
                    <span className="font-bold text-gray-900 text-xs shrink-0">
                      {p}ª {singular.toUpperCase()}:
                    </span>
                    <div className="text-right text-xs">
                      {metasAtivas.length === 0 ? (
                        <span className="text-gray-400 italic">Transição / Recuperação</span>
                      ) : (
                        <span className="font-bold text-[#8C6527]">
                          {metasAtivas.map((m) => `${m.ordem}º Objetivo`).join(' e ')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. PRESCRIÇÃO DOS EXERCÍCIOS SEMANA A SEMANA */}
          <div className="space-y-6 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6527] flex items-center gap-1.5">
              <Dumbbell className="h-4 w-4" /> Prescrição dos Exercícios por Semana
            </h3>

            {periodos.map((p) => {
              const exerciciosDestaSemana = exercicios.filter((e) => e.semana_indice === p)
              if (exerciciosDestaSemana.length === 0) return null

              const metasAtivasIds = mapaSemanas.get(p) || []
              const metasAtivas = metas.filter((m) => metasAtivasIds.includes(m.id))

              return (
                <div
                  key={p}
                  className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-3 break-inside-avoid"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-gray-100">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
                      {p}ª {singular.toUpperCase()} —{' '}
                      {metasAtivas.map((m) => `${m.ordem}º ${m.titulo}`).join(' • ')}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {exerciciosDestaSemana.length} exercício(s)
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {exerciciosDestaSemana.map((ex) => {
                      const cargasEx = cargas[ex.id] || []
                      const ultimaCarga =
                        cargasEx.length > 0 ? cargasEx[cargasEx.length - 1].valor_kg : null
                      const linkAcesso = ex.link || ex.expand?.exercicio_id?.link
                      const fotoUrl =
                        ex.foto_url ||
                        (ex.expand?.exercicio_id
                          ? getFotoExercicioUrl(ex.expand.exercicio_id)
                          : null)

                      return (
                        <div key={ex.id} className="py-3 first:pt-1 last:pb-0 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-xs sm:text-sm">
                                {ex.nome}
                              </span>
                              {linkAcesso && (
                                <a
                                  href={linkAcesso}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-[#8C6527] bg-[#FAF5EE] hover:bg-[#E9D5B5] border border-[#E9E1D2] px-2.5 py-0.5 rounded-full transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" /> Acessar exercício
                                </a>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-semibold text-[11px]">
                                {ex.series || 3} séries × {ex.quantidade || 12}{' '}
                                {ex.tipo_repeticao === 'segundos' ? 'segundos' : 'reps'}
                              </span>
                              {ex.intervalo && (
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px]">
                                  Descanso: {ex.intervalo}
                                </span>
                              )}
                              {(ex.carga_prescrita || ultimaCarga) && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold text-[11px] border border-amber-200">
                                  Carga: {ultimaCarga ? `${ultimaCarga} kg` : ex.carga_prescrita}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Foto e Link do Exercício para Entrega ao Cliente e Impressão */}
                          {(fotoUrl || linkAcesso) && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E9E1D2]/80">
                              {fotoUrl && (
                                <img
                                  src={fotoUrl}
                                  alt={ex.nome}
                                  className="h-16 w-24 object-cover rounded-lg border border-gray-200 shadow-2xs shrink-0"
                                />
                              )}
                              <div className="text-xs space-y-0.5 min-w-0 flex-1">
                                {linkAcesso && (
                                  <>
                                    <div className="hidden print:block text-[11px] text-gray-700">
                                      <strong>Link de Acesso:</strong>{' '}
                                      <span className="text-[#8C6527] underline break-all font-mono text-[10px]">
                                        {linkAcesso}
                                      </span>
                                    </div>
                                    <div className="print:hidden">
                                      <a
                                        href={linkAcesso}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-bold text-xs text-[#8C6527] hover:underline"
                                      >
                                        <ExternalLink className="h-3 w-3" /> Vídeo / Instrução de
                                        Execução
                                      </a>
                                    </div>
                                  </>
                                )}
                                {ex.expand?.exercicio_id?.categoria && (
                                  <span className="text-[10px] text-gray-500 block">
                                    Grupo: {ex.expand.exercicio_id.categoria}
                                    {ex.expand.exercicio_id.subcategoria &&
                                      ` • ${ex.expand.exercicio_id.subcategoria}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {ex.observacao && (
                            <p className="text-[11px] text-gray-500 bg-[#FAF7F1] p-2 rounded-lg leading-relaxed">
                              💡 <strong>Recomendação:</strong> {ex.observacao}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rodapé Clínico */}
          <div className="pt-6 border-t border-gray-200 text-center space-y-1">
            <p className="text-xs font-bold text-gray-800">
              Clínica SOUL — Saúde e Movimento Integrado
            </p>
            <p className="text-[10px] text-gray-400">
              Programa de Acompanhamento montado pelo treinador responsável. A evolução de carga
              deve respeitar os padrões de técnica e ausência de dor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
