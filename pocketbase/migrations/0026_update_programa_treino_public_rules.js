migrate(
  (app) => {
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    const subReadRule = `${approvedCheck} || programa_id.token_compartilhamento != ''`
    const subWriteRule = `${approvedCheck}`

    // 1. Atualizar listRule de programa_treino para permitir que o cliente público consulte via token
    try {
      const treinoCol = app.findCollectionByNameOrId('programa_treino')
      treinoCol.listRule = subReadRule
      treinoCol.viewRule = subReadRule
      treinoCol.createRule = subWriteRule
      treinoCol.updateRule = subWriteRule
      treinoCol.deleteRule = subWriteRule
      app.save(treinoCol)
    } catch (e) {
      console.log('Aviso ao atualizar regras de programa_treino:', e)
    }

    // 2. Garantir que programa_exercicio também tenha list/view com suporte a token público
    try {
      const exCol = app.findCollectionByNameOrId('programa_exercicio')
      exCol.listRule = subReadRule
      exCol.viewRule = subReadRule
      app.save(exCol)
    } catch (e) {
      console.log('Aviso ao atualizar regras de programa_exercicio:', e)
    }

    // 3. Garantir que programa_semana e programa_meta também tenham list/view com token público
    try {
      const semanaCol = app.findCollectionByNameOrId('programa_semana')
      semanaCol.listRule = subReadRule
      semanaCol.viewRule = subReadRule
      app.save(semanaCol)
    } catch (_) {}

    try {
      const metaCol = app.findCollectionByNameOrId('programa_meta')
      metaCol.listRule = subReadRule
      metaCol.viewRule = subReadRule
      app.save(metaCol)
    } catch (_) {}
  },
  (app) => {
    // Reverter regras básicas se necessário
  },
)
