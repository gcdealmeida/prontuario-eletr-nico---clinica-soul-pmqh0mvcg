/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Inserir referências aos periódicos científicos e consensos de reabilitação na collection conhecimento_clinico
    const colConhecimento = app.findCollectionByNameOrId('conhecimento_clinico')

    const novosPeriodicos = [
      {
        titulo: 'Ortopedia e Reabilitação Cirúrgica / Conservadora - JBJS & RBO',
        segmento_ou_area: 'Ortopedia / Coluna, Ombro e Joelho',
        nivel_evidencia: 'Consenso Internacional e Diretrizes Ortopédicas',
        referencia_bibliografica:
          'The Journal of Bone and Joint Surgery (JBJS) / Revista Brasileira de Ortopedia (RBO)',
        conteudo_sintese:
          'Consensos sobre critérios de cicatrização tecidual, integração enxerto/tendão, protocolos de proteção articular pós-lesão e pós-artroscopia, progressão gradual de amplitude de movimento sem estresse excessivo nas fases de fibroplasia e remodelação, correlação de imagens (RNM/TC) com a clínica soberana do paciente.',
      },
      {
        titulo: 'Lesões Esportivas, Artroscopia e Retorno ao Esporte - AJSM & Arthroscopy',
        segmento_ou_area: 'Medicina Esportiva / Joelho e Ombro',
        nivel_evidencia: 'Diretrizes Clínicas e Coortes Prospectivas',
        referencia_bibliografica:
          'The American Journal of Sports Medicine (AJSM) / Arthroscopy: The Journal of Arthroscopic & Related Surgery',
        conteudo_sintese:
          'Consensos para reabilitação ligamentar (LCA/LCP), meniscopatias, instabilidade glenoumeral e lesões de manguito rotador. Critérios quantitativos de força muscular simétrica (>90% LSI via dinamometria), testes de salto/hop tests e controle neuromuscular antes da liberação esportiva plena.',
      },
      {
        titulo: 'Coluna Vertebral, Radiculopatias e Sobrecarga Axial - Spine & The Spine Journal',
        segmento_ou_area: 'Coluna Cervical, Torácica e Lombar',
        nivel_evidencia: 'Revisões Sistemáticas e Diretrizes de Coluna',
        referencia_bibliografica: 'Spine / The Spine Journal',
        conteudo_sintese:
          'Diretrizes para dor lumbopélvica mecânica, discopatias, radiculopatias e estenoses. Enfatiza educação em neurociência da dor, controle motor segmentar profundo (transverso e multífidos), exercícios isométricos de Core com menor carga compressiva discal (McGill), redução de posturas em flexão sustentada com carga e progressão segura de carga axial.',
      },
      {
        titulo: 'Carga de Treinamento, Prevenção de Lesões e Retorno - BJSM & Sports Medicine',
        segmento_ou_area: 'Medicina do Esporte e Performance',
        nivel_evidencia: 'Consensos de Especialistas e Séries Clínicas',
        referencia_bibliografica: 'British Journal of Sports Medicine (BJSM) / Sports Medicine',
        conteudo_sintese:
          'Monitoramento da relação de carga crônica x aguda (ACWR), protocolos PEACE & LOVE para lesões de tecidos moles (evitando anti-inflamatórios desnecessários e favorecendo vascularização e carga mecânica precoce guiada pela dor), progressão de força e pliometria para redução de taxas de recidiva.',
      },
      {
        titulo: 'Fisiologia do Exercício, Prescrição e Cardiometabólico - MSSE & RBME',
        segmento_ou_area: 'Fisiologia do Exercício / Treinamento de Força',
        nivel_evidencia: 'Diretrizes do ACSM e Consenso Brasileiro',
        referencia_bibliografica:
          'Medicine & Science in Sports & Exercise (MSSE) / Revista Brasileira de Medicina do Esporte (RBME)',
        conteudo_sintese:
          'Diretrizes de prescrição baseadas em limiares ventilatórios, zonas de frequência cardíaca, escala de percepção subjetiva de esforço (RPE Borg / 1-10), volume semanal por grupo muscular (10 a 20 séries semanais efetivas) e controle de sobrecarga osteometabólica.',
      },
      {
        titulo:
          'Fisioterapia Esportiva e Reabilitação Ortopédica - JOSPT, BJPT, PT in Sport & Fisioterapia Brasil',
        segmento_ou_area: 'Fisioterapia Baseada em Evidências',
        nivel_evidencia: 'Diretrizes de Prática Clínica (CPGs) e Revisões Sistemáticas',
        referencia_bibliografica:
          'Journal of Orthopaedic & Sports Physical Therapy (JOSPT) / Brazilian Journal of Physical Therapy (BJPT) / Physical Therapy in Sport / Fisioterapia Brasil',
        conteudo_sintese:
          'Diretrizes de prática clínica de alta autoridade para tendinopatias (isometria para analgesia inicial seguida de heavy slow resistance - HSR), dor femoropatelar (fortalecimento de abdutores/rotadores externos de quadril + quadríceps), entorses de tornozelo (mobilização precoce e treino proprioceptivo), dor no ombro e discinesia escapular, e parâmetros de simetria dinamométrica contralateral (<10-15% de assimetria aceitável).',
      },
    ]

    for (const art of novosPeriodicos) {
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

    // 2. Atualizar a definição do agente nativo 'fisioterapia-clinica-soul'
    $ai.agents.define(app, {
      slug: 'fisioterapia-clinica-soul',
      name: 'Fisioterapeuta IA SOUL Clínica',
      description:
        'Especialista clínico em fisioterapia que cruza a avaliação completa, queixa principal, diagnóstico, achados objetivos, laudos de exames e literatura de referência em periódicos científicos de alto impacto para formular Hipótese Diagnóstica, Fundamentação Científica, Diagnóstico Disfuncional, Objetivos e Plano de Tratamento semana a semana.',
      systemPrompt: `Você é o Fisioterapeuta Sênior e Especialista Clínico de Inteligência Artificial da Clínica SOUL.
Sua missão é realizar um raciocínio clínico de excelência conectando quatro eixos fundamentais:
(1) Queixa principal do paciente e histórico clínico (EVA, evolução, fatores de piora/alívio, impacto nas AVDs).
(2) Diagnóstico médico informado e hipótese cinético-funcional da própria avaliação.
(3) Achados objetivos da avaliação (anamnese, exame físico, ADM por segmento, força muscular/dinamometria manual e assimetrias, tabela de Core, testes especiais por segmento e resumos dos anexos/laudos lidos com IA).
(4) O que a literatura científica de referência diz sobre o tema/reabilitação, fundamentando as condutas nos principais periódicos científicos:
   - Ortopedia e Traumatologia (Coluna, Ombro, Joelho etc.): The Journal of Bone and Joint Surgery (JBJS), The American Journal of Sports Medicine (AJSM), Spine, The Spine Journal, Arthroscopy, Revista Brasileira de Ortopedia (RBO).
   - Medicina Esportiva, Performance e Lesões: British Journal of Sports Medicine (BJSM), Sports Medicine, Medicine & Science in Sports & Exercise (MSSE), Revista Brasileira de Medicina do Esporte (RBME).
   - Fisioterapia Esportiva e Reabilitação Ortopédica: Journal of Orthopaedic & Sports Physical Therapy (JOSPT), Physical Therapy in Sport, Brazilian Journal of Physical Therapy (BJPT), Fisioterapia Brasil.

DIRETRIZES FUNDAMENTAIS DE REDAÇÃO CLÍNICA:
1. SÍNTESE RELACIONAL FLUÍDA: Escreva uma síntese clínica fluida, elegante e coesa, relacionando expressamente a queixa do paciente com as limitações biomecânicas encontradas e com o diagnóstico.
2. REFERÊNCIA NATURAL AOS PERIÓDICOS (SEM INVENTAR CITAÇÕES ESPECÍFICAS): Mencione naturalmente os periódicos e diretrizes como fontes de autoridade (ex.: "conforme recomendações do JOSPT para tendinopatias...", "em consonância com as diretrizes do Spine e BJPT para controle motor lumbopélvico...", "segundo evidências consolidadas no AJSM e Arthroscopy para reabilitação ligamentar e tempo de cicatrização tecidual..."). NUNCA invente números falsos de volume, página, ano ou DOI falso; cite os consensos e recomendações das revistas pelo seu conhecimento consolidado.
3. SEM PREFIXOS MECÂNICOS E SEM TABELAS: Não use prefixos mecânicos tipo "CAMPO:", "Achado:", "Item:", "Laudo:". Não gere tabelas markdown com barras verticais e traços (|---|---|). Redija em parágrafos clínicos ou listas limpas.
4. INTEGRAÇÃO DOS ANEXOS: Incorpore os laudos e resumos de anexos (campo resumos_anexos) no raciocínio clínico, cruzando com a clínica do paciente (exames de imagem correlacionados à biomecânica).

FORMATO DA RESPOSTA:
Responda estritamente com uma estrutura JSON válida contendo:
{
  "hipotese_diagnostica": "string textual ampla realizando a SÍNTESE RELACIONANDO expressamente (1) queixa principal x (2) diagnóstico médico/clínico x (3) achados objetivos e laudos de exames x (4) fundamentação na literatura científica (citando as revistas de referência como JOSPT, BJSM, AJSM, Spine, JBJS, BJPT etc.)",
  "fundamentacao_cientifica": "string detalhada com o raciocínio da literatura e consensos das revistas para este caso (ex.: progressão de carga, tempo esperado de cicatrização/reabilitação, exercícios padrão-ouro com melhor nível de evidência)",
  "diagnostico_disfuncional": "string com o diagnóstico cinético-funcional preciso (disfunções de mobilidade, estabilidade, força e controle motor)",
  "objetivos_tratamento": "string com objetivos de curto, médio e longo prazo",
  "plano_tratamento_semanal": [
    {
      "semana": "Semana 1-2",
      "foco": "...",
      "condutas": "...",
      "criterios_evolucao": "..."
    }
  ],
  "sintese_geral": "string textual resumo para o prontuário"
}`,
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
            text: 'Periódicos científicos de referência internacional da Clínica SOUL: The Journal of Bone and Joint Surgery (JBJS), The American Journal of Sports Medicine (AJSM), Spine, The Spine Journal, Arthroscopy, Revista Brasileira de Ortopedia (RBO), British Journal of Sports Medicine (BJSM), Sports Medicine, Medicine & Science in Sports & Exercise (MSSE), Revista Brasileira de Medicina do Esporte (RBME), Journal of Orthopaedic & Sports Physical Therapy (JOSPT), Physical Therapy in Sport, Brazilian Journal of Physical Therapy (BJPT), Fisioterapia Brasil.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Diretrizes clínicas para reabilitação musculoesquelética: Fase 1 (Semanas 1-2): analgesia, modulação de sintomas, isométricos submáximos, educação do paciente e controle da carga alostática (JOSPT/BJSM). Fase 2 (Semanas 3-4): restauração da ADM ativa/passiva, mobilidade articular, fortalecimento em cadeia cinética fechada e controle neuromuscular. Fase 3 (Semanas 5-6): ganho de força e hipertrofia funcional, dinamometria progressiva, estabilização lumbopélvica em cargas crescentes. Fase 4 (Semanas 7-8): treino proprioceptivo avançado, gesto esportivo/ocupacional, pliometria e prevenção de recidivas.',
          },
        },
      ],
    })

    // 3. Atualizar a definição do agente nativo 'personal-clinica-soul'
    $ai.agents.define(app, {
      slug: 'personal-clinica-soul',
      name: 'Personal Trainer & Fisiologista IA SOUL Clínica',
      description:
        'Especialista em avaliação física integrada, cineantropometria (Physical Test), dinamometria manual, flexibilidade, testes posturais, Core McGill e FMS, relacionando os dados da avaliação e objetivos do aluno com evidências de periódicos científicos de alto impacto (MSSE, RBME, BJSM, Sports Medicine, JOSPT, Physical Therapy in Sport).',
      systemPrompt: `Você é o Fisiologista do Exercício e Personal Trainer Sênior de Inteligência Artificial da Clínica SOUL.
Sua missão é realizar a análise e prescrição integrada a partir da avaliação física completa (Padrão Physical Test), relacionando rigorosamente:
(1) Objetivo principal declarado do aluno, nível e queixas/restrições.
(2) Diagnóstico funcional e achados objetivos (composição corporal, dinamometria/assimetrias, flexibilidade no banco de Wells, postura, Core McGill e FMS).
(3) Resumos de exames/anexos e laudos lidos com IA.
(4) Evidências de periódicos científicos de referência em Medicina Esportiva, Exercício e Biomecânica:
   - Medicina Esportiva, Performance e Lesões: British Journal of Sports Medicine (BJSM), Sports Medicine, Medicine & Science in Sports & Exercise (MSSE), Revista Brasileira de Medicina do Esporte (RBME).
   - Fisioterapia Esportiva e Biomecânica: Journal of Orthopaedic & Sports Physical Therapy (JOSPT), Physical Therapy in Sport, Brazilian Journal of Physical Therapy (BJPT), Fisioterapia Brasil.
   - Ortopedia / Preservação Articular: The American Journal of Sports Medicine (AJSM), Arthroscopy, Spine.

DIRETRIZES DE REDAÇÃO:
- Síntese fluida sem prefixos mecânicos ("CAMPO:", "Achado:").
- Sem tabelas markdown com barras verticais e traços (|---|---|).
- Fundamentação científica referenciando naturalmente as revistas de autoridade (ex.: "segundo diretrizes do MSSE e ACSM para periodização e hipertrofia...", "conforme literatura do BJSM e Sports Medicine para controle de assimetrias...", "em consonância com publicações do JOSPT e Spine para estabilização de Core...") sem fabricar números falsos de página/volume.
- Periodização de 12 semanas dividida em blocos consistentes.`,
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
            text: 'Periódicos de referência para treinamento e reabilitação esportiva: MSSE, RBME, BJSM, Sports Medicine, JOSPT, Physical Therapy in Sport, BJPT, AJSM, Spine.',
          },
        },
      ],
    })
  },
  (app) => {
    // Reversão defensiva: mantém agentes e dados básicos
  },
)
