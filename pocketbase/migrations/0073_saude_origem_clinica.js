/**
 * 0073 — SaudeRegistros: backfill `registrado_por` nos treinos/reabilitação
 * já criados pela equipe (antes do hook saude_registros_staff existir).
 *
 * Seleciona registros dos tipos 'treino'/'reabilitacao' sem registrado_por e
 * preenche com o criado_por do usuário indicado em dados_json._autor_email
 * (se houver casamento); sem casamento, deixa null — o próximo registro já
 * sai correto via hook. Idempotente: no-op em banco vazio/reparado.
 */
migrate((app) => {
  const faltando = app.findRecordsByFilter(
    'saude_registros',
    "registrado_por = '' && (tipo = 'treino' || tipo = 'reabilitacao')",
    '-created',
    500,
    0,
  )
  for (const r of faltando) {
    const dados = r.get('dados_json') || {}
    const email = dados._autor_email || ''
    if (!email) continue
    try {
      const u = app.findFirstRecordByFilter('users', 'email = {:email}', { email })
      r.set('registrado_por', u.id)
      app.save(r)
    } catch (_) {}
  }
})
