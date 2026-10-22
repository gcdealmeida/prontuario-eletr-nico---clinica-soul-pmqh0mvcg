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

      // Formatar o resumo dos achados para o agente com cruzamento multidimensional:
      // (1) Queixa principal x (2) Diagnóstico médico/cinético-funcional x (3) Achados da avaliação + laudos de anexos x (4) Periódicos científicos de referência
      const promptMensagem = `Realize a análise clínica completa da seguinte avaliação de fisioterapia da Clínica SOUL.
Sua missão é formular uma CONCLUSÃO COM IA baseada numa SÍNTESE RELACIONAL APROFUNDADA cruzando explicitamente:
(1) Queixa Principal e impacto sintomático/funcional do paciente.
(2) Diagnóstico Médico informado e hipótese cinético-funcional da própria avaliação.
(3) Achados Objetivos da Avaliação (anamnese, exame físico, amplitudes articulares ADM, testes de força/dinamometria e assimetrias contralaterais, Core, testes especiais e resumos dos anexos/laudos lidos com IA).
(4) O que a literatura científica de referência diz sobre o tema/reabilitação, fundamentando em periódicos de autoridade:
    - Ortopedia e Traumatologia (Coluna, Ombro, Joelho etc.): The Journal of Bone and Joint Surgery (JBJS), The American Journal of Sports Medicine (AJSM), Spine, The Spine Journal, Arthroscopy, Revista Brasileira de Ortopedia (RBO).
    - Medicina Esportiva, Performance e Lesões: British Journal of Sports Medicine (BJSM), Sports Medicine, Medicine & Science in Sports & Exercise (MSSE), Revista Brasileira de Medicina do Esporte (RBME).
    - Fisioterapia Esportiva e Reabilitação Ortopédica: Journal of Orthopaedic & Sports Physical Therapy (JOSPT), Physical Therapy in Sport, Brazilian Journal of Physical Therapy (BJPT), Fisioterapia Brasil.

DADOS DO PACIENTE E AVALIAÇÃO CLÍNICA:
- Nome: ${avaliacaoData.paciente_nome || 'Paciente SOUL'}
- Diagnóstico Médico: ${avaliacaoData.diagnostico_medico || avaliacaoData.diagnostico_fisioterapeutico || 'Não informado'}
- Motivo da Procura / Momento da Decisão: ${JSON.stringify(avaliacaoData.anamnese_detalhada || {})}
- Queixas Principais (EVA, localização, alívio/piora): ${JSON.stringify(avaliacaoData.queixas_multiplas || avaliacaoData.queixa_principal || '')}
- Histórico Clínico & Sistêmico: Vísceras: ${JSON.stringify(avaliacaoData.visceras_sistemicas || {})}, Hábitos: ${JSON.stringify(avaliacaoData.habitos_saude || {})}
- Exame Físico - Amplitude de Movimento (ADM por segmentos optativos): ${JSON.stringify(avaliacaoData.adm_segmentos || {})}
- Teste de Força Muscular & Dinamometria: ${avaliacaoData.forca_muscular_descricao || JSON.stringify(avaliacaoData.forca_muscular_grupos || {})}
- Testes Especiais por Segmento: ${JSON.stringify(avaliacaoData.testes_especiais_segmentos || {})}
- Testes Complementares (Berg, TUG, Cirtometria, Podologia): ${JSON.stringify(avaliacaoData.secoes_complementares || {})}
- Exames Complementares Anexados / Descrição: ${avaliacaoData.descricao_exames || avaliacaoData.historico_medico || 'Exames de imagem/laboratoriais anexados em prontuário'}
- Síntese Clínica dos Anexos / Laudos Lidos com IA: ${JSON.stringify(avaliacaoData.resumos_anexos || {})}

DIRETRIZES FUNDAMENTAIS DE RESPOSTA:
1. SÍNTESE RELACIONAL FLUÍDA: Não use prefixos mecânicos tipo "CAMPO:", "Achado:", "Item:", "Laudo:". Redija em prosa clínica madura, fluida e integradora.
2. SEM TABELAS MARKDOWN: Nada de linhas com separadores "|---|---|". Formate comparações em texto corrido ou marcadores simples.
3. REFERÊNCIA NATURAL AOS PERIÓDICOS: Cite naturalmente as revistas e consensos pertinentes ao caso (ex.: "conforme recomendações do JOSPT para tendinopatias e progressão de carga...", "em consonância com evidências do BJSM e AJSM para retorno ao esporte...", "segundo diretrizes do Spine e BJPT para controle motor lumbopélvico...", "conforme literatura da Arthroscopy e JBJS..."). NÃO invente citações específicas com ano/volume/página ou DOI fictício (orientar pelo consenso/autoridade da revista).
4. ESTRUTURA DO CAMPO "hipotese_diagnostica": Deve ser um texto clínico rico e completo que faça expressamente essa síntese cruzada: Queixa x Diagnóstico x Avaliação/Exames x Literatura dos periódicos. Se desejar, pode incluir subtópicos claros como "Síntese Clínica e Relação Biomecânica" e "Fundamentação Científica & Consenso das Revistas (JOSPT, BJSM, Spine, etc.)".

Por favor, responda estritamente com uma estrutura JSON válida contendo:
{
  "hipotese_diagnostica": "texto completo integrando queixa x diagnóstico x achados objetivos x fundamentação nos periódicos científicos",
  "fundamentacao_cientifica": "síntese específica do que as revistas de referência (JOSPT, BJSM, AJSM, Spine, JBJS, etc.) preconizam para a condição e reabilitação",
  "diagnostico_disfuncional": "diagnóstico cinético-funcional preciso (mobilidade, estabilidade, força e controle motor)",
  "objetivos_tratamento": "objetivos de curto, médio e longo prazo",
  "plano_tratamento_semanal": [
    {
      "semana": "Semana 1-2",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    }
  ],
  "sintese_geral": "string textual resumo para o prontuário"
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

      // Se parsed possui fundamentacao_cientifica e a hipotese_diagnostica não a incorporou,
      // assegurar que a fundamentação fique bem visível e preservada
      if (parsed && parsed.fundamentacao_cientifica && parsed.hipotese_diagnostica) {
        if (
          !parsed.hipotese_diagnostica.includes(parsed.fundamentacao_cientifica) &&
          !parsed.hipotese_diagnostica.toLowerCase().includes('fundamentação') &&
          !parsed.hipotese_diagnostica.toLowerCase().includes('literatura')
        ) {
          parsed.hipotese_diagnostica = `${parsed.hipotese_diagnostica}\n\nFundamentação Científica (Periódicos de Referência):\n${parsed.fundamentacao_cientifica}`
        }
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
