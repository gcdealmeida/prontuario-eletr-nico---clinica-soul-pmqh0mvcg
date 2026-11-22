/**
 * Hook — o cliente (role 'cliente') só pode editar o PRÓPRIO cadastro em
 * saude_clientes e somente os campos de PERFIL do app (altura, peso, gênero,
 * metas). Nome, e-mail, vínculo com paciente e status ficam sob controle da
 * clínica — qualquer tentativa de alterá-los é ignorada silenciosamente (a
 * regra de API já garante que só o dono chega aqui; ADM/Secretária passam livres).
 */
onRecordUpdateRequest((e) => {
  const auth = e.auth
  if (auth && auth.getString('role') === 'cliente') {
    const donoId = e.record.original().getString('user_id')
    if (donoId !== auth.id) {
      throw new ForbiddenError('Você só pode editar o seu próprio perfil.')
    }
    const permitidos = ['altura_cm', 'peso_kg', 'genero', 'metas']
    const orig = e.record.original()
    for (const campo of ['nome', 'email', 'paciente_id', 'user_id', 'ativo', 'observacoes']) {
      if (e.record.getString(campo) !== orig.getString(campo)) {
        e.record.set(campo, orig.getString(campo))
      }
    }
    e.record.set('registrado_por', auth.id)
  }
  e.next()
}, 'saude_clientes')
