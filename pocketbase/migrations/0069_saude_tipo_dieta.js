/**
 * 0069 — Saúde & Bem-Estar: valor 'dieta' em saude_registros.tipo.
 *
 * O app do cliente (/cliente, aba Exames & Dietas) já cria registros com
 * tipo='dieta' (SaudeRegistroTipo em saudeBemEstar.ts), mas o select no
 * backend só conhece os valores da 0068 (medicacao/refeicao/emocao) — o
 * create falha em runtime. Esta migration adiciona o valor que falta.
 *
 * Idempotente: só grava se o valor estiver ausente. Registros existentes
 * mantêm o tipo — não há dado a migrar.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('saude_registros')
    const tipoField = col.fields.getByName('tipo')
    if (tipoField && tipoField.values && !tipoField.values.includes('dieta')) {
      tipoField.values = [...tipoField.values, 'dieta']
      app.save(col)
    }
  },
  (app) => {
    // Reverte removendo o valor do select — a remoção não apaga registros
    // existentes com 'dieta', só deixa de validar novos creates.
    try {
      const col = app.findCollectionByNameOrId('saude_registros')
      const tipoField = col.fields.getByName('tipo')
      if (tipoField && tipoField.values) {
        tipoField.values = tipoField.values.filter((v) => v !== 'dieta')
        app.save(col)
      }
    } catch (_) {}
  },
)
