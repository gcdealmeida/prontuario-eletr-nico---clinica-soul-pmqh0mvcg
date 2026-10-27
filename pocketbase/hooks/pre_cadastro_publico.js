/**
 * Endpoint público/aberto para submissão de Pré-Cadastro com verificação inteligente de duplicidade.
 * Rota: POST /backend/v1/public/pre-cadastro
 *
 * Regras:
 * 1. Verifica duplicidade antes de criar:
 *    - Por CPF (se informado);
 *    - Senão por Nome tolerante (sem acentos/espaços/caixa) + Data de Nascimento;
 *    - Senão por Nome tolerante + Telefone/WhatsApp (apenas dígitos).
 * 2. Se já existir paciente correspondente:
 *    - NÃO cria novo registro.
 *    - Complementa campos vazios do cadastro existente (telefone, email, endereco, nascimento, etc.).
 *    - Salva/atualiza a ficha de pré-cadastro (motivo_procura, limitacoes_incomodo, tratamentos_anteriores, etc.)
 *      sem sobrescrever informações clínicas oficiais consolidadas.
 *    - Retorna { success: true, is_existing: true, paciente_id: ..., message: "Pré-avaliação vinculada ao cadastro existente com sucesso." }
 * 3. Se for novo:
 *    - Cria paciente com status "Pré-cadastro".
 *    - Retorna { success: true, is_existing: false, paciente_id: ..., message: "Pré-avaliação enviada com sucesso!" }
 */

routerAdd('POST', '/backend/v1/public/pre-cadastro', (e) => {
  try {
    const reqInfo = e.requestInfo()
    const data = reqInfo.body || {}

    const nome = String(data.nome || '').trim()
    if (!nome || nome.length < 2) {
      return e.json(400, { error: 'O nome do paciente é obrigatório.' })
    }

    const rawCpf = String(data.cpf || '')
      .replace(/\D/g, '')
      .trim()
    const rawTelefone = String(data.telefone || '')
      .replace(/\D/g, '')
      .trim()
    const rawEmail = String(data.email || '')
      .trim()
      .toLowerCase()
    const dataNascimento = String(data.data_nascimento || '').trim()

    // Normalizador de nome tolerante a acentos, maiúsculas/minúsculas e pontuação
    function normalizeNome(s) {
      if (!s) return ''
      return String(s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim()
    }

    const normNome = normalizeNome(nome)

    // Buscar pacientes candidatos no banco
    let existingRecord = null

    // 1. Tentar por CPF se informado e válido (11 dígitos)
    if (rawCpf && rawCpf.length === 11) {
      try {
        const rowsCpf = []
        $app
          .db()
          .newQuery(
            "SELECT id FROM pacientes WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = {:cpf} LIMIT 1",
          )
          .bind({ cpf: rawCpf })
          .all(rowsCpf)
        if (rowsCpf.length > 0 && rowsCpf[0].id) {
          existingRecord = $app.findRecordById('pacientes', rowsCpf[0].id)
        }
      } catch (errCpf) {
        console.log('Erro ao buscar por CPF:', errCpf)
      }
    }

    // 2. Se não encontrou por CPF, buscar por Nome tolerante + Data de Nascimento ou Telefone
    if (!existingRecord && normNome) {
      try {
        const rowsCandidates = []
        $app
          .db()
          .newQuery(
            'SELECT id, nome, data_nascimento, telefone, cpf FROM pacientes ORDER BY created DESC LIMIT 500',
          )
          .all(rowsCandidates)

        for (let i = 0; i < rowsCandidates.length; i++) {
          const cand = rowsCandidates[i]
          const candNormNome = normalizeNome(cand.nome)

          if (candNormNome === normNome) {
            // Verificar data de nascimento se ambos tiverem
            if (dataNascimento && cand.data_nascimento) {
              const d1 = dataNascimento.substring(0, 10)
              const d2 = String(cand.data_nascimento).substring(0, 10)
              if (d1 === d2) {
                existingRecord = $app.findRecordById('pacientes', cand.id)
                break
              }
            }

            // Verificar telefone se ambos tiverem
            if (rawTelefone && cand.telefone) {
              const candTel = String(cand.telefone).replace(/\D/g, '').trim()
              if (
                candTel === rawTelefone ||
                (candTel.length >= 8 &&
                  rawTelefone.length >= 8 &&
                  (candTel.endsWith(rawTelefone.slice(-8)) ||
                    rawTelefone.endsWith(candTel.slice(-8))))
              ) {
                existingRecord = $app.findRecordById('pacientes', cand.id)
                break
              }
            }

            // Se o nome for longo e idêntico (mais de 2 sobrenomes, >= 15 chars), e não houver divergência direta
            if (!existingRecord && normNome.length >= 15 && candNormNome === normNome) {
              existingRecord = $app.findRecordById('pacientes', cand.id)
              break
            }
          }
        }
      } catch (errCand) {
        console.log('Erro ao buscar pacientes candidatos:', errCand)
      }
    }

    const fichaPreCadastroObj = {
      origem_como_chegou: data.origem_como_chegou || '',
      quem_indicou: data.quem_indicou || '',
      motivo_procura: data.motivo_procura || '',
      limitacoes_incomodo: data.limitacoes_incomodo || '',
      tratamentos_anteriores: data.tratamentos_anteriores || '',
      resultado_esperado: data.resultado_esperado || '',
      diagnostico_medico: data.diagnostico_medico || '',
      queixa_dor_onde: data.queixa_dor_onde || '',
      atividade_fisica: data.atividade_fisica || '',
      frequencia_semanal: data.frequencia_semanal || '',
      duracao_treino: data.duracao_treino || '',
      controle_alimentar: data.controle_alimentar || '',
      observacoes_formulario: data.observacoes_formulario || '',
      endereco_rua: data.endereco_rua || '',
      endereco_numero: data.endereco_numero || '',
      endereco_complemento: data.endereco_complemento || '',
      endereco_bairro: data.endereco_bairro || '',
      endereco_cidade: data.endereco_cidade || '',
      endereco_estado: data.endereco_estado || '',
      endereco_cep: data.endereco_cep || '',
      submitted_at: new Date().toISOString(),
    }

    if (existingRecord) {
      console.log(
        'Pré-cadastro: Paciente existente detectado ID=' +
          existingRecord.id +
          ' (' +
          existingRecord.getString('nome') +
          ')',
      )

      // Complementar campos em branco sem sobrescrever dados preexistentes
      if (!existingRecord.getString('cpf') && rawCpf) {
        existingRecord.set('cpf', data.cpf || rawCpf)
      }
      if (!existingRecord.getString('telefone') && data.telefone) {
        existingRecord.set('telefone', data.telefone)
      }
      if (!existingRecord.getString('email') && rawEmail) {
        existingRecord.set('email', rawEmail)
      }
      if (!existingRecord.getString('data_nascimento') && dataNascimento) {
        existingRecord.set('data_nascimento', dataNascimento)
      }
      if (!existingRecord.getString('genero') && data.genero) {
        existingRecord.set('genero', data.genero)
      }
      if (!existingRecord.getString('endereco_rua') && data.endereco_rua) {
        existingRecord.set('endereco_rua', data.endereco_rua)
      }
      if (!existingRecord.getString('endereco_numero') && data.endereco_numero) {
        existingRecord.set('endereco_numero', data.endereco_numero)
      }
      if (!existingRecord.getString('endereco_complemento') && data.endereco_complemento) {
        existingRecord.set('endereco_complemento', data.endereco_complemento)
      }
      if (!existingRecord.getString('endereco_bairro') && data.endereco_bairro) {
        existingRecord.set('endereco_bairro', data.endereco_bairro)
      }
      if (!existingRecord.getString('endereco_cidade') && data.endereco_cidade) {
        existingRecord.set('endereco_cidade', data.endereco_cidade)
      }
      if (!existingRecord.getString('endereco_estado') && data.endereco_estado) {
        existingRecord.set('endereco_estado', data.endereco_estado)
      }
      if (!existingRecord.getString('endereco_cep') && data.endereco_cep) {
        existingRecord.set('endereco_cep', data.endereco_cep)
      }
      if (!existingRecord.getString('endereco') && data.endereco) {
        existingRecord.set('endereco', data.endereco)
      }

      // Se o nome atual for mais curto/incompleto que o enviado, usar o mais completo
      const existingNome = existingRecord.getString('nome') || ''
      if (
        nome.length > existingNome.length &&
        normalizeNome(nome).includes(normalizeNome(existingNome))
      ) {
        existingRecord.set('nome', nome)
      }

      // Complementar campos da anamnese prévia se estiverem vazios
      const camposAnamnese = [
        'origem_como_chegou',
        'quem_indicou',
        'motivo_procura',
        'limitacoes_incomodo',
        'tratamentos_anteriores',
        'resultado_esperado',
        'diagnostico_medico',
        'queixa_dor_onde',
        'atividade_fisica',
        'frequencia_semanal',
        'duracao_treino',
        'controle_alimentar',
        'observacoes_formulario',
      ]

      for (let c = 0; c < camposAnamnese.length; c++) {
        const campo = camposAnamnese[c]
        const valExistente = existingRecord.getString(campo) || ''
        const valNovo = String(data[campo] || '').trim()
        if (!valExistente && valNovo) {
          existingRecord.set(campo, valNovo)
        }
      }

      // Armazenar sempre a ficha de pré-cadastro completa no JSON
      existingRecord.set('ficha_pre_cadastro', fichaPreCadastroObj)

      $app.save(existingRecord)

      // Gravar evento de timeline informando a atualização de pré-cadastro
      try {
        const timeCol = $app.findCollectionByNameOrId('timeline')
        const timeRec = new Record(timeCol)
        timeRec.set('paciente_id', existingRecord.id)
        timeRec.set('tipo', 'Outro')
        timeRec.set('especialidade', 'Geral')
        timeRec.set('titulo', 'Pré-avaliação atualizada via link público')
        timeRec.set(
          'conteudo',
          'O paciente preencheu novamente a ficha de pré-avaliação online. Os dados foram unificados ao cadastro existente com sucesso.\nMotivo: ' +
            (data.motivo_procura || 'Não informado') +
            '\nResultado esperado: ' +
            (data.resultado_esperado || 'Não informado'),
        )
        timeRec.set('data_evento', new Date().toISOString())
        $app.save(timeRec)
      } catch (timeErr) {
        console.log('Erro ao salvar timeline no pre-cadastro:', timeErr)
      }

      // Notificar administradores
      const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
      for (let i = 0; i < admins.length; i++) {
        try {
          const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
          if (adm) {
            const notifCol = $app.findCollectionByNameOrId('notifications')
            const notif = new Record(notifCol)
            notif.set('user_id', adm.id)
            notif.set('titulo', 'Pré-avaliação Vinculada')
            notif.set(
              'descricao',
              'O paciente "' +
                existingRecord.getString('nome') +
                '" enviou uma nova pré-avaliação pelo link. As informações foram vinculadas ao cadastro existente sem criar duplicidade.',
            )
            notif.set('tipo', 'clinical_update')
            notif.set('lida', false)
            notif.set('link', '/pacientes/' + existingRecord.id)
            $app.save(notif)
          }
        } catch (_) {}
      }

      return e.json(200, {
        success: true,
        is_existing: true,
        paciente_id: existingRecord.id,
        paciente_nome: existingRecord.getString('nome'),
        message: 'Pré-avaliação vinculada ao cadastro existente com sucesso.',
      })
    }

    // Caso 3: Paciente não existe, criar normalmente com status 'Pré-cadastro'
    const pacientesCol = $app.findCollectionByNameOrId('pacientes')
    const newRecord = new Record(pacientesCol)

    newRecord.set('nome', nome)
    if (data.cpf) newRecord.set('cpf', data.cpf)
    if (data.data_nascimento) newRecord.set('data_nascimento', data.data_nascimento)
    if (data.telefone) newRecord.set('telefone', data.telefone)
    if (data.email) newRecord.set('email', data.email)
    if (data.genero) newRecord.set('genero', data.genero)
    if (data.endereco_rua) newRecord.set('endereco_rua', data.endereco_rua)
    if (data.endereco_numero) newRecord.set('endereco_numero', data.endereco_numero)
    if (data.endereco_complemento) newRecord.set('endereco_complemento', data.endereco_complemento)
    if (data.endereco_bairro) newRecord.set('endereco_bairro', data.endereco_bairro)
    if (data.endereco_cidade) newRecord.set('endereco_cidade', data.endereco_cidade)
    if (data.endereco_estado) newRecord.set('endereco_estado', data.endereco_estado)
    if (data.endereco_cep) newRecord.set('endereco_cep', data.endereco_cep)
    if (data.endereco) newRecord.set('endereco', data.endereco)
    newRecord.set('status', 'Pré-cadastro')

    newRecord.set('origem_como_chegou', data.origem_como_chegou || '')
    newRecord.set('quem_indicou', data.quem_indicou || '')
    newRecord.set('motivo_procura', data.motivo_procura || '')
    newRecord.set('limitacoes_incomodo', data.limitacoes_incomodo || '')
    newRecord.set('tratamentos_anteriores', data.tratamentos_anteriores || '')
    newRecord.set('resultado_esperado', data.resultado_esperado || '')
    newRecord.set('diagnostico_medico', data.diagnostico_medico || '')
    newRecord.set('queixa_dor_onde', data.queixa_dor_onde || '')
    newRecord.set('atividade_fisica', data.atividade_fisica || '')
    newRecord.set('frequencia_semanal', data.frequencia_semanal || '')
    newRecord.set('duracao_treino', data.duracao_treino || '')
    newRecord.set('controle_alimentar', data.controle_alimentar || '')
    newRecord.set('observacoes_formulario', data.observacoes_formulario || '')
    newRecord.set('ficha_pre_cadastro', fichaPreCadastroObj)

    $app.save(newRecord)

    // Criar primeiro evento na timeline
    try {
      const timeCol = $app.findCollectionByNameOrId('timeline')
      const timeRec = new Record(timeCol)
      timeRec.set('paciente_id', newRecord.id)
      timeRec.set('tipo', 'Outro')
      timeRec.set('especialidade', 'Geral')
      timeRec.set('titulo', 'Pré-avaliação enviada pelo paciente')
      timeRec.set(
        'conteudo',
        'Ficha de pré-avaliação preenchida pelo link público.\nMotivo da procura: ' +
          (data.motivo_procura || 'Não informado') +
          '\nResultado esperado: ' +
          (data.resultado_esperado || 'Não informado'),
      )
      timeRec.set('data_evento', new Date().toISOString())
      $app.save(timeRec)
    } catch (_) {}

    // Notificar administradores
    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notifCol = $app.findCollectionByNameOrId('notifications')
          const notif = new Record(notifCol)
          notif.set('user_id', adm.id)
          notif.set('titulo', 'Novo Pré-Cadastro')
          notif.set(
            'descricao',
            'O paciente "' +
              nome +
              '" enviou a ficha de pré-avaliação pelo link. Acesse para ativar o cadastro e abrir o prontuário.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/pacientes/' + newRecord.id)
          $app.save(notif)
        }
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      is_existing: false,
      paciente_id: newRecord.id,
      paciente_nome: nome,
      message: 'Pré-avaliação enviada com sucesso!',
    })
  } catch (err) {
    console.log('Erro no endpoint pre-cadastro:', err)
    return e.json(500, {
      error: err?.message || 'Erro ao processar a pré-avaliação.',
    })
  }
})
