/**
 * 0070 — Saúde & Bem-Estar: regras de update/delete de saude_registros para o cliente.
 *
 * O app do cliente (/cliente) permite excluir/editar os PRÓPRIOS registros
 * (botões de lixeira em Métricas/Refeições/Exames & Dietas), mas as regras da
 * 0067/0068 só davam update/delete a staff. O cliente agora pode alterar ou
 * apagar apenas registros do SEU cadastro de saúde (cliente_id.user_id =
 * @request.auth.id) — mesmo ramo da regra de leitura. Staff mantém tudo.
 *
 * Idempotente: a regra só é regravada se o ramo do cliente estiver ausente.
 */
migrate(
  (app) => {
    const cliente =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && @request.auth.role = 'cliente'"
    const ramoCliente = ` || (${cliente} && cliente_id.user_id = @request.auth.id)`
    const col = app.findCollectionByNameOrId('saude_registros')

    let mudou = false
    if ((col.updateRule || '').indexOf("@request.auth.role = 'cliente'") === -1) {
      col.updateRule = (col.updateRule || '') + ramoCliente
      mudou = true
    }
    if ((col.deleteRule || '').indexOf("@request.auth.role = 'cliente'") === -1) {
      col.deleteRule = (col.deleteRule || '') + ramoCliente
      mudou = true
    }
    if (mudou) app.save(col)
  },
  (app) => {
    // Reverte: corta o ramo adicionado (marca inequívoca do ramo do cliente).
    try {
      const col = app.findCollectionByNameOrId('saude_registros')
      const corte = (regra) => {
        const i = regra.indexOf(
          " || (@request.auth.id != '' && @request.auth.access_status = 'approved' && @request.auth.role = 'cliente'",
        )
        return i === -1 ? regra : regra.slice(0, i)
      }
      col.updateRule = corte(col.updateRule || '')
      col.deleteRule = corte(col.deleteRule || '')
      app.save(col)
    } catch (_) {}
  },
)
