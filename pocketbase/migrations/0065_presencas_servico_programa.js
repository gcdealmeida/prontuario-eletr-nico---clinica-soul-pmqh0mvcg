/**
 * 0065 — Campos de serviço e programa na coleção `presencas`.
 *
 * O Painel de Relatórios do gestor (/relatorios) filtra por SERVIÇO e PROGRAMA.
 * A coleção só tinha `area_servico` (categoria) e `detalhe_servico` (texto livre).
 *
 * Novos campos:
 * - servico: nome normalizado do serviço (ex.: "Sessão Fisioterapia"),
 *   preenchido a partir de area_servico quando gravamos a presença.
 * - programa: nome do programa de acompanhamento vinculado, quando o
 *   atendimento pertence a um programa ativo do paciente.
 *
 * Presenças antigas sem esses campos ficam FORA dos filtros específicos de
 * serviço/programa do painel (aceitável e documentado no painel).
 *
 * OBS: `programas_tratamento` é órfã (ferramenta removida) — o backfill de
 * programa usa apenas `programa_acompanhamento`.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('presencas')

    col.fields.add(new TextField({ name: 'servico', max: 200 }))
    col.fields.add(new TextField({ name: 'programa', max: 200 }))
    app.save(col)

    // ---- Backfill de serviço: espelha area_servico (normalizada) em servico
    const presencas = app.findRecordsByFilter('presencas', '', '-created', 0, 0)
    for (const rec of presencas) {
      let mudou = false

      const servicoAtual = rec.getString('servico') || ''
      if (!servicoAtual) {
        const area = rec.getString('area_servico') || ''
        if (area) {
          rec.set('servico', area.trim())
          mudou = true
        }
      }

      if (mudou) app.save(rec)
    }

    // ---- Backfill de programa: presenças do paciente com programa ativo
    //      (mais recente) recebem o nome desse programa.
    const programas = app.findRecordsByFilter(
      'programa_acompanhamento',
      "status = 'ativo'",
      '-created',
      0,
      0,
    )
    const programaPorPaciente = {}
    for (const prog of programas) {
      const pacId = prog.getString('paciente_id') || ''
      if (pacId && !programaPorPaciente[pacId]) {
        programaPorPaciente[pacId] = prog.getString('nome') || ''
      }
    }

    for (const rec of presencas) {
      const pacienteId = rec.getString('paciente_id') || ''
      const programaAtual = rec.getString('programa') || ''
      if (programaAtual) continue

      const nomePrograma = programaPorPaciente[pacienteId] || ''
      if (nomePrograma) {
        rec.set('programa', nomePrograma)
        app.save(rec)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('presencas')
    col.fields.removeByName('servico')
    col.fields.removeByName('programa')
    app.save(col)
  },
)
