/**
 * 0068 — Saúde & Bem-Estar: tipos de registro do app do cliente (modelo do
 * health-tracker de referência) e campos de perfil.
 *
 * O que muda:
 * - saude_registros.tipo ganha 'medicacao', 'refeicao' e 'emocao'
 *   (medicações/rotinas, refeições e diário emocional do app do cliente).
 *   Registros existentes mantêm o tipo — não há dado a migrar.
 * - saude_clientes ganha altura_cm, peso_kg, genero e metas (json) para a
 *   aba Perfil do app do cliente.
 * - saude_clientes.updateRule ganha ramo do cliente editando o PRÓPRIO cadastro
 *   (user_id = @request.auth.id). O hook saude_clientes_perfil_guard.js limita
 *   os campos que ele pode tocar (altura/peso/gênero/metas) — nunca identidade.
 *
 * Idempotente: campos só são adicionados se não existirem; select e regra só
 * são regravados se o que falta estiver ausente.
 */
migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 1. Novos valores em saude_registros.tipo
    // ------------------------------------------------------------------
    const registrosCol = app.findCollectionByNameOrId('saude_registros')
    const tipoField = registrosCol.fields.getByName('tipo')
    const novosValores = ['medicacao', 'refeicao', 'emocao']
    if (tipoField && tipoField.values) {
      const faltando = novosValores.filter((v) => !tipoField.values.includes(v))
      if (faltando.length > 0) {
        tipoField.values = [...tipoField.values, ...faltando]
        app.save(registrosCol)
      }
    }

    // ------------------------------------------------------------------
    // 2. Campos de perfil em saude_clientes
    // ------------------------------------------------------------------
    const clientesCol = app.findCollectionByNameOrId('saude_clientes')
    const novosCampos = [
      { type: 'number', name: 'altura_cm', min: 0, max: 300 },
      { type: 'number', name: 'peso_kg', min: 0, max: 500 },
      {
        type: 'select',
        name: 'genero',
        values: ['feminino', 'masculino', 'outro', 'nao_informado'],
        maxSelect: 1,
      },
      { type: 'json', name: 'metas', maxSize: 20000 },
    ]
    let mudou = false
    for (const campo of novosCampos) {
      try {
        if (!clientesCol.fields.getByName(campo.name)) {
          clientesCol.fields.add(new Field(campo))
          mudou = true
        }
      } catch (_) {
        clientesCol.fields.add(new Field(campo))
        mudou = true
      }
    }

    // ------------------------------------------------------------------
    // 3. Regra de update: o cliente pode editar o PRÓPRIO perfil
    //    (campos limitados pelo hook saude_clientes_perfil_guard.js)
    // ------------------------------------------------------------------
    const ramoCliente =
      " || (@request.auth.id != '' && @request.auth.access_status = 'approved' && @request.auth.role = 'cliente' && user_id = @request.auth.id)"
    const regraAtual = clientesCol.updateRule || ''
    if (regraAtual.indexOf("@request.auth.role = 'cliente'") === -1) {
      clientesCol.updateRule = regraAtual + ramoCliente
      mudou = true
    }

    if (mudou) app.save(clientesCol)
  },
  (app) => {
    // Reverte: remove os campos de perfil e o ramo do cliente na regra de
    // update. O select 'tipo' mantém os valores (removê-los quebraria dados).
    try {
      const clientesCol = app.findCollectionByNameOrId('saude_clientes')
      for (const nome of ['altura_cm', 'peso_kg', 'genero', 'metas']) {
        try {
          const f = clientesCol.fields.getByName(nome)
          if (f) clientesCol.fields.remove(f)
        } catch (_) {}
      }
      const regra = clientesCol.updateRule || ''
      const corte = regra.indexOf(" || (@request.auth.id != ''")
      if (corte !== -1 && regra.indexOf("@request.auth.role = 'cliente'") !== -1) {
        clientesCol.updateRule = regra.slice(0, corte)
      }
      app.save(clientesCol)
    } catch (_) {}
  },
)
