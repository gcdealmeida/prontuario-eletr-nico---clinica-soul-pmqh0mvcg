/**
 * 0063 — Complemento do backfill da 0062 (evoluções órfãs FECHADAS).
 *
 * A 0062 reparou as evoluções sem autor usando app.save(record), mas o hook
 * onRecordUpdate de pocketbase/hooks/evolucoes_documento_fechado.js BLOQUEIA
 * qualquer alteração em evolução com documento_fechado = true — então a única
 * órfão fechada/assinada (criada antes do campo assinado_por_user_id existir
 * no fluxo de rascunhos) não pôde ser atribuída ao ADM.
 *
 * Aqui o backfill é feito com SQL cru, que não dispara hooks de record:
 * UPDATE evolucoes SET assinado_por_user_id = ADM
 *   WHERE (assinado_por_user_id = '' OR assinado_por_user_id IS NULL)
 *
 * Idempotente: só toca linhas com autor vazio/nulo. Nunca recria o ramo
 * `assinado_por_user_id = ''/null` nas regras API (regra do dono do produto).
 */
migrate(
  (app) => {
    const admId = 'i6u3oqecwurml3d' // 'Dr. Guilherme (Admin)' — mesmo ADM da 0061/0062
    app
      .db()
      .newQuery(
        "UPDATE evolucoes SET assinado_por_user_id = {:adm} WHERE assinado_por_user_id = '' OR assinado_por_user_id IS NULL",
      )
      .bind({ adm: admId })
      .execute()
  },
  (app) => {
    // Nada a reverter: a 0062 já restauraria as regras; o backfill de dados
    // permanece (atribuição de autoria não é desfeita).
  },
)
