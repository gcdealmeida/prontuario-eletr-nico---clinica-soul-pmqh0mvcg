/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  'POST',
  '/backend/v1/personal/gerar-ia',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const avaliacaoData = body.avaliacao || {}

      // Formatar o resumo de todos os dados do PHYSICAL TEST para o agente
      // Se a requisição pedir apenas o Cruzamento Objetivos x Fragilidades com Medidas
      const modoCruzamento = body.modo === 'cruzamento_objetivos_fragilidades'

      let promptMensagem = ''

      if (modoCruzamento) {
        promptMensagem = `Você é o assistente biomecânico de elite da Clínica SOUL.
Realize o CRUZAMENTO RELAÇÃO OBJETIVOS × FRAGILIDADES desta avaliação física do Personal.
Compare rigorosamente os dados registrados:
- Composição corporal / % gordura (Physical Test)
- Dinamometria manual e assimetrias de força (%)
- Flexibilidade (Banco de Wells e Flexitest)
- Postura estática nas 3 vistas (anterior, lateral, posterior)
- Teste Funcional de Core (McGill - tempos e razões flex/ext e lateral D/E)
- FMS (Functional Movement Screen - score total, assimetrias e clearing tests)

E, dentro da relação de objetivos declarados e necessidades esportivas do aluno, DESTAQUE TODAS AS FRAGILIDADES DA AVALIAÇÃO OBSERVADAS (SEMPRE COM AS MEDIDAS EXATAS — ex.: "FMS mobilidade de ombros lado D = 1 vs lado E = 2", "Assimetria de dinamometria em flexão de joelho de 18% a favor do lado E", "Flexão de tronco McGill 48s abaixo da razão de extensão", "Banco de Wells 19cm - classificação Baixa", "% Gordura corporal de 28.4%").

DADOS DO ALUNO E AVALIAÇÃO:
- Nome: ${avaliacaoData.paciente_nome || 'Aluno SOUL'}
- Objetivo Principal Declarado: ${avaliacaoData.objetivo_principal || 'Melhora Geral'}
- Restrições/Alertas: ${avaliacaoData.restricoes_treino || 'Nenhuma'}
- Exames e Laudos Anexados (Síntese IA): ${JSON.stringify(avaliacaoData.resumos_anexos || {})}
- Metas/Objetivos declarados pelo profissional: ${JSON.stringify(avaliacaoData.metas_treino || {})}
- Objetivos do Treinamento já anotados: ${avaliacaoData.objetivos_treinamento || '—'}
- Composição Corporal: %G=${avaliacaoData.composicao_corporal?.percentual_gordura ?? avaliacaoData.percentual_gordura ?? '—'}%, Dobras=${JSON.stringify(avaliacaoData.composicao_corporal?.dobras || {})}, Perímetros=${JSON.stringify(avaliacaoData.composicao_corporal?.perimetros || {})}
- Dinamometria & Assimetrias: ${JSON.stringify(avaliacaoData.forca_dinamometro?.movimentos || [])}
- Flexibilidade: Wells=${JSON.stringify(avaliacaoData.flexibilidade_dados?.banco_wells || {})}, Flexitest=${JSON.stringify(avaliacaoData.flexibilidade_dados?.flexitest_notas || {})}
- Postura Estática: Anterior=${JSON.stringify(avaliacaoData.postural_dados?.vista_anterior || {})}, Lateral=${JSON.stringify(avaliacaoData.postural_dados?.vista_lateral || {})}, Posterior=${JSON.stringify(avaliacaoData.postural_dados?.vista_posterior || {})}
- Core McGill: Ventral=${avaliacaoData.core_mcgill?.prancha_ventral_seg}s, LatD=${avaliacaoData.core_mcgill?.prancha_lat_d_seg}s, LatE=${avaliacaoData.core_mcgill?.prancha_lat_e_seg}s, Extensão=${avaliacaoData.core_mcgill?.extensao_biering_seg}s, Razões=${JSON.stringify(avaliacaoData.core_mcgill || {})}
- FMS: Total=${avaliacaoData.fms_dados?.score_total}/21, Assimetrias=${avaliacaoData.fms_dados?.assimetrias_total}, Itens=${JSON.stringify(avaliacaoData.fms_dados?.itens || {})}

Responda estritamente com um JSON válido contendo:
{
  "fragilidades_medidas": [
    {
      "area": "FMS | Dinamometria | Postura | Core McGill | Flexibilidade | Composição",
      "descricao": "string concisa da fragilidade",
      "medida_exata": "string com a medida numérica registrada ex: 'Score 1 no lado D, Score 2 no lado E (Assimetria)' ou 'Dinamometria D: 32kgf, E: 25kgf (28% assimetria)'",
      "impacto_biomecanico": "string de impacto no treino"
    }
  ],
  "cruzamentos": [
    {
      "objetivo_titulo": "string com o objetivo",
      "fragilidade_atacada": "string com a fragilidade biomecânica associada",
      "medida_citada": "string com a medida exata da avaliação",
      "estrategia_prescricao": "como o treino atacará essa fragilidade com volume/séries/intensidade",
      "prioridade": "Alta | Média | Baixa"
    }
  ],
  "priorizacao_objetivos": [
    {
      "ordem": 1,
      "objetivo": "string do objetivo",
      "justificativa_clinica": "string com as medidas que justificam priorizar este objetivo"
    }
  ],
  "sintese_cruzamento": "string com texto explicativo pronto para prontuário"
}`
      } else {
        promptMensagem = `Realize a análise funcional e biomecânica completa da seguinte avaliação física de Personal Trainer (Padrão Physical Test) e elabore a Hipótese Diagnóstica / Avaliação Funcional, Diagnóstico Funcional (pontos fortes e limitações), Objetivos do Treinamento priorizados e o Plano de Treinamento semana a semana periodizado (12 semanas, cobrindo volume, intensidade, foco e critérios) em formato JSON.

DADOS DO ALUNO E AVALIAÇÃO FÍSICA:
- Nome/Identificação: ${avaliacaoData.paciente_nome || 'Aluno SOUL'} (Nasc: ${avaliacaoData.paciente_nascimento || 'Não informado'})
- Objetivo Principal da Rotina: ${avaliacaoData.objetivo_principal || 'Condicionamento Físico Geral'}
- Nível de Experiência: ${avaliacaoData.nivel_experiencia || 'Intermediário'} | Frequência Semanal: ${avaliacaoData.frequencia_semanal || 3}x/semana
- Restrições / Alertas de Treino: ${avaliacaoData.restricoes_treino || 'Nenhuma restrição relatada'}

1. ANAMNESE E SINAIS VITAIS:
${JSON.stringify(avaliacaoData.anamnese_personal || {})}

2. COMPOSIÇÃO CORPORAL (PHYSICAL TEST):
- Protocolo: ${avaliacaoData.composicao_corporal?.protocolo || 'Pollock / Guedes'}
- % Gordura: ${avaliacaoData.composicao_corporal?.percentual_gordura ?? avaliacaoData.percentual_gordura ?? 'Não medido'}%
- Massa Gorda: ${avaliacaoData.composicao_corporal?.massa_gorda_kg ?? '—'} kg | Massa Magra: ${avaliacaoData.composicao_corporal?.massa_magra_kg ?? '—'} kg | Peso Ideal Estimado: ${avaliacaoData.composicao_corporal?.peso_ideal_kg ?? '—'} kg
- Dobras Cutâneas (mm): ${JSON.stringify(avaliacaoData.composicao_corporal?.dobras || {})}
- Perímetros Corporais (cm): ${JSON.stringify(avaliacaoData.composicao_corporal?.perimetros || {})}
- Classificação: ${JSON.stringify(avaliacaoData.composicao_corporal?.classificacao_gordura || {})}

3. FORÇA POR DINAMÔMETRO MANUAL & TESTES:
- Movimentos e Assimetrias (%): ${JSON.stringify(avaliacaoData.forca_dinamometro?.movimentos || [])}
- Descrição da Força Muscular: ${avaliacaoData.forca_muscular_descricao || '—'}
- Teste 1RM: ${avaliacaoData.teste_1rm || '—'} | Resistência Muscular: ${avaliacaoData.resistencia_muscular || '—'}

4. FLEXIBILIDADE:
- Banco de Wells: ${JSON.stringify(avaliacaoData.flexibilidade_dados?.banco_wells || {})}
- Flexitest: ${JSON.stringify(avaliacaoData.flexibilidade_dados?.flexitest_notas || {})} (Total: ${avaliacaoData.flexibilidade_dados?.flexitest_total ?? '—'}, Classificação: ${avaliacaoData.flexibilidade_dados?.flexitest_classificacao ?? '—'})
- Obs Flexibilidade: ${avaliacaoData.flexibilidade_dados?.observacoes || '—'}

5. POSTURA ESTÁTICA:
- Vista Anterior: ${JSON.stringify(avaliacaoData.postural_dados?.vista_anterior || {})}
- Vista Posterior: ${JSON.stringify(avaliacaoData.postural_dados?.vista_posterior || {})}
- Vista Lateral: ${JSON.stringify(avaliacaoData.postural_dados?.vista_lateral || {})}
- Conclusão Postural: ${avaliacaoData.postural_dados?.conclusao_postural || '—'}

6. TESTE FUNCIONAL DE CORE (MCGILL):
- Tempos (segundos): Prancha Ventral: ${avaliacaoData.core_mcgill?.prancha_ventral_seg ?? '—'}s, Lat D: ${avaliacaoData.core_mcgill?.prancha_lat_d_seg ?? '—'}s, Lat E: ${avaliacaoData.core_mcgill?.prancha_lat_e_seg ?? '—'}s, Extensão Biering: ${avaliacaoData.core_mcgill?.extensao_biering_seg ?? '—'}s, Flexão Tronco: ${avaliacaoData.core_mcgill?.flexao_tronco_seg ?? '—'}s
- Razões McGill: Flexão/Extensão: ${avaliacaoData.core_mcgill?.razao_flexao_extensao ?? '—'}, Lateral/Extensão: ${avaliacaoData.core_mcgill?.razao_lat_extensao ?? '—'}, Lateral D/E: ${avaliacaoData.core_mcgill?.razao_lat_d_e ?? '—'}
- Alertas e Desbalanços: ${JSON.stringify(avaliacaoData.core_mcgill?.alertas || [])}

7. FMS (FUNCTIONAL MOVEMENT SCREEN):
- Score Total: ${avaliacaoData.fms_dados?.score_total ?? '—'} / 21
- Assimetrias Encontradas: ${avaliacaoData.fms_dados?.assimetrias_total ?? '—'}
- Classificação de Risco: ${avaliacaoData.fms_dados?.classificacao_risco || '—'}
- Detalhe dos Itens: ${JSON.stringify(avaliacaoData.fms_dados?.itens || {})}
- Estratégia Treino FMS: ${avaliacaoData.fms_dados?.estrategia_treino || '—'}

8. METAS PREVIAS & DIVISÃO PRETENDIDA:
${JSON.stringify(avaliacaoData.metas_treino || {})}
- Observações prévias: ${avaliacaoData.observacoes || '—'}

Por favor, responda estritamente com uma estrutura JSON válida contendo:
{
  "hipotese_diagnostica": "string detalhada com o raciocínio funcional integrando composição, riscos, assimetrias e testes",
  "diagnostico_funcional": "string destacando pontos fortes e limitações prioritárias do aluno",
  "objetivos_treinamento": "string com objetivos de curto prazo (30-60 dias), médio prazo (3-6 meses) e longo prazo (12 meses)",
  "plano_tratamento_semanal": [
    {
      "semana": "Semanas 1–2",
      "foco": "Foco da fase (ex: Adaptação anatômica e controle motor de Core)",
      "condutas": "Exercícios específicos, divisão semanal sugerida, volume (séries x reps) e intensidade sugerida (RPE / % 1RM)",
      "criterios_evolucao": "Critérios para avançar para a próxima fase"
    }
  ],
  "sintese_geral": "string textual resumo para o prontuário"
}
O array "plano_tratamento_semanal" deve conter a periodização completa de 12 semanas (ex: dividido em 6 blocos de 2 semanas cada, cobrindo Semanas 1 a 12).`
      }

      const agentResult = $ai.agent('personal-clinica-soul').chat({
        user_id: userId,
        message: promptMensagem,
      })

      let parsed = null
      const content = agentResult?.content || ''

      try {
        const jsonMatch =
          content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const rawStr = jsonMatch[1] || jsonMatch[0]
          parsed = JSON.parse(rawStr)
        }
      } catch (err) {
        console.log('Aviso ao parsear JSON do agente de personal:', err)
      }

      return e.json(200, {
        raw_content: content,
        structured: parsed,
        citations: agentResult?.citations || [],
      })
    } catch (err) {
      console.log('Erro no endpoint personal/gerar-ia:', err)
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA indisponível temporariamente' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha no processamento do agente' : err.message,
        })
      }
      return e.json(500, {
        error: err?.message || 'Falha ao processar avaliação de personal com IA',
      })
    }
  },
  $apis.requireAuth(),
)
