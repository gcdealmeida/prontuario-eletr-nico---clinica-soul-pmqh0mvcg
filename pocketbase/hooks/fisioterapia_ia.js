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

      function extrairCamposPorHeuristicaFisio(raw) {
        if (!raw || typeof raw !== 'string') return null

        const result = {
          hipotese_diagnostica: '',
          fundamentacao_cientifica: '',
          diagnostico_disfuncional: '',
          objetivos_tratamento: '',
          plano_tratamento_semanal: [],
          sintese_geral: '',
        }

        // 1. Tentar marcadores explícitos estilo TAG: ou ###TAG###
        const marcadoresFortes = [
          {
            key: 'hipotese_diagnostica',
            padrao: /(?:###\s*HIPOTESE(?:_DIAGNOSTICA)?\s*###|^HIPOTESE(?:_DIAGNOSTICA)?\s*:)/im,
          },
          {
            key: 'fundamentacao_cientifica',
            padrao:
              /(?:###\s*(?:FUNDAMENTACAO|PERIODICOS)(?:_CIENTIFICA)?\s*###|^(?:FUNDAMENTACAO(?:_CIENTIFICA)?|PERIODICOS)\s*:)/im,
          },
          {
            key: 'diagnostico_disfuncional',
            padrao:
              /(?:###\s*(?:DIAGNOSTICO_DISFUNCIONAL|DIAGNOSTICO_CINETICO|DIAGNOSTICO)\s*###|^(?:DIAGNOSTICO_DISFUNCIONAL|DIAGNOSTICO_CINETICO|DIAGNOSTICO)\s*:)/im,
          },
          {
            key: 'objetivos_tratamento',
            padrao:
              /(?:###\s*(?:OBJETIVOS_TRATAMENTO|OBJETIVOS)\s*###|^(?:OBJETIVOS_TRATAMENTO|OBJETIVOS)\s*:)/im,
          },
          {
            key: 'plano_texto',
            padrao:
              /(?:###\s*(?:PLANO_TRATAMENTO_SEMANAL|PLANO_SEMANAL|PLANO_TRATAMENTO)\s*###|^(?:PLANO_TRATAMENTO_SEMANAL|PLANO_SEMANAL|PLANO_TRATAMENTO)\s*:)/im,
          },
          {
            key: 'sintese_geral',
            padrao:
              /(?:###\s*(?:SINTESE_GERAL|SINTESE|RESUMO)\s*###|^(?:SINTESE_GERAL|SINTESE|RESUMO)\s*:)/im,
          },
        ]

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
          } else if (
            tag.includes('DIAGNOSTICO') ||
            tag.includes('DISFUNCIONAL') ||
            tag.includes('CINETICO')
          ) {
            result.diagnostico_disfuncional = val
            encontrouMarcador = true
          } else if (tag.includes('OBJETIV')) {
            result.objetivos_tratamento = val
            encontrouMarcador = true
          } else if (tag.includes('PLANO') || tag.includes('SEMANAL')) {
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
            result.diagnostico_disfuncional ||
            result.objetivos_tratamento)
        ) {
          return result
        }

        const secoes = [
          {
            key: 'hipotese_diagnostica',
            padroes: [/hip[oó]tese\s*diagn[oó]stica/i, /hip[oó]tese/i],
          },
          {
            key: 'fundamentacao_cientifica',
            padroes: [
              /fundamenta[cç][aã]o\s*cient[ií]fica/i,
              /peri[oó]dicos\s*cient[ií]ficos/i,
              /literatura\s*cient[ií]fica/i,
              /evid[eê]ncias\s*cient[ií]ficas/i,
            ],
          },
          {
            key: 'diagnostico_disfuncional',
            padroes: [
              /diagn[oó]stico\s*cin[eé]tico[- ]funcional/i,
              /diagn[oó]stico\s*disfuncional/i,
              /diagn[oó]stico\s*fisioterap[eê]utico/i,
            ],
          },
          {
            key: 'objetivos_tratamento',
            padroes: [/objetivos\s*(?:do\s*tratamento|terap[eê]uticos)?/i],
          },
          {
            key: 'plano_texto',
            padroes: [/plano\s*de\s*tratamento/i, /plano\s*semanal/i, /periodiza[cç][aã]o/i],
          },
          {
            key: 'sintese_geral',
            padroes: [/s[ií]ntese\s*geral/i, /resumo\s*do\s*prontu[aá]rio/i],
          },
        ]

        const linhas = raw.split('\n')
        let chaveAtual = 'hipotese_diagnostica'
        const acumuladores = {
          hipotese_diagnostica: [],
          fundamentacao_cientifica: [],
          diagnostico_disfuncional: [],
          objetivos_tratamento: [],
          plano_texto: [],
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
        result.diagnostico_disfuncional = acumuladores.diagnostico_disfuncional.join('\n').trim()
        result.objetivos_tratamento = acumuladores.objetivos_tratamento.join('\n').trim()
        result.sintese_geral = acumuladores.sintese_geral.join('\n').trim()

        if (
          !result.fundamentacao_cientifica &&
          !result.diagnostico_disfuncional &&
          result.hipotese_diagnostica.length > 500
        ) {
          const paragrafos = result.hipotese_diagnostica.split(/\n\s*\n/).filter((p) => p.trim())
          if (paragrafos.length >= 3) {
            const idxPeriodico = paragrafos.findIndex((p) =>
              /JOSPT|BJSM|AJSM|Spine|JBJS|BJPT|Arthroscopy|RBO|MSSE|RBME/i.test(p),
            )
            if (idxPeriodico !== -1) {
              result.fundamentacao_cientifica = paragrafos[idxPeriodico].trim()
              paragrafos.splice(idxPeriodico, 1)
            }

            const idxDiag = paragrafos.findIndex((p) =>
              /diagn[oó]stico|disfun[cç][aã]o|mobilidade|estabilidade/i.test(p),
            )
            if (idxDiag !== -1) {
              result.diagnostico_disfuncional = paragrafos[idxDiag].trim()
              paragrafos.splice(idxDiag, 1)
            }

            const idxObj = paragrafos.findIndex((p) => /objetivo/i.test(p))
            if (idxObj !== -1) {
              result.objetivos_tratamento = paragrafos[idxObj].trim()
              paragrafos.splice(idxObj, 1)
            }

            result.hipotese_diagnostica = paragrafos.join('\n\n').trim()
          }
        }

        return result
      }

      const avaliacaoData = body.avaliacao || {}

      const promptMensagem = `Realize a análise clínica completa da seguinte avaliação de fisioterapia da Clínica SOUL.
Sua missão é formular uma CONCLUSÃO COM IA com rigorosa divisão estruturada entre os 6 campos abaixo:
1. "hipotese_diagnostica": Síntese biomecânica relacionando Queixa Principal × Diagnóstico Médico × Achados Objetivos da Avaliação e Laudos.
2. "fundamentacao_cientifica": CITAÇÃO NATURAL DOS PERIÓDICOS CIENTÍFICOS (JBJS, AJSM, Spine, The Spine Journal, Arthroscopy, RBO, BJSM, Sports Medicine, MSSE, RBME, JOSPT, Physical Therapy in Sport, BJPT, Fisioterapia Brasil). Preconizações de consenso para a condição, cicatrização e progressão de carga. SEM inventar volume/página/ano falsos. DEVE FICAR ESTRITAMENTE NESTE CAMPO, NUNCA dentro da hipótese.
3. "diagnostico_disfuncional": Diagnóstico cinético-funcional preciso (mobilidade, estabilidade, força e controle motor).
4. "objetivos_tratamento": Objetivos de curto, médio e longo prazo.
5. "plano_tratamento_semanal": Array de 4 blocos cobrindo 8 semanas de reabilitação.
6. "sintese_geral": Resumo conciso de 1 parágrafo para o prontuário.

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

DIRETRIZES FUNDAMENTAIS:
- Não use rótulos mecânicos ("CAMPO:", "Achado:", "Laudo:").
- Não use tabelas markdown (|---|---|).
- Mantenha cada campo separado. NUNCA jogue todo o texto na hipótese diagnóstica.
- O formato prioritário de saída é JSON estrito.
- Caso não responda em JSON puro, você DEVE separar os blocos com marcadores exatos:
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

Responda estritamente com um JSON válido no formato:
{
  "hipotese_diagnostica": "...",
  "fundamentacao_cientifica": "...",
  "diagnostico_disfuncional": "...",
  "objetivos_tratamento": "...",
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
    }
  ],
  "sintese_geral": "..."
}`

      const agentResult = $ai.agent('fisioterapia-clinica-soul').chat({
        user_id: userId,
        message: promptMensagem,
      })

      const content = agentResult?.content || ''
      let parsed = tentarParsearJson(content)

      if (!parsed || typeof parsed !== 'object' || !parsed.hipotese_diagnostica) {
        const heuristico = extrairCamposPorHeuristicaFisio(content)
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
        if (parsed.diagnostico_disfuncional) {
          parsed.diagnostico_disfuncional = cleanMarkdownCru(parsed.diagnostico_disfuncional)
        }
        if (parsed.objetivos_tratamento) {
          parsed.objetivos_tratamento = cleanMarkdownCru(parsed.objetivos_tratamento)
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

        if (!Array.isArray(parsed.plano_tratamento_semanal)) {
          parsed.plano_tratamento_semanal = []
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
