/**
 * 0072 — Saúde & Bem-Estar: treinos físicos e exercícios de reabilitação
 * prescritos pelo profissional na visão clínica, visíveis no app do cliente.
 *
 * - saude_registros.tipo ganha os valores 'treino' e 'reabilitacao' (o exame
 *   já existe). O conteúdo vai em observacao (título) + dados_json
 *   (descricao, exercicios[], resultado), mesma estrutura dos demais tipos —
 *   nenhum campo novo, nenhum dado a migrar.
 * - saude_registrado_por_treino: marcador declarativo do autor clínico, para
 *   a clínica listar "treinos/reabilitação prescritos" separadamente dos
 *   registros do próprio cliente. Idempotente nos dois lados.
 *
 * Nenhum dado existente é alterado.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('saude_registros')
    const tipoField = col.fields.getByName('tipo')
    if (tipoField && tipoField.values) {
      const faltando = ['treino', 'reabilitacao'].filter((v) => !tipoField.values.includes(v))
      if (faltando.length > 0) {
        tipoField.values = [...tipoField.values, ...faltando]
        app.save(col)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('saude_registros')
      const tipoField = col.fields.getByName('tipo')
      if (tipoField && tipoField.values) {
        tipoField.values = tipoField.values.filter((v) => v !== 'treino' && v !== 'reabilitacao')
        app.save(col)
      }
    } catch (_) {}
  },
)
