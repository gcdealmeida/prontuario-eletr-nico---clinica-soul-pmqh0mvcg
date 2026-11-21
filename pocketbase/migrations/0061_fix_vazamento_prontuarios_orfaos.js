/**
 * 0061 — Correção do vazamento de prontuários órfãos no perfil Profissional.
 *
 * Sintoma: profissional@teste.com via 3 prontuários em /prontuarios (2 rascunhos
 * + 1 concluído) que NÃO eram dele nem de sua paciente designada.
 * Causa: as regras list/view/update/delete das coleções avaliacoes_*
 * (definidas na migration 0060) continham o ramo `user_id = '' || user_id = null`,
 * criado para prontuários legados (anteriores ao campo user_id). Isso expunha
 * QUALQUER prontuário sem autor a QUALQUER usuário aprovado — inclusive
 * profissionais — violando a regra do dono do produto: o Profissional só vê
 * (a) o que ele construiu e (b) o que foi liberado via prontuarios_liberados.
 *
 * O que muda:
 * - list/view: ADM/Secretária veem tudo; Profissional só user_id = seu id OU
 *   o paciente tem liberação em prontuarios_liberados para ele.
 * - update/delete: ADM/Secretária tudo; Profissional só os DELE (user_id = id) —
 *   não pode mais editar nem apagar prontuários órfãos construídos por outros.
 * - create permanece: @request.body.user_id = @request.auth.id (o front sempre
 *   grava o autor; o backfill abaixo repara os legados para novos autores).
 * - Backfill idempotente: prontuários legados SEM user_id e SEM autor declarado
 *   em texto ganham user_id = ADM (i6u3oqecwurml3d, 'Dr. Guilherme (Admin)'),
 *   para que continuem visíveis a ADM/Secretária (que veem tudo) e parem de
 *   vazar para profissionais. Registros que já têm user_id não são tocados.
 *
 * Idempotente: regras são atribuídas de forma absoluta; backfill condicionado
 * a user_id = '' || null.
 */
migrate(
  (app) => {
    const admSec =
      "@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com'"
    const approved = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    const avalRead = `${approved} && ((${admSec}) || user_id = @request.auth.id || (@collection.prontuarios_liberados.paciente_id ?= paciente_id && @collection.prontuarios_liberados.profissional_id ?= @request.auth.id))`
    const avalCreate = `${approved} && ((${admSec}) || @request.body.user_id = @request.auth.id)`
    const avalWrite = `${approved} && ((${admSec}) || user_id = @request.auth.id)`

    const avalCols = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
    ]

    // ------------------------------------------------------------------
    // 1. Backfill: prontuários legados sem user_id pertencem ao ADM
    // ------------------------------------------------------------------
    const admId = 'i6u3oqecwurml3d'
    for (let i = 0; i < avalCols.length; i++) {
      const nome = avalCols[i]
      let orfaos
      try {
        orfaos = app.findRecordsByFilter(nome, "user_id = '' || user_id = null", '', 0, 0)
      } catch (_) {
        continue
      }
      for (let j = 0; j < orfaos.length; j++) {
        const rec = orfaos[j]
        rec.set('user_id', admId)
        try {
          app.save(rec)
        } catch (_) {
          // Não interrompe a migration por um único registro problemático
        }
      }
    }

    // ------------------------------------------------------------------
    // 2. Regras corrigidas nas 4 coleções de avaliação
    // ------------------------------------------------------------------
    for (let i = 0; i < avalCols.length; i++) {
      const col = app.findCollectionByNameOrId(avalCols[i])
      col.listRule = avalRead
      col.viewRule = avalRead
      col.createRule = avalCreate
      col.updateRule = avalWrite
      col.deleteRule = avalWrite
      app.save(col)
    }
  },
  (app) => {
    // Reverter para as regras da 0060 (com o ramo de órfãos, que era o vazamento)
    const admSec =
      "@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com'"
    const approved = "@request.auth.id != '' && @request.auth.access_status = 'approved'"
    const avalRead = `${approved} && ((${admSec}) || user_id = @request.auth.id || user_id = '' || user_id = null || (@collection.prontuarios_liberados.paciente_id ?= paciente_id && @collection.prontuarios_liberados.profissional_id ?= @request.auth.id))`
    const avalCreate = `${approved} && ((${admSec}) || @request.body.user_id = @request.auth.id)`
    const avalWrite = `${approved} && ((${admSec}) || user_id = @request.auth.id || user_id = '' || user_id = null)`
    const avalCols = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
    ]
    for (let i = 0; i < avalCols.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(avalCols[i])
        col.listRule = avalRead
        col.viewRule = avalRead
        col.createRule = avalCreate
        col.updateRule = avalWrite
        col.deleteRule = avalWrite
        app.save(col)
      } catch (_) {}
    }
  },
)
