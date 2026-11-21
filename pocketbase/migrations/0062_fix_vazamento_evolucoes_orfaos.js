/**
 * 0062 — Correção do vazamento de evoluções órfãs no perfil Profissional.
 *
 * Mesmo padrão de vazamento corrigido na 0061 para as coleções avaliacoes_*:
 * as regras list/view/update/delete da coleção `evolucoes` (definidas na
 * migration 0008 e ampliadas na 0031/0042/0049) continham o ramo
 * `assinado_por_user_id = '' || assinado_por_user_id = null`, criado para
 * evoluções legadas sem autor. Isso expunha QUALQUER evolução sem autor a
 * QUALQUER usuário aprovado — inclusive profissionais — e permitia que um
 * profissional editasse/apagasse evoluções que não eram dele.
 *
 * O que muda (espelho exato da 0061):
 * - list/view: ADM/Secretária veem tudo; Profissional só
 *     (a) assinado_por_user_id = ele, ou
 *     (b) o paciente tem liberação em prontuarios_liberados para ele.
 * - update/delete: ADM/Secretária tudo; Profissional só os DELE.
 * - create: ADM/Secretária tudo; Profissional só com
 *   @request.body.assinado_por_user_id = ele (o serviço front-end
 *   src/services/evolucoes.ts sempre grava o autor — inclusive rascunhos).
 * - Backfill idempotente: evoluções legadas SEM assinado_por_user_id ganham
 *   o user_id do ADM (i6u3oqecwurml3d, 'Dr. Guilherme (Admin)'), para que
 *   continuem visíveis a ADM/Secretária e parem de vazar para profissionais.
 *   Registros que já têm autor não são tocados.
 *
 * IMPORTANTE (regra do dono do produto): regras API de avaliações/evoluções
 * NÃO podem ter ramo user_id/assinado_por_user_id = ''/null — não recriar.
 *
 * Idempotente: regras atribuídas de forma absoluta; backfill condicionado a
 * assinado_por_user_id vazio/nulo.
 */
migrate(
  (app) => {
    const admSec =
      "@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com'"
    const approved = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    const evoRead = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id || (@collection.prontuarios_liberados.paciente_id ?= paciente_id && @collection.prontuarios_liberados.profissional_id ?= @request.auth.id))`
    const evoCreate = `${approved} && ((${admSec}) || @request.body.assinado_por_user_id = @request.auth.id)`
    const evoWrite = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id)`

    // ------------------------------------------------------------------
    // 1. Backfill: evoluções legadas sem autor pertencem ao ADM
    // ------------------------------------------------------------------
    const admId = 'i6u3oqecwurml3d'
    let orfaos
    try {
      orfaos = app.findRecordsByFilter(
        'evolucoes',
        "assinado_por_user_id = '' || assinado_por_user_id = null",
        '',
        0,
        0,
      )
    } catch (_) {
      orfaos = []
    }
    let reparadas = 0
    for (let i = 0; i < orfaos.length; i++) {
      const rec = orfaos[i]
      rec.set('assinado_por_user_id', admId)
      try {
        app.save(rec)
        reparadas++
      } catch (_) {
        // Não interrompe a migration por um único registro problemático
      }
    }
    console.log('[0062] evolucoes órfãs atribuídas ao ADM: ' + reparadas)

    // ------------------------------------------------------------------
    // 2. Regras corrigidas na coleção de evoluções
    // ------------------------------------------------------------------
    const col = app.findCollectionByNameOrId('evolucoes')
    col.listRule = evoRead
    col.viewRule = evoRead
    col.createRule = evoCreate
    col.updateRule = evoWrite
    col.deleteRule = evoWrite
    app.save(col)
  },
  (app) => {
    // Reverter para as regras anteriores (com o ramo de órfãos, que era o vazamento)
    const admSec =
      "@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com'"
    const approved = "@request.auth.id != '' && @request.auth.access_status = 'approved'"
    const evoRead = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id || assinado_por_user_id = '' || assinado_por_user_id = null)`
    const evoCreate = `${approved} && ((${admSec}) || @request.body.assinado_por_user_id = @request.auth.id || @request.body.assinado_por_user_id = '' || @request.body.assinado_por_user_id = null)`
    const evoWrite = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id || assinado_por_user_id = '' || assinado_por_user_id = null)`
    try {
      const col = app.findCollectionByNameOrId('evolucoes')
      col.listRule = evoRead
      col.viewRule = evoRead
      col.createRule = evoCreate
      col.updateRule = evoWrite
      col.deleteRule = evoWrite
      app.save(col)
    } catch (_) {}
  },
)
