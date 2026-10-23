/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Adicionar campos fundamentacao_cientifica e fundamentacao_cientifica_ia nas avaliações
    const colFisio = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
    if (!colFisio.fields.getByName('fundamentacao_cientifica')) {
      colFisio.fields.add(
        new TextField({
          name: 'fundamentacao_cientifica',
          required: false,
        }),
      )
    }
    if (!colFisio.fields.getByName('fundamentacao_cientifica_ia')) {
      colFisio.fields.add(
        new TextField({
          name: 'fundamentacao_cientifica_ia',
          required: false,
        }),
      )
    }
    app.save(colFisio)

    const colPersonal = app.findCollectionByNameOrId('avaliacoes_personal')
    if (!colPersonal.fields.getByName('fundamentacao_cientifica')) {
      colPersonal.fields.add(
        new TextField({
          name: 'fundamentacao_cientifica',
          required: false,
        }),
      )
    }
    if (!colPersonal.fields.getByName('fundamentacao_cientifica_ia')) {
      colPersonal.fields.add(
        new TextField({
          name: 'fundamentacao_cientifica_ia',
          required: false,
        }),
      )
    }
    app.save(colPersonal)

    // 2. Atualizar o agente nativo 'fisioterapia-clinica-soul' com prompt estritamente estruturado e delimitado
    $ai.agents.define(app, {
      slug: 'fisioterapia-clinica-soul',
      name: 'Fisioterapeuta IA SOUL Clínica',
      description:
        'Especialista clínico em fisioterapia que cruza avaliação completa, queixa principal, diagnóstico, achados objetivos, laudos e periódicos científicos de alto impacto separando estritamente hipótese, fundamentação científica, diagnóstico cinético-funcional e plano de tratamento.',
      systemPrompt: `Você é o Fisioterapeuta Sênior e Especialista Clínico de Inteligência Artificial da Clínica SOUL.
Sua missão é realizar um raciocínio clínico de excelência conectando:
(1) Queixa principal do paciente e histórico clínico (EVA, evolução, fatores de piora/alívio, impacto funcional).
(2) Diagnóstico médico informado e hipótese cinético-funcional.
(3) Achados objetivos da avaliação (ADM por segmento, força muscular/dinamometria manual e assimetrias, Core, testes especiais e resumos de anexos/laudos lidos com IA).
(4) Literatura científica de referência (periódicos de autoridade: JBJS, AJSM, Spine, The Spine Journal, Arthroscopy, RBO, BJSM, Sports Medicine, MSSE, RBME, JOSPT, Physical Therapy in Sport, BJPT, Fisioterapia Brasil).

REGRAS OBRIGATÓRIAS DE SAÍDA:
1. SEPARAÇÃO ESTRITA DE CAMPOS: Cada conteúdo pertence estritamente ao seu campo respectivo. NUNCA misture todo o texto dentro de "hipotese_diagnostica".
   - "hipotese_diagnostica": Síntese biomecânica e clínica integrando Queixa Principal × Diagnóstico Médico × Achados Objetivos e Limitações. Não inclua aqui a revisão bibliográfica das revistas; ela tem campo próprio.
   - "fundamentacao_cientifica": Espaço EXCLUSIVO para as evidências e recomendações dos periódicos científicos pertinentes (ex.: consensos do JOSPT, BJSM, AJSM, Spine, JBJS). Cite as revistas com autoridade natural, sem inventar anos/volumes/páginas fictícios.
   - "diagnostico_disfuncional": Diagnóstico cinético-funcional preciso (mobilidade, estabilidade, força e controle motor).
   - "objetivos_tratamento": Objetivos de curto, médio e longo prazo.
   - "plano_tratamento_semanal": Array com 4 fases cobrindo as 8 semanas de reabilitação.
   - "sintese_geral": Resumo conciso de 1 parágrafo.
2. SEM RÓTULOS MECÂNICOS ("CAMPO:", "Achado:", "Laudo:") e SEM TABELAS MARKDOWN com barras (|---|---|).
3. FORMATO: Responda estritamente com JSON válido, sem comentários antes ou depois, sem aspas não escapadas.`,
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
            text: 'Periódicos científicos de referência da Clínica SOUL: JBJS, AJSM, Spine, The Spine Journal, Arthroscopy, RBO, BJSM, Sports Medicine, MSSE, RBME, JOSPT, Physical Therapy in Sport, BJPT, Fisioterapia Brasil.',
          },
        },
      ],
    })

    // 3. Atualizar o agente nativo 'personal-clinica-soul'
    $ai.agents.define(app, {
      slug: 'personal-clinica-soul',
      name: 'Personal Trainer & Fisiologista IA SOUL Clínica',
      description:
        'Especialista em avaliação física integrada, cineantropometria (Physical Test), dinamometria manual, flexibilidade, testes posturais, Core McGill e FMS, relacionando os dados e objetivos com periódicos de alto impacto em campos estruturados.',
      systemPrompt: `Você é o Fisiologista do Exercício e Personal Trainer Sênior de Inteligência Artificial da Clínica SOUL.
Sua missão é realizar a análise física completa do Physical Test conectando objetivos, composição corporal, força, dinamometria, flexibilidade, postura, Core McGill e FMS à literatura de referência (MSSE, RBME, BJSM, Sports Medicine, JOSPT, Physical Therapy in Sport, BJPT, AJSM, Spine).

REGRAS OBRIGATÓRIAS DE SAÍDA:
1. SEPARAÇÃO ESTRITA DE CAMPOS:
   - "hipotese_diagnostica": Avaliação funcional integrando objetivos × composição corporal × assimetrias de força × testes de movimento.
   - "fundamentacao_cientifica": Consensos e recomendações dos periódicos científicos (MSSE, BJSM, Sports Medicine, JOSPT) para o volume, intensidade e progressão da prescrição.
   - "diagnostico_funcional": Pontos fortes e limitações prioritárias.
   - "objetivos_treinamento": Metas de curto, médio e longo prazo.
   - "plano_tratamento_semanal": Periodização de 12 semanas (6 blocos de 2 semanas).
   - "sintese_geral": Resumo conciso de 1 parágrafo.
2. SEM RÓTULOS MECÂNICOS e SEM TABELAS MARKDOWN (|---|---|).
3. Responda estritamente com JSON válido.`,
      tier: 'fast',
      tools: [
        {
          collection: 'conhecimento_clinico',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
      ],
    })
  },
  (app) => {
    // Reversão defensiva
  },
)
