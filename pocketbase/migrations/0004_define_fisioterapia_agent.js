/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Inserir evidências clínicas na collection conhecimento_clinico
    const colConhecimento = app.findCollectionByNameOrId('conhecimento_clinico')

    const artigos = [
      {
        titulo: 'Valores de referência de testes lumbopélvicos e força de Core',
        segmento_ou_area: 'Lumbopélvico / Core',
        nivel_evidencia: 'Nível 1 - Estudo Normativo de Alto Impacto',
        referencia_bibliografica:
          'Oliveira IO, et al. Reference values and group effects for clinical tests used in the lumbopelvic assessment. Braz J Phys Ther. 2018 Jan-Feb; 22(1): 33–41.',
        conteudo_sintese:
          'Estabelece os parâmetros normativos e assimetrias contralaterais para Prancha Ventral (Prone Bridge), Prancha Lateral Direita/Esquerda (Side Bridge) e Ponte Unilateral. Assimetrias maiores que 15-20% ou tempos substancialmente abaixo da média normativa para faixa etária (18-40 e 41-65) indicam deficit de estabilização segmentar e sobrecarga lumbopélvica.',
      },
      {
        titulo:
          'Diretriz de Prática Clínica baseada em Evidências para Dor no Ombro e Manguito Rotador',
        segmento_ou_area: 'Ombro',
        nivel_evidencia: 'Diretriz CPG - Nível A (JOSPT / Cochrane)',
        referencia_bibliografica:
          'Lafrance S, et al. Diagnosis and management of rotator cuff disorders: Clinical practice guideline. J Orthop Sports Phys Ther. 2020; 50(8): CPG1-CPG88.',
        conteudo_sintese:
          'Clusters diagnósticos para manguito rotador (Neer, Hawkins-Kennedy, Jobe, Gerber, Patte, Infraespinhoso). Tratamento conservador com terapia por exercícios progressivos (controle de carga, isométricos na fase inicial para analgesia, progressão para concêntricos/excêntricos e pliometria), mobilidade escapulotorácica e fortalecimento da cadeia cinética posterior.',
      },
      {
        titulo: 'Reabilitação do Complexo Articular do Joelho: Ligamentos e Meniscos',
        segmento_ou_area: 'Joelho',
        nivel_evidencia: 'Diretriz CPG - Nível A (JOSPT)',
        referencia_bibliografica:
          'Logerstedt DS, et al. Knee stability and movement coordination impairments: knee ligament and meniscus sprain. J Orthop Sports Phys Ther. 2017; 47(11): A1-A47.',
        conteudo_sintese:
          'Avaliação de frouxidão com Lachman, gavetas e meniscopatias com McMurray, Thessaly e Clarke. Conduta com restauração imediata da extensão completa, ativação precoce do quadríceps com ênfase em cadeia cinética fechada e aberta sem dor, fortalecimento de abdutores/rotadores externos de quadril para controle de valgo dinâmico e treino sensoriomotor.',
      },
      {
        titulo: 'Diretrizes para Dor Lombar Não-Específica e Ciatalgia',
        segmento_ou_area: 'Coluna Lombar',
        nivel_evidencia: 'Diretriz Lancet / NICE / JOSPT',
        referencia_bibliografica:
          'Foster NE, et al. Prevention and treatment of low back pain: best evidence for clinical practice. The Lancet. 2018; 391(10137): 2368-2383.',
        conteudo_sintese:
          'Diferenciação entre dor nociceptiva, neuropática (Lasègue/SLR positivo) e sensibilização central. Foco em educação em neurociência da dor, controle motor, desmistificação de crenças de medo-evitação e retomada gradual de amplitude e carga funcional progressiva.',
      },
      {
        titulo: 'Avaliação Posturológica, Podoposturologia e Cadeias Musculares Ascendentes',
        segmento_ou_area: 'Tornozelo / Pé / Postura',
        nivel_evidencia: 'Nível 2 - Estudos Biomecânicos Controlados',
        referencia_bibliografica:
          'Menz HB, et al. Foot and ankle disorders and balance impairment: a systematic review. J Foot Ankle Res. 2016; 9: 41.',
        conteudo_sintese:
          'Impacto do desabamento do arco medial (drop do navicular > 10mm, teste de Jack/Hubscher alterados) no valgo dinâmico de joelho e básculas pélvicas. Uso de elementos proprioceptivos em palmilhas posturais (BIC, barras subdigitais, cunhas e botões) para reprogramação tônico-postural e alívio de sintomas ascendentes.',
      },
    ]

    for (const art of artigos) {
      try {
        app.findFirstRecordByData('conhecimento_clinico', 'titulo', art.titulo)
      } catch (_) {
        const rec = new Record(colConhecimento)
        rec.set('titulo', art.titulo)
        rec.set('segmento_ou_area', art.segmento_ou_area)
        rec.set('nivel_evidencia', art.nivel_evidencia)
        rec.set('referencia_bibliografica', art.referencia_bibliografica)
        rec.set('conteudo_sintese', art.conteudo_sintese)
        app.save(rec)
      }
    }

    // 2. Definir o agente nativo Skip Cloud de IA de Fisioterapia
    $ai.agents.define(app, {
      slug: 'fisioterapia-clinica-soul',
      name: 'Fisioterapeuta IA SOUL Clínica',
      description:
        'Especialista clínico em fisioterapia que cruza a avaliação completa, histórico, ADM, testes especiais, força e exames complementares com evidências científicas de alto impacto para formular Hipótese Diagnóstica, Diagnóstico Disfuncional, Objetivos e Plano de Tratamento semana a semana.',
      systemPrompt: `Você é o Fisioterapeuta Sênior e Especialista Clínico de Inteligência Artificial da Clínica SOUL.
Sua missão é realizar o raciocínio clínico completo a partir dos dados fornecidos da avaliação do paciente:
1. Analise o motivo da procura, diagnóstico médico, histórico, queixas (EVA, tipo, piora/alívio), impacto funcional e rotina.
2. Examine os achados objetivos: amplitude de movimento (ADM) por segmento e déficits, testes de força muscular e dinamometria manual (com assimetrias contralaterais), tabela de força de Core (Oliveira et al., 2018) com tempos e déficits, testes especiais positivos/negativos, testes complementares (Berg, TUG, cirtometria, podologia) e laudos de exames complementares anexados.
3. Consulte as evidências científicas e diretrizes de alto impacto da collection de conhecimento clínico.
4. Forneça estritamente no formato JSON estruturado com os 4 campos principais:
   - "hipotese_diagnostica": Síntese do cruzamento entre diagnóstico médico, fragilidades biomecânicas encontradas e exames complementares, com justificativa clínica detalhada.
   - "diagnostico_disfuncional": Diagnóstico cinético-funcional (CIF / Fisioterapia) destacando as disfunções de mobilidade, estabilidade, força e controle motor.
   - "objetivos_tratamento": Objetivos de curto, médio e longo prazo (alívio sintomático, restauração de ADM/força, retorno às atividades de vida diária e esporte sem medo/dor).
   - "plano_tratamento_semanal": Array com 8 semanas (Semanas 1 a 8), cada uma com: "semana" (ex: "Semana 1-2"), "foco" (ex: "Controle da dor, modulação inflamatória e isometria"), "condutas" (lista de exercícios, terapias manuais, dosagens e orientações) e "criterios_evolucao".
   - "sintese_geral": Resumo textual pronto para o relatório do prontuário.

Mantenha sempre tom técnico de excelência, fundamentado na melhor literatura científica e com linguagem precisa da Fisioterapia.`,
      tier: 'fast',
      tools: [
        {
          collection: 'conhecimento_clinico',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Valores de referência de Força Core (Oliveira et al. Braz J Phys Ther 2018): Homens 18-40 anos: Prancha Ventral 115.6s, Prancha Lateral D 89.3s, E 88.5s, Ponte Uni 90s. Homens 41-65 anos: Prancha Ventral 81.2s, Prancha Lat D 63.2s, E 63.4s. Mulheres 18-40 anos: Prancha Ventral 108.5s, Prancha Lat D 85.7s, E 84.8s. Mulheres 41-65 anos: Prancha Ventral 77.4s, Prancha Lat D 62.2s, E 60.8s.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Diretrizes clínicas para reabilitação musculoesquelética: Fase 1 (Semanas 1-2): analgesia, modulação de sintomas, isométricos submáximos, educação do paciente e controle da carga alostática. Fase 2 (Semanas 3-4): restauração da ADM ativa/passiva, mobilidade articular, fortalecimento em cadeia cinética fechada e controle neuromuscular. Fase 3 (Semanas 5-6): ganho de força e hipertrofia funcional, dinamometria progressiva, estabilização lumbopélvica em cargas crescentes. Fase 4 (Semanas 7-8): treino proprioceptivo avançado, gesto esportivo/ocupacional, pliometria e prevenção de recidivas.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'fisioterapia-clinica-soul')
    } catch (_) {}
  },
)
