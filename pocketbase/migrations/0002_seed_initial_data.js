migrate(
  (app) => {
    // 1. Seed admin user guivemax@hotmail.com / Skip@Pass
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let adminRecord
    try {
      adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'guivemax@hotmail.com')
    } catch (_) {
      adminRecord = new Record(usersCol)
      adminRecord.setEmail('guivemax@hotmail.com')
      adminRecord.setPassword('Skip@Pass')
      adminRecord.setVerified(true)
      adminRecord.set('name', 'Dr. Guilherme (Admin)')
      app.save(adminRecord)
    }

    // 2. Seed paciente "Ana Souza"
    const pacientesCol = app.findCollectionByNameOrId('pacientes')
    let anaRecord
    try {
      anaRecord = app.findFirstRecordByData('pacientes', 'cpf', '123.456.789-00')
    } catch (_) {
      anaRecord = new Record(pacientesCol)
      anaRecord.set('nome', 'Ana Souza')
      anaRecord.set('cpf', '123.456.789-00')
      anaRecord.set('data_nascimento', '1992-05-14 00:00:00.000Z')
      anaRecord.set('telefone', '(11) 98765-4321')
      anaRecord.set('email', 'ana.souza@email.com')
      anaRecord.set('endereco', 'Av. Paulista, 1500 - Bela Vista, São Paulo - SP')
      anaRecord.set(
        'observacoes',
        'Paciente relata desconforto lombar crônico após longas horas sentada no trabalho.',
      )
      anaRecord.set('status', 'Ativo')
      app.save(anaRecord)
    }

    // 3. Seed consultas (uma de fisioterapia aberta hoje)
    const consultasCol = app.findCollectionByNameOrId('consultas')
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayDateStr = `${year}-${month}-${day} 14:00:00.000Z`

    try {
      app.findFirstRecordByData('consultas', 'paciente_id', anaRecord.id)
    } catch (_) {
      const consulta = new Record(consultasCol)
      consulta.set('paciente_id', anaRecord.id)
      consulta.set('especialidade', 'Fisioterapia')
      consulta.set('data_hora', todayDateStr)
      consulta.set('duracao_min', 45)
      consulta.set('status', 'Agendada')
      consulta.set(
        'notas',
        'Primeira consulta de avaliação funcional para reabilitação postural e dor lombar.',
      )
      app.save(consulta)
    }

    // 4. Seed timeline
    const timelineCol = app.findCollectionByNameOrId('timeline')
    try {
      app.findFirstRecordByData('timeline', 'paciente_id', anaRecord.id)
    } catch (_) {
      const timelineItem = new Record(timelineCol)
      timelineItem.set('paciente_id', anaRecord.id)
      timelineItem.set('tipo', 'Avaliação')
      timelineItem.set('especialidade', 'Fisioterapia')
      timelineItem.set('titulo', 'Avaliação de Fisioterapia')
      timelineItem.set(
        'conteudo',
        'Anamnese inicial: Paciente com lombalgia postural há 4 meses, piora no período vespertino. Amplitude de movimento reduzida em flexão lombar. Força de core grau 3/5. Iniciado protocolo de descompressão e estabilização lombar.',
      )
      timelineItem.set('data_evento', todayDateStr)
      app.save(timelineItem)
    }

    // 5. Seed inicial de avaliação fisioterapia completa para Ana Souza
    const fisioCol = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
    try {
      app.findFirstRecordByData('avaliacoes_fisioterapia', 'paciente_id', anaRecord.id)
    } catch (_) {
      const fisioAvaliacao = new Record(fisioCol)
      fisioAvaliacao.set('paciente_id', anaRecord.id)
      fisioAvaliacao.set('especialidade', 'Fisioterapia')
      fisioAvaliacao.set('status', 'Concluída')
      fisioAvaliacao.set(
        'queixa_principal',
        'Dor lombar de moderada intensidade com irradiação leve para glúteo D',
      )
      fisioAvaliacao.set(
        'historia_doenca_atual',
        'Início há 4 meses após mudança de posto de trabalho para home office com ergonomia inadequada.',
      )
      fisioAvaliacao.set(
        'historico_medico',
        'Sem comorbidades maiores. Nega cirurgias ou fraturas prévias.',
      )
      fisioAvaliacao.set('medicamentos', 'Paracetamol 750mg se dor forte')
      fisioAvaliacao.set('cirurgias', 'Nenhuma')
      fisioAvaliacao.set(
        'postura',
        'Hiperlordose lombar compensatória, rotação pélvica anterior leve',
      )
      fisioAvaliacao.set('adm_ombro', 170)
      fisioAvaliacao.set('adm_joelho', 140)
      fisioAvaliacao.set('adm_quadril', 110)
      fisioAvaliacao.set('adm_coluna', 65)
      fisioAvaliacao.set('forca_mmss', 5)
      fisioAvaliacao.set('forca_mmii', 4)
      fisioAvaliacao.set('forca_core', 3)
      fisioAvaliacao.set(
        'palpacao',
        'Tensão importante em paravertebrais lombares L3-L5 e quadrado lombar D',
      )
      fisioAvaliacao.set(
        'testes_especiais',
        'Lasègue negativo bilateral. Teste de Schober positivo com restrição.',
      )
      fisioAvaliacao.set(
        'diagnostico_fisioterapeutico',
        'Lombalgia mecânico-postural com déficit de estabilização lombopélvica',
      )
      fisioAvaliacao.set(
        'objetivos_tratamento',
        'Alívio da dor em 3 semanas, ganho de ADM de flexão de tronco e fortalecimento do core',
      )
      fisioAvaliacao.set(
        'plano_tratamento',
        'Terapia manual miofascial + cinesioterapia com foco em transverso do abdômen e glúteo médio 2x/semana',
      )
      fisioAvaliacao.set(
        'evolucao_nota',
        'Paciente responsiva, orientada quanto à postura de trabalho.',
      )
      fisioAvaliacao.set('profissional_responsavel', 'Dr. Guilherme (Admin)')
      fisioAvaliacao.set('data_avaliacao', todayDateStr)
      app.save(fisioAvaliacao)
    }
  },
  (app) => {
    // down cleanup
  },
)
