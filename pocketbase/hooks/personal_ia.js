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

      function cleanMarkdownCru(str) {
        if (!str || typeof str !== 'string') return ''
        return str
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/^(\s*[-•*]\s*)?CAMPO\s*:\s*/gim, '$1')
          .replace(/\bCAMPO\s*:\s*/gi, '')
          .replace(/^\|.*\|$/gm, '')
          .replace(/^[-:|\s]{3,}$/gm, '')
          .trim()
      }

      function tentarParsearJson(raw) {
        if (!raw || typeof raw !== 'string') return null
        let text = raw.trim()

        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
        if (codeBlockMatch) {
          text = codeBlockMatch[1].trim()
        } else {
          const firstBrace = text.indexOf('{')
          const lastBrace = text.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1)
          }
        }

        try {
          return JSON.parse(text)
        } catch (_) {}

        try {
          const semTrailingCommas = text
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2018\u2019]/g, "'")
          return JSON.parse(semTrailingCommas)
        } catch (_) {}

        return null
      }

      function extrairCamposPorHeuristicaPersonal(raw) {
        if (!raw || typeof raw !== 'string') return null

        const result = {
          hipotese_diagnostica: '',
          fundamentacao_cientifica: '',
          diagnostico_funcional: '',
          objetivos_treinamento: '',
          plano_tratamento_semanal: [],
          sintese_geral: '',
        }

        const regexMarcador =
          /(?:###\s*([A-Z0-9_]+)\s*###|^([A-Z0-9_]+)\s*:)\s*([\s\S]*?)(?=(?:###\s*[A-Z0-9_]+\s*###|^[A-Z0-9_]+\s*:)|$)/gim
        let matchMarcador
        let encontrouMarcador = false

        while ((matchMarcador = regexMarcador.exec(raw)) !== null) {
          const tag = (matchMarcador[1] || matchMarcador[2] || '').toUpperCase()
          const val = (matchMarcador[3] || '').trim()
          if (!val) continue

          if (tag.includes('HIPOTESE')) {
            result.hipotese_diagnostica = val
            encontrouMarcador = true
          } else if (tag.includes('FUNDAMENTACAO') || tag.includes('PERIODIC')) {
            result.fundamentacao_cientifica = val
            encontrouMarcador = true
          } else if (tag.includes('DIAGNOSTICO') || tag.includes('FUNCIONAL')) {
            result.diagnostico_funcional = val
            encontrouMarcador = true
          } else if (tag.includes('OBJETIV') || tag.includes('METAS')) {
            result.objetivos_treinamento = val
            encontrouMarcador = true
          } else if (tag.includes('PLANO') || tag.includes('SEMANAL') || tag.includes('PERIODIZ')) {
            result.plano_texto = val
            encontrouMarcador = true
          } else if (tag.includes('SINTESE') || tag.includes('RESUMO')) {
            result.sintese_geral = val
            encontrouMarcador = true
          }
        }

        if (
          encontrouMarcador &&
          (result.hipotese_diagnostica ||
            result.diagnostico_funcional ||
            result.objetivos_treinamento)
        ) {
          return result
        }

        const secoes = [
          {
            key: 'hipotese_diagnostica',
            padroes: [
              /hip[oó]tese\s*diagn[oó]stica/i,
              /avalia[cç][aã]o\s*funcional/i,
              /hip[oó]tese/i,
            ],
          },
          {
            key: 'fundamentacao_cientifica',
            padroes: [
              /fundamenta[cç][aã]o\s*cient[ií]fica/i,
              /peri[oó]dicos\s*cient[ií]ficos/i,
              /literatura\s*cient[ií]fica/i,
            ],
          },
          {
            key: 'diagnostico_funcional',
            padroes: [/diagn[oó]stico\s*funcional/i, /pontos\s*fortes\s*e\s*limita[cç][oõ]es/i],
          },
          {
            key: 'objetivos_treinamento',
            padroes: [/objetivos\s*(?:do\s*treinamento|priorizados)?/i],
          },
          {
            key: 'sintese_geral',
            padroes: [/s[ií]ntese\s*geral/i, /observa[cç][oõ]es\s*finais/i],
          },
        ]

        const linhas = raw.split('\n')
        let chaveAtual = 'hipotese_diagnostica'
        const acumuladores = {
          hipotese_diagnostica: [],
          fundamentacao_cientifica: [],
          diagnostico_funcional: [],
          objetivos_treinamento: [],
          sintese_geral: [],
        }

        for (let i = 0; i < linhas.length; i++) {
          const linha = linhas[i]
          const trimmed = linha.trim()

          const limpoHeader = trimmed
            .replace(/^#{1,6}\s*/, '')
            .replace(/^\d+[\.\)\-]\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/:$/, '')
            .trim()

          let achouSecao = false
          if (limpoHeader.length > 3 && limpoHeader.length < 60) {
            for (const s of secoes) {
              if (s.padroes.some((p) => p.test(limpoHeader))) {
                chaveAtual = s.key
                achouSecao = true
                break
              }
            }
          }

          if (!achouSecao) {
            if (acumuladores[chaveAtual]) {
              acumuladores[chaveAtual].push(linha)
            }
          }
        }

        result.hipotese_diagnostica = acumuladores.hipotese_diagnostica.join('\n').trim()
        result.fundamentacao_cientifica = acumuladores.fundamentacao_cientifica.join('\n').trim()
        result.diagnostico_funcional = acumuladores.diagnostico_funcional.join('\n').trim()
        result.objetivos_treinamento = acumuladores.objetivos_treinamento.join('\n').trim()
        result.sintese_geral = acumuladores.sintese_geral.join('\n').trim()

        if (
          !result.fundamentacao_cientifica &&
          !result.diagnostico_funcional &&
          result.hipotese_diagnostica.length > 500
        ) {
          const paragrafos = result.hipotese_diagnostica.split(/\n\s*\n/).filter((p) => p.trim())
          if (paragrafos.length >= 3) {
            const idxPeriodico = paragrafos.findIndex((p) =>
              /MSSE|RBME|BJSM|Sports Medicine|JOSPT|BJPT|AJSM|Spine/i.test(p),
            )
            if (idxPeriodico !== -1) {
              result.fundamentacao_cientifica = paragrafos[idxPeriodico].trim()
              paragrafos.splice(idxPeriodico, 1)
            }
            const idxDiag = paragrafos.findIndex((p) =>
              /diagn[oó]stico|pontos fortes|limita[cç][oõ]es/i.test(p),
            )
            if (idxDiag !== -1) {
              result.diagnostico_funcional = paragrafos[idxDiag].trim()
              paragrafos.splice(idxDiag, 1)
            }
            result.hipotese_diagnostica = paragrafos.join('\n\n').trim()
          }
        }

        return result
      }

      const avaliacaoData = body.avaliacao || {}
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
      "medida_exata": "string com a medida numérica registrada",
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
        promptMensagem = `Realize a análise funcional e biomecânica completa da seguinte avaliação física de Personal Trainer (Padrão Physical Test) da Clínica SOUL.
Sua missão é formular uma CONCLUSÃO COM IA com separação estrita dos 6 campos:
1. "hipotese_diagnostica": Avaliação funcional e biomecânica integrando objetivos do aluno × composição corporal × assimetrias de força × testes funcionais.
2. "fundamentacao_cientifica": Citação natural de periódicos científicos de referência (MSSE, RBME, BJSM, Sports Medicine, JOSPT, Physical Therapy in Sport, BJPT, AJSM, Spine) com diretrizes de volume, intensidade e progressão da prescrição. NÃO coloque dentro da hipótese.
3. "diagnostico_funcional": Pontos fortes e limitações prioritárias.
4. "objetivos_treinamento": Objetivos de curto, médio e longo prazo.
5. "plano_tratamento_semanal": Periodização completa de 12 semanas (6 blocos de 2 semanas).
6. "sintese_geral": Resumo textual pronto para o prontuário.

DADOS DO ALUNO E AVALIAÇÃO FÍSICA:
- Nome: ${avaliacaoData.paciente_nome || 'Aluno SOUL'}
- Objetivo Principal: ${avaliacaoData.objetivo_principal || 'Condicionamento Físico Geral'}
- Nível: ${avaliacaoData.nivel_experiencia || 'Intermediário'} | Frequência: ${avaliacaoData.frequencia_semanal || 3}x/semana
- Restrições: ${avaliacaoData.restricoes_treino || 'Nenhuma'}
- Composição Corporal: %G=${avaliacaoData.composicao_corporal?.percentual_gordura ?? avaliacaoData.percentual_gordura ?? 'Não medido'}%
- Força & Dinamometria: ${JSON.stringify(avaliacaoData.forca_dinamometro?.movimentos || [])}
- Flexibilidade: Wells=${JSON.stringify(avaliacaoData.flexibilidade_dados?.banco_wells || {})}
- Postura Estática: ${JSON.stringify(avaliacaoData.postural_dados || {})}
- Core McGill: ${JSON.stringify(avaliacaoData.core_mcgill || {})}
- FMS: Total=${avaliacaoData.fms_dados?.score_total ?? '—'} / 21
- Metas Prévias: ${JSON.stringify(avaliacaoData.metas_treino || {})}
- Laudos de Exames / Anexos: ${JSON.stringify(avaliacaoData.resumos_anexos || {})}

DIRETRIZES:
- Sem rótulos mecânicos ("CAMPO:", "Achado:").
- Sem tabelas markdown (|---|---|).
- O formato prioritário de saída é JSON estrito.
- Caso não responda em JSON puro, separe os blocos com marcadores exatos:
HIPOTESE:
<conteudo>
FUNDAMENTACAO:
<conteudo>
DIAGNOSTICO:
<conteudo>
OBJETIVOS:
<conteudo>
PLANO_SEMANAL:
<conteudo>
SINTESE:
<conteudo>

Responda estritamente com JSON válido:
{
  "hipotese_diagnostica": "...",
  "fundamentacao_cientifica": "...",
  "diagnostico_funcional": "...",
  "objetivos_treinamento": "...",
  "plano_tratamento_semanal": [
    {
      "semana": "Semanas 1–2",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    },
    {
      "semana": "Semanas 3–4",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    },
    {
      "semana": "Semanas 5–6",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    },
    {
      "semana": "Semanas 7–8",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    },
    {
      "semana": "Semanas 9–10",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    },
    {
      "semana": "Semanas 11–12",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    }
  ],
  "sintese_geral": "..."
}`
      }

      const agentResult = $ai.agent('personal-clinica-soul').chat({
        user_id: userId,
        message: promptMensagem,
      })

      const content = agentResult?.content || ''
      let parsed = tentarParsearJson(content)

      if (
        !modoCruzamento &&
        (!parsed || typeof parsed !== 'object' || !parsed.hipotese_diagnostica)
      ) {
        const heuristico = extrairCamposPorHeuristicaPersonal(content)
        if (
          heuristico &&
          (heuristico.hipotese_diagnostica || heuristico.fundamentacao_cientifica)
        ) {
          parsed = {
            ...(parsed || {}),
            ...heuristico,
          }
        }
      }

      if (parsed) {
        if (parsed.hipotese_diagnostica) {
          parsed.hipotese_diagnostica = cleanMarkdownCru(parsed.hipotese_diagnostica)
        }
        if (parsed.fundamentacao_cientifica) {
          parsed.fundamentacao_cientifica = cleanMarkdownCru(parsed.fundamentacao_cientifica)
        }
        if (parsed.diagnostico_funcional) {
          parsed.diagnostico_funcional = cleanMarkdownCru(parsed.diagnostico_funcional)
        }
        if (parsed.objetivos_treinamento) {
          parsed.objetivos_treinamento = cleanMarkdownCru(parsed.objetivos_treinamento)
        }
        if (parsed.sintese_geral) {
          parsed.sintese_geral = cleanMarkdownCru(parsed.sintese_geral)
        }

        if (!parsed.fundamentacao_cientifica && parsed.hipotese_diagnostica) {
          const regexSep =
            /(?:Fundamenta[cç][aã]o\s*Cient[ií]fica|Peri[oó]dicos\s*(?:de\s*Refer[eê]ncia)?|Literatura\s*Cient[ií]fica)[:\s]*([\s\S]*)$/i
          const sepMatch = parsed.hipotese_diagnostica.match(regexSep)
          if (sepMatch && sepMatch[1] && sepMatch[1].trim().length > 20) {
            parsed.fundamentacao_cientifica = sepMatch[1].trim()
            parsed.hipotese_diagnostica = parsed.hipotese_diagnostica.replace(regexSep, '').trim()
          }
        }

        if (parsed.fundamentacao_cientifica && parsed.hipotese_diagnostica) {
          if (parsed.hipotese_diagnostica.includes(parsed.fundamentacao_cientifica)) {
            parsed.hipotese_diagnostica = parsed.hipotese_diagnostica
              .replace(parsed.fundamentacao_cientifica, '')
              .replace(/Fundamenta[cç][aã]o\s*Cient[ií]fica(?:\s*\(.*?\))?:?/gi, '')
              .trim()
          }
        }
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
