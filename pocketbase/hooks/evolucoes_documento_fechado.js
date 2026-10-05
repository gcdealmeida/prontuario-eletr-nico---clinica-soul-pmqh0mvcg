/**
 * Hook para a collection 'evolucoes'
 * Garante o conceito de Documento Clínico Fechado no backend:
 * 1. Ao salvar como 'Finalizada' (ou documento_fechado = true), carimba no servidor data/hora da assinatura,
 *    nome do profissional, especialidade, número de registro oficial e marca documento_fechado = true.
 * 2. Bloqueia qualquer alteração/edição em evolução que já esteja assinada/fechada.
 * 3. Bloqueia qualquer exclusão de evolução assinada/fechada.
 * 4. Rascunhos podem ser editados e excluídos normalmente.
 */

// Intercepta criação de evolução
onRecordCreate((e) => {
  const status = e.record.getString('status')
  const isFechado = e.record.getBool('documento_fechado') || status === 'Finalizada'

  // Gera número de registro se ainda não tiver
  if (!e.record.getString('numero_registro')) {
    const ano = new Date().getFullYear().toString()
    const randPart = (e.record.id || $security.randomString(6)).slice(0, 6).toUpperCase()
    e.record.set('numero_registro', 'EVO-' + ano + '-' + randPart)
  }

  if (isFechado) {
    e.record.set('status', 'Finalizada')
    e.record.set('documento_fechado', true)

    // Data/hora exata do backend (servidor confiável)
    const agoraIso = new Date().toISOString()
    e.record.set('assinado_em', agoraIso)

    // Preserva nome e especialidade do profissional responsável pela assinatura
    const prof = e.record.getString('profissional') || 'Profissional SOUL'
    e.record.set('assinado_por_nome', prof)

    const esp = e.record.getString('especialidade') || 'Fisioterapia'
    e.record.set('assinado_por_especialidade', esp)

    if (!e.record.getString('tipo_evolucao')) {
      e.record.set('tipo_evolucao', 'Rotina')
    }
  } else {
    e.record.set('status', 'Rascunho')
    e.record.set('documento_fechado', false)
  }

  e.next()
}, 'evolucoes')

// Intercepta atualização de evolução
onRecordUpdate((e) => {
  const original = e.record.original()
  const originalFechado =
    original.getBool('documento_fechado') || original.getString('status') === 'Finalizada'

  if (originalFechado) {
    throw new BadRequestError(
      'Documento clínico fechado e assinado digitalmente não pode ser alterado. Para correções, registre uma Nova Evolução Corretiva.',
    )
  }

  const novoStatus = e.record.getString('status')
  const agoraFechado = e.record.getBool('documento_fechado') || novoStatus === 'Finalizada'

  if (agoraFechado) {
    e.record.set('status', 'Finalizada')
    e.record.set('documento_fechado', true)
    e.record.set('assinado_em', new Date().toISOString())

    const prof = e.record.getString('profissional') || 'Profissional SOUL'
    e.record.set('assinado_por_nome', prof)

    const esp = e.record.getString('especialidade') || 'Fisioterapia'
    e.record.set('assinado_por_especialidade', esp)

    if (!e.record.getString('numero_registro')) {
      const ano = new Date().getFullYear().toString()
      const randPart = (e.record.id || $security.randomString(6)).slice(0, 6).toUpperCase()
      e.record.set('numero_registro', 'EVO-' + ano + '-' + randPart)
    }
  }

  e.next()
}, 'evolucoes')

// Intercepta exclusão de evolução
onRecordDelete((e) => {
  const isFechado =
    e.record.getBool('documento_fechado') || e.record.getString('status') === 'Finalizada'
  if (isFechado) {
    throw new BadRequestError(
      'Documento clínico fechado e assinado digitalmente não pode ser excluído do prontuário por conformidade legal e auditoria.',
    )
  }

  e.next()
}, 'evolucoes')
