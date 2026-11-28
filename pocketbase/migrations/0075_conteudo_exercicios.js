// Coleção `conteudo_exercicios`: conteúdo editado manualmente dentro do app
// (botão "Editar conteúdo" do modal de detalhe da Biblioteca de Exercícios).
// Um registro por exercício, casado pelo nome normalizado (mesma
// normalizacaoNome do frontend). Conteúdo editado VENCE o dicionário curado
// (src/lib/exerciciosConteudo); quem nunca foi editado segue o fallback.
//
// Regras: qualquer usuário autenticado e aprovado da clínica lê e escreve —
// é correção de conteúdo compartilhado da biblioteca, não dado por usuário.

migrate(
  (app) => {
    const collection = new Collection({
      name: 'conteudo_exercicios',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
      viewRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
      createRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
      updateRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
      deleteRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
      fields: [
        { name: 'exercicio', type: 'text', required: true, max: 300 },
        // Nome normalizado (normalizarNome) usado como chave de casamento.
        { name: 'exercicio_normalizado', type: 'text', required: true, max: 300 },
        { name: 'foto_url', type: 'url', required: false },
        { name: 'video_url', type: 'url', required: false },
        // ID de 11 caracteres do YouTube (quando o usuário cola um link, o
        // frontend grava o ID extraído aqui para consulta direta).
        { name: 'video_id', type: 'text', required: false, max: 20 },
        { name: 'como_executar', type: 'text', required: false, max: 8000 },
        { name: 'erros_comuns', type: 'text', required: false, max: 4000 },
        { name: 'musculos', type: 'text', required: false, max: 2000 },
        { name: 'atualizado_por', type: 'text', required: false, max: 150 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        // Um único registro de edição por exercício.
        'CREATE UNIQUE INDEX idx_conteudo_exercicio_norm ON conteudo_exercicios (exercicio_normalizado)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('conteudo_exercicios')
    app.delete(collection)
  },
)
