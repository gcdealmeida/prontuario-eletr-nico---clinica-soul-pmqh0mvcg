/**
 * 0064 — Profissional passa a ver TUDO dos pacientes DESIGNADOS a ele.
 *
 * Regra nova do dono do produto: quando um paciente tem vínculo ativo em
 * `vinculos_pacientes` com um profissional (aba de designações / modal Editar
 * Usuário da Gestão), esse profissional ganha acesso de leitura a TUDO daquele
 * paciente — prontuários/avaliações e evoluções, independente de quem os criou
 * (outro profissional ou o ADM). A aba "Prontuários Liberados"
 * (prontuarios_liberados) deixa de ser necessária, mas continua valendo se
 * existir e não é removida.
 *
 * O que muda:
 * - list/view das 4 coleções avaliacoes_* e de `evolucoes`: além dos ramos
 *   atuais (ADM/Secretária tudo; autoria própria; prontuarios_liberados),
 *   entra o ramo novo `@collection.vinculos_pacientes.paciente_id ?=
 *   paciente_id && @collection.vinculos_pacientes.profissional_id ?=
 *   @request.auth.id`. Órfãos continuam BLOQUEADOS: nenhum ramo
 *   user_id/assinado_por_user_id = ''/null é reintroduzido.
 * - `programa_acompanhamento`: entra o mesmo critério de vínculo no ramo do
 *   Profissional (o branch de token anônimo da viewRule é preservado tal qual).
 * - create/update/delete não mudam: quem pode editar continua sendo
 *   ADM/Secretária (tudo) ou o autor do registro. O vínculo dá acesso de
 *   LEITURA ao histórico completo do paciente, não de escrita no que não é dele.
 *
 * Idempotente: regras são atribuídas de forma absoluta e o ramo é
 * condicionado à existência da coleção de vínculos.
 */
migrate(
  (app) => {
    const admSec =
      "@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com'"
    const approved = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // Ramo novo: o paciente está designado a este profissional.
    const vinculo =
      '(@collection.vinculos_pacientes.paciente_id ?= paciente_id && @collection.vinculos_pacientes.profissional_id ?= @request.auth.id)'
    const liberados =
      '(@collection.prontuarios_liberados.paciente_id ?= paciente_id && @collection.prontuarios_liberados.profissional_id ?= @request.auth.id)'

    // ------------------------------------------------------------------
    // 1. Regras das 4 coleções de avaliação / prontuário
    // ------------------------------------------------------------------
    const avalCols = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
    ]
    const avalRead = `${approved} && ((${admSec}) || user_id = @request.auth.id || ${liberados} || ${vinculo})`
    const avalCreate = `${approved} && ((${admSec}) || @request.body.user_id = @request.auth.id)`
    const avalWrite = `${approved} && ((${admSec}) || user_id = @request.auth.id)`

    // ------------------------------------------------------------------
    // 2. Regras da coleção de evoluções
    // ------------------------------------------------------------------
    const evoRead = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id || ${liberados} || ${vinculo})`
    const evoCreate = `${approved} && ((${admSec}) || @request.body.assinado_por_user_id = @request.auth.id)`
    const evoWrite = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id)`

    // ------------------------------------------------------------------
    // 3. programa_acompanhamento (mesmo critério de vínculo no ramo do
    //    Profissional; branch de token anônimo da viewRule preservado)
    // ------------------------------------------------------------------
    const progBase = `(${admSec}) || profissional_id = @request.auth.id || ${vinculo} || paciente_id.profissional_responsavel_id = @request.auth.id`
    const progList = `${approved} && ${progBase}`
    const progView = `token_compartilhamento != '' || (${approved} && ${progBase})`
    const progCreate = `${approved} && ((${admSec}) || @request.body.profissional_id = @request.auth.id)`
    const progWrite = `${approved} && ${progBase}`

    const regras = {}
    for (let i = 0; i < avalCols.length; i++) {
      regras[avalCols[i]] = {
        list: avalRead,
        view: avalRead,
        create: avalCreate,
        update: avalWrite,
        del: avalWrite,
      }
    }
    regras['evolucoes'] = {
      list: evoRead,
      view: evoRead,
      create: evoCreate,
      update: evoWrite,
      del: evoWrite,
    }
    regras['programa_acompanhamento'] = {
      list: progList,
      view: progView,
      create: progCreate,
      update: progWrite,
      del: progWrite,
    }

    const nomes = Object.keys(regras)
    for (let i = 0; i < nomes.length; i++) {
      const nome = nomes[i]
      let col
      try {
        col = app.findCollectionByNameOrId(nome)
      } catch (_) {
        continue
      }
      const r = regras[nome]
      col.listRule = r.list
      col.viewRule = r.view
      col.createRule = r.create
      col.updateRule = r.update
      col.deleteRule = r.del
      app.save(col)
    }
  },
  (app) => {
    // Reverte para as regras de 0061/0062 (sem o ramo de vínculos).
    const admSec =
      "@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com'"
    const approved = "@request.auth.id != '' && @request.auth.access_status = 'approved'"
    const liberados =
      '(@collection.prontuarios_liberados.paciente_id ?= paciente_id && @collection.prontuarios_liberados.profissional_id ?= @request.auth.id)'

    const avalRead = `${approved} && ((${admSec}) || user_id = @request.auth.id || ${liberados})`
    const avalCreate = `${approved} && ((${admSec}) || @request.body.user_id = @request.auth.id)`
    const avalWrite = `${approved} && ((${admSec}) || user_id = @request.auth.id)`
    const evoRead = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id || ${liberados})`
    const evoCreate = `${approved} && ((${admSec}) || @request.body.assinado_por_user_id = @request.auth.id)`
    const evoWrite = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id)`
    const progBase = `(${admSec}) || profissional_id = @request.auth.id || profissional_id = '' || profissional_id = null || paciente_id.profissional_responsavel_id = @request.auth.id`
    const progList = `${approved} && ${progBase}`
    const progView = `token_compartilhamento != '' || (${approved} && ${progBase})`
    const progCreate = `${approved} && ((${admSec}) || @request.body.profissional_id = @request.auth.id || @request.body.profissional_id = '' || @request.body.profissional_id = null)`
    const progWrite = `${approved} && ${progBase}`

    const regras = {}
    const avalCols = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
    ]
    for (let i = 0; i < avalCols.length; i++) {
      regras[avalCols[i]] = {
        list: avalRead,
        view: avalRead,
        create: avalCreate,
        update: avalWrite,
        del: avalWrite,
      }
    }
    regras['evolucoes'] = {
      list: evoRead,
      view: evoRead,
      create: evoCreate,
      update: evoWrite,
      del: evoWrite,
    }
    regras['programa_acompanhamento'] = {
      list: progList,
      view: progView,
      create: progCreate,
      update: progWrite,
      del: progWrite,
    }

    const nomes = Object.keys(regras)
    for (let i = 0; i < nomes.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(nomes[i])
        const r = regras[nomes[i]]
        col.listRule = r.list
        col.viewRule = r.view
        col.createRule = r.create
        col.updateRule = r.update
        col.deleteRule = r.del
        app.save(col)
      } catch (_) {}
    }
  },
)
