/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Excluir registros criados erroneamente pelo importador de pacientes quando foi alimentado com
    // uma planilha de avaliação individual (AVALIACAO_Rodrigo Dombrowski.xlsx ou criada durante o incidente).
    // Critérios de exclusão:
    // 1. ficha_pre_cadastro contém "AVALIACAO_Rodrigo Dombrowski.xlsx"
    // 2. Ou criados no dia do incidente (2026-10-09) com nomes que são rótulos/perguntas da avaliação
    app
      .db()
      .newQuery(`
      DELETE FROM pacientes
      WHERE ficha_pre_cadastro LIKE '%AVALIACAO_Rodrigo Dombrowski.xlsx%'
         OR (
           created >= '2026-10-09 13:00:00'
           AND (
             nome LIKE '%:%'
             OR nome LIKE '%ABERTURA SUGERIDA%'
             OR nome LIKE '%ANAMNESE CLÍNICA%'
             OR nome LIKE '%MOTIVO DA PROCURA%'
             OR nome LIKE '%O que te trouxe%'
             OR nome LIKE '%Medicação%'
             OR nome LIKE '%TRATAMENTOS%'
             OR nome LIKE '%EXAMES COMPLEMENTARES%'
             OR nome LIKE '%PESSOAL (VOCÊ%'
             OR nome LIKE '%STRESS%'
           )
         )
    `)
      .execute()
  },
  () => {
    // Operação irreversível intencional de limpeza de dados inválidos
  },
)
