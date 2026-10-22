/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  'POST',
  '/backend/v1/fisioterapia/gerar-ia',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const avaliacaoData = body.avaliacao || {}

      // Formatar o resumo dos achados para o agente
      const promptMensagem = `Realize a análise clínica completa da seguinte avaliação de fisioterapia e retorne a Hipótese Diagnóstica, Diagnóstico Disfuncional, Objetivos do Tratamento e Plano de Tratamento semana a semana (8 semanas) em formato JSON.

DADOS DO PACIENTE E AVALIAÇÃO:
- Diagnóstico Médico: ${avaliacaoData.diagnostico_medico || avaliacaoData.diagnostico_fisioterapeutico || 'Não informado'}
- Motivo da Procura / Momento da Decisão: ${JSON.stringify(avaliacaoData.anamnese_detalhada || {})}
- Queixas (EVA e histórico): ${JSON.stringify(avaliacaoData.queixas_multiplas || avaliacaoData.queixa_principal || '')}
- Histórico Clínico & Sistêmico: Vísceras: ${JSON.stringify(avaliacaoData.visceras_sistemicas || {})}, Hábitos: ${JSON.stringify(avaliacaoData.habitos_saude || {})}
- Exame Físico - Amplitude de Movimento (ADM por segmentos optativos): ${JSON.stringify(avaliacaoData.adm_segmentos || {})}
- Teste de Força Muscular & Dinamometria: ${avaliacaoData.forca_muscular_descricao || JSON.stringify(avaliacaoData.forca_muscular_grupos || {})}
- Testes Especiais por Segmento: ${JSON.stringify(avaliacaoData.testes_especiais_segmentos || {})}
- Testes Complementares (Berg, TUG, Cirtometria, Podologia): ${JSON.stringify(avaliacaoData.secoes_complementares || {})}
- Exames Complementares Anexados / Descrição: ${avaliacaoData.descricao_exames || avaliacaoData.historico_medico || 'Exames de imagem/laboratoriais anexados em prontuário'}
- Síntese Clínica dos Anexos / Laudos Lidos com IA: ${JSON.stringify(avaliacaoData.resumos_anexos || {})}
Por favor, responda com uma estrutura JSON válida contendo:
{
  "hipotese_diagnostica": "string detalhada cruzando os dados",
  "diagnostico_disfuncional": "string com o diagnóstico cinético-funcional",
  "objetivos_tratamento": "string com objetivos de curto, médio e longo prazo",
  "plano_tratamento_semanal": [
    {
      "semana": "Semana 1-2",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    }
  ],
  "sintese_geral": "string textual resumo"
}`

      const agentResult = $ai.agent('fisioterapia-clinica-soul').chat({
        user_id: userId,
        message: promptMensagem,
      })

      let parsed = null
      const content = agentResult?.content || ''

      try {
        // Tentar extrair bloco json se vier com ```json
        const jsonMatch =
          content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const rawStr = jsonMatch[1] || jsonMatch[0]
          parsed = JSON.parse(rawStr)
        }
      } catch (err) {
        console.log('Aviso ao parsear JSON do agente:', err)
      }

      return e.json(200, {
        raw_content: content,
        structured: parsed,
        citations: agentResult?.citations || [],
      })
    } catch (err) {
      console.log('Erro no endpoint fisioterapia/gerar-ia:', err)
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA indisponível temporariamente' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha no processamento do agente' : err.message,
        })
      }
      return e.json(500, { error: err?.message || 'Falha ao processar avaliação com IA' })
    }
  },
  $apis.requireAuth(),
)
