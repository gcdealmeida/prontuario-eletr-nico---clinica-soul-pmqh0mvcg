/**
 * Saúde e Bem-Estar — o cliente só registra dados no PRÓPRIO cadastro.
 *
 * A regra de API de saude_registros permite criação ao perfil 'cliente', mas não
 * consegue amarrar `cliente_id` ao cadastro cujo user_id é o usuário logado.
 * Este hook faz essa checagem: se quem cria é um cliente, o saude_clientes
 * apontado por cliente_id precisa ter user_id = usuário logado. Caso contrário, 403.
 * Equipe (ADM/Secretária/Profissional) não passa por essa checagem.
 */

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (auth && auth.getString('role') === 'cliente') {
    const clienteId = e.record.getString('cliente_id')
    let doCliente = null
    try {
      doCliente = $app.findRecordById('saude_clientes', clienteId)
    } catch (_) {
      doCliente = null
    }
    if (!doCliente || doCliente.getString('user_id') !== auth.id) {
      throw new ForbiddenError('Você só pode registrar dados no seu próprio cadastro.')
    }
    e.record.set('registrado_por', auth.id)
  }
  e.next()
}, 'saude_registros')
