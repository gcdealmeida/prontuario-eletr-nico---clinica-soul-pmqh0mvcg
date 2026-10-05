migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('evolucoes')

    if (!col.fields.getByName('numero_registro')) {
      col.fields.add(new TextField({ name: 'numero_registro' }))
    }
    if (!col.fields.getByName('assinado_em')) {
      col.fields.add(new DateField({ name: 'assinado_em' }))
    }
    if (!col.fields.getByName('assinado_por_nome')) {
      col.fields.add(new TextField({ name: 'assinado_por_nome' }))
    }
    if (!col.fields.getByName('assinado_por_especialidade')) {
      col.fields.add(new TextField({ name: 'assinado_por_especialidade' }))
    }
    if (!col.fields.getByName('assinado_por_user_id')) {
      col.fields.add(new TextField({ name: 'assinado_por_user_id' }))
    }
    if (!col.fields.getByName('documento_fechado')) {
      col.fields.add(new BoolField({ name: 'documento_fechado' }))
    }
    if (!col.fields.getByName('evolucao_referencia_id')) {
      col.fields.add(new TextField({ name: 'evolucao_referencia_id' }))
    }
    if (!col.fields.getByName('tipo_evolucao')) {
      col.fields.add(
        new SelectField({
          name: 'tipo_evolucao',
          values: ['Rotina', 'Corretiva'],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)

    // Retrocompatibilidade: registros que já tinham status 'Finalizada' ganham assinatura e numeração
    try {
      const records = app.findRecordsByFilter(
        'evolucoes',
        "status = 'Finalizada'",
        'created',
        200,
        0,
      )
      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        let changed = false
        if (!rec.getString('assinado_em')) {
          rec.set('assinado_em', rec.getString('created') || new Date().toISOString())
          changed = true
        }
        if (!rec.getString('assinado_por_nome')) {
          rec.set('assinado_por_nome', rec.getString('profissional') || 'Profissional SOUL')
          changed = true
        }
        if (!rec.getString('assinado_por_especialidade')) {
          rec.set('assinado_por_especialidade', rec.getString('especialidade') || 'Fisioterapia')
          changed = true
        }
        if (!rec.getBool('documento_fechado')) {
          rec.set('documento_fechado', true)
          changed = true
        }
        if (!rec.getString('numero_registro')) {
          const ano = (rec.getString('created') || '2026').slice(0, 4)
          rec.set('numero_registro', `EVO-${ano}-${rec.id.slice(0, 6).toUpperCase()}`)
          changed = true
        }
        if (!rec.getString('tipo_evolucao')) {
          rec.set('tipo_evolucao', 'Rotina')
          changed = true
        }
        if (changed) {
          app.save(rec)
        }
      }
    } catch (e) {
      console.log('Aviso retrocompatibilidade evoluções:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('evolucoes')
      const fieldNames = [
        'numero_registro',
        'assinado_em',
        'assinado_por_nome',
        'assinado_por_especialidade',
        'assinado_por_user_id',
        'documento_fechado',
        'evolucao_referencia_id',
        'tipo_evolucao',
      ]
      fieldNames.forEach((fn) => {
        const f = col.fields.getByName(fn)
        if (f) col.fields.remove(f)
      })
      app.save(col)
    } catch (_) {}
  },
)
