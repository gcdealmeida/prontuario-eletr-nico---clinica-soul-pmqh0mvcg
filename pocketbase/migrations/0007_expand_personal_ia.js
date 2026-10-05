/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Expandir avaliacoes_personal com campos dedicados para a Hipótese Diagnóstica e IA
    const personalCol = app.findCollectionByNameOrId('avaliacoes_personal')

    if (!personalCol.fields.getByName('hipotese_diagnostica_ia')) {
      personalCol.fields.add(new TextField({ name: 'hipotese_diagnostica_ia' }))
    }

    if (!personalCol.fields.getByName('diagnostico_funcional')) {
      personalCol.fields.add(new TextField({ name: 'diagnostico_funcional' }))
    }

    if (!personalCol.fields.getByName('objetivos_treinamento')) {
      personalCol.fields.add(new TextField({ name: 'objetivos_treinamento' }))
    }

    if (!personalCol.fields.getByName('ia_plano_treino')) {
      personalCol.fields.add(new JSONField({ name: 'ia_plano_treino' }))
    }

    app.save(personalCol)

    // 2. Adicionar evidências e diretrizes de Educação Física / Treinamento de Força à collection conhecimento_clinico
    const colConhecimento = app.findCollectionByNameOrId('conhecimento_clinico')
    const artigosPersonal = [
      {
        titulo: 'Diretrizes do ACSM para Prescrição de Exercícios e Treinamento de Força',
        segmento_ou_area: 'Treinamento de Força / Fisiologia do Exercício',
        nivel_evidencia: 'Diretriz de Consenso Internacional (ACSM 2021)',
        referencia_bibliografica:
          "American College of Sports Medicine. ACSM's Guidelines for Exercise Testing and Prescription. 11th ed. Wolters Kluwer, 2021.",
        conteudo_sintese:
          'Parâmetros para prescrição de volume, intensidade (RPE/Zonas de FC) e frequência semanal. Ajustes para hipertrofia (6-12 reps, 67-85% 1RM), força máxima (>85% 1RM) e resistência muscular. Critérios para controle do risco cardiometabólico a partir de RCQ e IMC.',
      },
      {
        titulo: 'Functional Movement Screen (FMS) e Assimetrias Funcionais',
        segmento_ou_area: 'Biomecânica e Movimento Humano / FMS',
        nivel_evidencia: 'Nível 1 - Estudos Clínicos e Prospectivos de Coorte',
        referencia_bibliografica:
          'Cook G, Burton L, Hoogenboom BJ, Voight M. Functional movement screening: the use of fundamental movements to detect weaknesses. Int J Sports Phys Ther. 2014; 9(3): 396–419.',
        conteudo_sintese:
          'Score <= 14 ou qualquer assimetria contralateral (D≠E) ou dor nos clearing tests aumentam consideravelmente o risco de lesões musculoesqueléticas. A prioridade de treino deve ser primeiro mobilidade/estabilidade corretiva antes de carregar o padrão motor disfuncional.',
      },
      {
        titulo: 'Modelo McGill de Resistência Muscular e Saúde da Coluna Lombar',
        segmento_ou_area: 'Core / Coluna Lombar / McGill',
        nivel_evidencia: 'Nível 1 - Estudos Biomecânicos Normativos',
        referencia_bibliografica:
          'McGill SM, Childs A, Liebenson C. Endurance times for low back stabilization exercises: clinical targets for testing back fitness. Phys Med Rehabil. 1999; 80(8): 941–944.',
        conteudo_sintese:
          'Razões de equilíbrio de McGill: Flexão/Extensão < 1.0 (ideal 0.84); Lateral D ou E / Extensão < 0.75; Lateral D / Lateral E entre 0.95 e 1.05. Desbalanços acima dessas razões indicam sobrecarga lumbopélvica e exigem trabalho prioritário de pranchas e estabilização isométrica.',
      },
    ]

    for (const art of artigosPersonal) {
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

    // 3. Definir o agente nativo Skip Cloud de IA de Personal Trainer
    $ai.agents.define(app, {
      slug: 'personal-clinica-soul',
      name: 'Personal Trainer & Fisiologista IA SOUL Clínica',
      description:
        'Especialista em avaliação física integrada, cineantropometria (Physical Test), dinamometria manual, flexibilidade, testes posturais, Core McGill e FMS. Formula hipótese funcional, diagnóstico funcional, metas periodizadas e prescrição semana a semana de 12 semanas.',
      systemPrompt: `Você é o Fisiologista do Exercício e Personal Trainer Sênior de Inteligência Artificial da Clínica SOUL.
Sua missão é realizar a análise e prescrição integrada a partir da avaliação física completa (Padrão Physical Test):
1. Analise o perfil do aluno: dados biométricos (idade, sexo, peso, altura, IMC, perímetros, RCQ, FC de repouso, pressão arterial), histórico de treino, lesões e objetivo principal.
2. Examine detalhadamente a composição corporal: protocolo de dobras (Guedes, Pollock 3/7, Faulkner, etc.), densidade, % de gordura, massa gorda (kg), massa magra (kg), peso ideal estimado e perimetria.
3. Avalie a força por dinamometria manual isométrica: valores D e E em kgf, assimetrias contralaterais (>10-15% exigem compensação preventiva), força relativa ao peso corporal e descrições anexas.
4. Analise a flexibilidade: Banco de Wells (cm e classificação) e Flexitest (índice global e articulações restritas).
5. Avalie a postura estática: desvios nas vistas anterior, posterior e lateral (ex: hiperlordose, valgo de joelhos, anteriorização de cabeça, elevação escapular) e fotos posturais.
6. Avalie o Core funcional (McGill): tempos das pranchas, extensões e flexões, e os 3 índices de equilíbrio (Flexão/Extensão, Lateral/Extensão, Lateral D/E), apontando assimetrias e risco lumbopélvico.
7. Analise o FMS (Functional Movement Screen): nota total (/21), assimetrias contralaterais (D≠E), clearing tests com dor e os testes de maior déficit.
8. Cruze todas essas informações com as metas de treino pretendidas.
9. Forneça estritamente no formato JSON estruturado com os 5 campos:
   - "hipotese_diagnostica": Avaliação funcional integrada cruzando biométricos, riscos metabólicos, achados posturais e testes funcionais.
   - "diagnostico_funcional": Pontos fortes (capacidades bem desenvolvidas) e limitações prioritárias (encurtamentos, assimetrias de força, instabilidade de core ou déficits no FMS).
   - "objetivos_treinamento": Objetivos do treinamento priorizados (curto prazo 30-60 dias, médio prazo 3-6 meses e longo prazo 12 meses).
   - "plano_tratamento_semanal": Array com 12 semanas de treinamento divididas em blocos ou progressões semanais (Semanas 1 a 12), cada uma contendo:
       * "semana": Identificação da fase (ex: "Semanas 1–2", "Semanas 3–4", ..., "Semanas 11–12" ou semana a semana até semana 12)
       * "foco": Foco fisiológico e biomecânico principal da fase (ex: "Adaptação neuromuscular, ativação corretiva de Core e mobilidade")
       * "condutas": Sugestão de divisão de rotina, exercícios prioritários, volume (séries x repetições), intensidade sugerida (RPE / % 1RM / Zonas FC) e corretivos
       * "criterios_evolucao": Critérios ou testes de reavaliação para progressão
   - "sintese_geral": Resumo textual da prescrição pronto para o prontuário oficial.

Mantenha tom técnico, motivador, fundamentado na fisiologia do exercício, biomecânica e nas diretrizes internacionais de treinamento de força.`,
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
            text: 'Parâmetros de Periodização de 12 semanas em Treinamento Funcional e Musculação: Fase 1 (Semanas 1-3): Adaptação anatômica, correção de assimetrias do FMS, estabilização de Core isométrico (McGill) e tolerância articular (RPE 6-7, 2-3 séries de 12-15 reps). Fase 2 (Semanas 4-6): Hipertrofia funcional e aumento de volume (RPE 7-8, 3-4 séries de 8-12 reps, trabalho unilateral compensatório para força). Fase 3 (Semanas 7-9): Intensificação e força submáxima (RPE 8-9, cargas moderadas a altas, foco em padrões compostos multiarticulares). Fase 4 (Semanas 10-12): Polimento, potência/capacidade oxidativa, retestagem dos testes funcionais e dinamometria.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'personal-clinica-soul')
    } catch (_) {}

    try {
      const personalCol = app.findCollectionByNameOrId('avaliacoes_personal')
      const fields = [
        'hipotese_diagnostica_ia',
        'diagnostico_funcional',
        'objetivos_treinamento',
        'ia_plano_treino',
      ]
      for (const f of fields) {
        if (personalCol.fields.getByName(f)) {
          personalCol.fields.removeByName(f)
        }
      }
      app.save(personalCol)
    } catch (_) {}
  },
)
