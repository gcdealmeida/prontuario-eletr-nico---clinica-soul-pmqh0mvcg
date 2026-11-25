import React, { useRef, useState } from 'react'
import { FileUp, Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { parseArquivoPrograma, type ResultadoImportacaoPrograma } from '@/lib/importacaoProgramas'
import type { ModalidadePrograma } from '@/services/programas'

interface PainelImportacaoAbaProps {
  onImportado: (resumo: ResultadoImportacaoPrograma) => void
  modalidade: ModalidadePrograma
  importando?: boolean
}

export const PainelImportacaoAba: React.FC<PainelImportacaoAbaProps> = ({
  onImportado,
  modalidade,
  importando = false,
}) => {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [processando, setProcessando] = useState(false)
  const [resumo, setResumo] = useState<ResultadoImportacaoPrograma | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const handleArquivo = async (file: File) => {
    if (!/\.(xlsx|xls|csv|docx)$/i.test(file.name)) {
      setErro('Formato não suportado. Envie um arquivo .xlsx (Excel) ou .docx (Word).')
      return
    }
    setProcessando(true)
    setErro(null)
    try {
      const resultado = await parseArquivoPrograma(file)
      setResumo({ ...resultado, modalidade })
      if (resultado.treinos.length === 0 && resultado.semanas.length === 0) {
        setErro(
          'Não foi possível identificar conteúdo de programa no arquivo. Verifique se ele traz treinos, semanas ou exercícios.',
        )
      } else {
        toast({
          title: 'Arquivo lido com sucesso',
          description: 'Revise os dados e confirme para alimentar as demais abas.',
        })
      }
    } catch (err) {
      console.error('Erro na importação:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setErro(
        msg.startsWith('cdn_indisponivel')
          ? 'Não foi possível carregar o leitor de Word. Verifique sua conexão e tente novamente, ou importe uma planilha .xlsx.'
          : err instanceof Error
            ? err.message
            : 'Falha ao ler o arquivo. Verifique se ele não está corrompido e tente novamente.',
      )
    } finally {
      setProcessando(false)
    }
  }

  const handleConfirmar = () => {
    if (resumo) onImportado(resumo)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <FileUp className="h-4 w-4 text-[#8C6527]" />
            Importar programa (Excel ou Word)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Envie uma planilha <strong>.xlsx</strong> ou documento <strong>.docx</strong> com o
            programa do cliente. O sistema lê o conteúdo e alimenta automaticamente as abas de{' '}
            <strong>Periodização</strong> (semanas, carga e horas) e <strong>Exercícios</strong>{' '}
            (treinos, séries e repetições).
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.docx"
            className="hidden"
            aria-label="Selecionar arquivo de importação"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleArquivo(file)
              e.target.value = ''
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Enviar arquivo de importação"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              processando
                ? 'border-[#C9A46A] bg-[#FAF5EE]'
                : 'border-[#E9E1D2] hover:border-[#C9A46A] hover:bg-[#FAF5EE]/50'
            }`}
          >
            {processando ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#8C6527]" />
                <p className="text-sm font-semibold text-[#8C6527]">Lendo o arquivo…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileUp className="h-8 w-8 text-[#8C6527]" />
                <p className="text-sm font-semibold text-gray-700">
                  Clique para escolher o arquivo .xlsx ou .docx
                </p>
                <p className="text-xs text-gray-500">
                  Formatos aceitos: Excel (.xlsx, .xls) e Word (.docx)
                </p>
              </div>
            )}
          </div>

          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}

          {!erro &&
            resumo &&
            (resumo.nome.length > 0 || resumo.treinos.length > 0 || resumo.semanas.length > 0) && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-bold text-emerald-800">
                    Conteúdo identificado no arquivo
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resumo.nome && (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                      Programa: {resumo.nome}
                    </Badge>
                  )}
                  {resumo.semanas.length > 0 && (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                      {resumo.semanas.length} semana(s)
                    </Badge>
                  )}
                  {resumo.treinos.length > 0 && (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                      {resumo.treinos.length} treino(s)
                    </Badge>
                  )}
                  {resumo.treinos.reduce((acc, t) => acc + t.exercicios.length, 0) > 0 && (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                      {resumo.treinos.reduce((acc, t) => acc + t.exercicios.length, 0)} exercício(s)
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={
                    importando || (resumo.treinos.length === 0 && resumo.semanas.length === 0)
                  }
                  className="gap-1.5"
                >
                  {importando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {importando ? 'Salvando programa…' : 'Confirmar e alimentar as abas'}
                </Button>
                {resumo.avisos.length > 0 && (
                  <p className="text-xs text-amber-700">{resumo.avisos.join(' ')}</p>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
        <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#C9A46A]" />
        A leitura é feita no próprio navegador (programa de análise local). Revise sempre os dados
        importados antes de salvar — o conteúdo é distribuído entre as abas Periodização e
        Exercícios.
      </p>
    </div>
  )
}
