/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Criar collection relatorios_ia para persistir o histórico de relatórios gerados por prontuário
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // Leitura: admin ou quem criou (autor_id = @request.auth.id) ou se aprovado
    const relatorioReadRule = `${approvedCheck} && (${adminCheck} || autor_id = @request.auth.id || autor_id = '' || autor_id = null)`
    const relatorioCreateRule = `${approvedCheck} && (${adminCheck} || @request.body.autor_id = @request.auth.id)`
    const relatorioUpdateRule = `${approvedCheck} && (${adminCheck} || autor_id = @request.auth.id)`
    const relatorioDeleteRule = `${approvedCheck} && (${adminCheck} || autor_id = @request.auth.id)`

    let relCol
    try {
      relCol = app.findCollectionByNameOrId('relatorios_ia')
    } catch (_) {
      relCol = new Collection({
        name: 'relatorios_ia',
        type: 'base',
        listRule: relatorioReadRule,
        viewRule: relatorioReadRule,
        createRule: relatorioCreateRule,
        updateRule: relatorioUpdateRule,
        deleteRule: relatorioDeleteRule,
        fields: [
          {
            name: 'paciente_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('pacientes').id,
            cascadeDelete: false,
            maxSelect: 1,
            required: true,
          },
          { name: 'avaliacao_id', type: 'text', required: true },
          {
            name: 'especialidade',
            type: 'select',
            values: ['Fisioterapia', 'Personal', 'Nutrição', 'Médico', 'Geral'],
            maxSelect: 1,
          },
          {
            name: 'autor_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
            required: true,
          },
          { name: 'autor_nome', type: 'text' },
          { name: 'titulo', type: 'text', required: true },
          { name: 'necessidade', type: 'text', required: true },
          { name: 'conteudo', type: 'text', required: true },
          { name: 'publico_alvo', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_rel_ia_avaliacao ON relatorios_ia (avaliacao_id, created DESC)',
          'CREATE INDEX idx_rel_ia_paciente ON relatorios_ia (paciente_id, created DESC)',
          'CREATE INDEX idx_rel_ia_autor ON relatorios_ia (autor_id, created DESC)',
        ],
      })
      app.save(relCol)
    }

    // 2. Definir o agente nativo Skip Cloud de emissão de relatórios clínicos otimizados
    $ai.agents.define(app, {
      slug: 'relatorios-clinica-soul',
      name: 'Especialista em Relatórios Clínicos SOUL',
      description:
        'Agente clínico e multidisciplinar da Clínica SOUL especializado em redigir relatórios otimizados, laudos, resumos para médicos, personal trainers, pacientes ou fins periciais a partir dos dados reais do prontuário eletrônico.',
      systemPrompt: `Você é o Especialista Clínico Sênior em Emissão de Relatórios da Clínica SOUL (Saúde e Bem-Estar).
Sua missão é gerar um relatório clínico claro, impecável, com vocabulário técnico preciso ou adaptado ao público-alvo informado, utilizando fielmente os dados reais do prontuário fornecidos no contexto.

DIRETRIZES FUNDAMENTAIS:
1. Respeite estritamente a "Necessidade" e o objetivo solicitados pelo profissional no prompt (ex: relatório para médico ortopedista, relatório de transição/evolução para o personal trainer, resumo explicativo para o paciente leigo/familiar, parecer pericial/jurídico cronológico com dados objetivos, etc.).
2. Estruture o relatório com seções claras e elegantes em Markdown:
   - Título formal do relatório
   - Identificação (Paciente, Idade/Data de Nasc., Data da Avaliação, Especialidade, Profissional Responsável)
   - Motivo da Procura / Diagnóstico / Queixa Principal (com EVA se houver)
   - Achados Clínicos e Testes Objetivos Relevantes (destaque dados mensurados reais: ADM, Dinamometria, Testes Especiais, Cirtometria, Composição Corporal, FMS, Core McGill ou Evoluções, conforme pertinente ao foco solicitado)
   - Análise Clínica / Conclusão / Hipótese Diagnóstica
   - Condutas / Plano Terapêutico / Recomendações Integradas
3. Tom e Linguagem:
   - Se for para Médico/Ortopedista: use terminologia técnica rigorosa, biomecânica, testes específicos positivos/negativos, graus e assimetrias.
   - Se for para Personal Trainer: foque nas amplitudes funcionais, tolerâncias a carga, assimetrias a serem compensadas, cuidados em exercícios específicos e progressões recomendadas.
   - Se for para o Paciente/Leigo: linguagem acolhedora, clara, didática, desmistificando medos e explicando o plano com clareza.
   - Se for Pericial / Jurídico: tom objetivo, formal, cronológico, imparcial e focado em fatos clínicos registrados e datas.
4. NUNCA invente dados clínicos ausentes. Mencione apenas o que constar no prontuário ou destaque que determinado dado não foi avaliado/constatado.
5. Retorne o texto do relatório diretamente, pronto para impressão em papel timbrado ou compartilhamento formal.`,
      tier: 'fast',
      tools: [
        {
          collection: 'pacientes',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'avaliacoes_fisioterapia',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'avaliacoes_personal',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'evolucoes',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
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
            text: 'Padrão Clínica SOUL de Comunicação Interprofissional: Relatórios devem conter identificação completa do paciente, data da avaliação, achados objetivos fundamentados, diagnóstico disfuncional/funcional e recomendações práticas.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Estrutura recomendada para encaminhamento médico: Introdução com agradecimento pelo encaminhamento, síntese da queixa e exames complementares, achados do exame físico com assimetrias e goniometria, testes especiais realizados, condutas executadas até o momento e proposta terapêutica para as próximas semanas.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'relatorios-clinica-soul')
    } catch (_) {}
    try {
      const relCol = app.findCollectionByNameOrId('relatorios_ia')
      app.delete(relCol)
    } catch (_) {}
  },
)
