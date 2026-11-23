/**
 * Saúde e Bem-Estar — auditoria de quem registrou.
 *
 * Registros criados pela EQUIPE (adm/secretaria/profissional) em
 * saude_registros ganham registrado_por = usuário logado, para a visão
 * clínica mostrar quem prescreveu. A criação pelo perfil 'cliente' já é
 * tratada em saude_registros_cliente.js (posse do cadastro).
 *
 * Restrição de acesso por vínculo (profissional só clientes designados) fica
 * nas API rules da coleção (0067/0068) e no carregamento da página.
 */

onRecordCreateRequest((e) => {
  const auth = e.auth
  const role = auth ? auth.getString('role') : ''
  const staff = ['adm', 'admin', 'secretaria', 'profissional', 'professional']
  if (auth && staff.includes(role)) {
    e.record.set('registrado_por', auth.id)
  }
  e.next()
}, 'saude_registros')
