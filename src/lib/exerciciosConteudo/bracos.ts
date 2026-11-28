import type { ConteudoExercicio } from './tipos'

/** Braços — bíceps, tríceps, antebraço. Chaves = nomes da coleção (migration 0023). */
export const BRACOS: Record<string, ConteudoExercicio> = {
  'Tríceps testa com barra W no banco reto': {
    descricao:
      'Deitado no banco, barra W acima do peito com braços estendidos. Flexione apenas os cotovelos para descer a barra em direção à testa (ou um pouco atrás) e estenda de volta sem mover os braços da posição vertical. Os ombros são imóveis: o movimento é só de cotovelo.',
    errosComuns: [
      'Cotovelos abrindo para os lados (perde tensão no tríceps)',
      'Mover os ombros para ajudar',
      'Descer rápido demais (a barra chega perto da cabeça — controle!)',
    ],
    musculos: ['Tríceps braquial (cabeça longa e lateral)'],
  },
  'Tríceps testa inclinado com halteres': {
    descricao:
      'Banco inclinado a 30–45°, halteres acima com braços levemente inclinados para trás. Flexione só os cotovelos para descer os halteres em direção às têmporas e estenda de volta mantendo o ângulo do braço constante. A inclinação alonga mais a cabeça longa.',
    errosComuns: [
      'Braços balançando (ângulo do braço fixo)',
      'Cotovelos abrindo para os lados',
      'Carga alta demais para controlar a descida',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Tríceps francês com halter bilateral': {
    descricao:
      'Sentado com encosto ou em pé, halter acima da cabeça com duas mãos. Flexione os cotovelos para descer o peso atrás da cabeça, mantendo os braços apontando para cima e cotovelos para o teto, e estenda de volta. Alonga a cabeça longa em amplitude máxima.',
    errosComuns: [
      'Cotovelos abrindo (devem ficar apontados para cima)',
      'Arquear a lombar para ganhar alavanca',
      'Amplitude muito curta (metade do arco)',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Tríceps francês unilateral com halter': {
    descricao:
      'Mesma posição do francês bilateral, com um halter em uma mão: desça atrás da cabeça com controle e estenda. Corrige assimetrias e exige mais estabilidade do ombro em rotação.',
    errosComuns: [
      'Cotovelo deslocando para o lado durante a série',
      'Carga alta demais (posição unilateral menos estável)',
      'Tronco inclinando para o lado do peso',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Tríceps coice com halter': {
    descricao:
      'Tronco inclinado a ~45° (ou apoio no banco), braço rente ao tronco com cotovelo a 90°. Estenda o cotovelo para trás até o braço alinhar com o tronco, aperte o tríceps 1 segundo e retorne devagar. O cotovelo fica "colado" no lugar: só ele se move.',
    errosComuns: [
      'Balançar o braço inteiro para gerar impulso',
      'Amplitude parcial (não estender completamente)',
      'Rotação do tronco para o lado do movimento',
    ],
    musculos: ['Tríceps braquial'],
  },
  'Tríceps corda na polia alta': {
    descricao:
      'Polia alta com corda, cotovelos rentes ao tronco. Estenda os cotovelos para baixo e, no final, abra levemente as pontas da corda para fora (rotação externa dos punhos) apertando o tríceps. Retorne controlado até os antebraços tocarem os bíceps.',
    errosComuns: [
      'Cotovelos se afastando do tronco (vira press de peito)',
      'Inclinar o tronco para gerar impulso',
      'Não fazer a rotação final das pontas (perde contração)',
    ],
    musculos: ['Tríceps braquial'],
  },
  'Tríceps barra reta na polia alta': {
    descricao:
      'Polia alta com barra reta, cotovelos rentes ao corpo. Estenda até os braços ficarem ao lado do tronco, aperte o tríceps 1 segundo e retorne controlado até a flexão máxima. Tronco estável e core firme.',
    errosComuns: [
      'Empurrar com o peso do corpo (degrau para frente)',
      'Cotovelos abrindo na descida',
      'Amplitude parcial no topo (antebraço não toca o bíceps)',
    ],
    musculos: ['Tríceps braquial'],
  },
  'Tríceps barra V na polia alta': {
    descricao:
      'Mesma execução da barra reta, com o formato em V permitindo pegada mais aberta e amigável ao cotovelo. Cotovelos rentes ao tronco, extensão completa com pausa e retorno controlado.',
    errosComuns: [
      'Empurrar com o corpo',
      'Punhos quebrando para baixo no final',
      'Amplitude parcial',
    ],
    musculos: ['Tríceps braquial'],
  },
  'Tríceps unilateral pegada invertida na polia': {
    descricao:
      'Polia alta, cabo com pegada supinada (palma para cima). Cotovelo rente ao tronco: estenda até o braço alinhar, girando a palma para baixo no final, e retorne controlado. A rotação aumenta o trabalho da cabeça lateral.',
    errosComuns: [
      'Cotovelo se afastando do tronco',
      'Rotação apressada sem extensão completa',
      'Carga alta demais que rouba a rotação final',
    ],
    musculos: ['Tríceps braquial (cabeça lateral)'],
  },
  'Tríceps testa na polia com corda': {
    descricao:
      'De costas para a polia alta, corda nas mãos, braços apontando para cima e levemente para trás. Flexione apenas os cotovelos para trazer a corda em direção à testa/atrás da cabeça e estenda de volta. A polia mantém tensão constante, inclusive no topo.',
    errosComuns: [
      'Mover os ombros (ângulo do braço fixo)',
      'Cotovelos abrindo',
      'Polia puxando rápido no topo',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Mergulho no banco (Bench Dip) com peso sobre as pernas': {
    descricao:
      'Mãos no banco atrás do corpo, pernas à frente (ou flexionadas para facilitar), anilha sobre as coxas se desejar. Flexione os cotovelos para descer o quadril até ~90° e empurre de volta. Peito aberto e ombros afastados das orelhas.',
    errosComuns: [
      'Quadril descendo muito baixo (estressa o ombro anterior)',
      'Ombros encolhidos em direção às orelhas',
      'Empurrar as pernas para ajudar',
    ],
    musculos: ['Tríceps braquial', 'Deltoide anterior', 'Peitoral inferior'],
  },
  'Supino fechado com barra (Close-grip Bench Press)': {
    descricao:
      'Supino reto com pegada na largura dos ombros (ou pouco menor). Desça a barra até o esterno com cotovelos rentes ao tronco e empurre de volta. A mecânica é a do supino, mas os cotovelos fechados transferem o protagonismo ao tríceps.',
    errosComuns: [
      'Pegada estreita demais (estressa punhos e cotovelos)',
      'Cotovelos abrindo na descida',
      'Descer na linha do peitoral superior (a barra vai ao esterno)',
    ],
    musculos: ['Tríceps braquial', 'Peitoral maior', 'Deltoide anterior'],
  },
  'Rosca direta com barra reta': {
    descricao:
      'Em pé, barra com pegada supinada na largura dos ombros, cotovelos rentes ao tronco. Flexione os cotovelos subindo a barra até a contração máxima do bíceps e desça controlado. Cotovelos "colados" e tronco parado: só o antebraço se move.',
    errosComuns: [
      'Impulso lombar para vencer o ponto difícil',
      'Cotovelos andando para frente (vira elevação frontal de ombro)',
      'Descida em queda livre',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior', 'Braquiorradial'],
  },
  'Rosca direta com barra W': {
    descricao:
      'Mesma execução da rosca direta com barra W: o formato permite pegada semirrotada que reduz a tensão no punho e cotovelo. Suba controlado, aperte no topo e desça em 2–3 segundos. Prefira essa barra se a reta causar desconforto no punho.',
    errosComuns: [
      'Impulso de tronco',
      'Cotovelos deslocando para frente',
      'Amplitude parcial (não estender completamente no fundo)',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca alternada com halteres com rotação': {
    descricao:
      'Halteres ao lado do corpo com pegada neutra. Ao subir um braço, gire o punho até a palma ficar para cima no topo (supinação ativa). Desça controlado e troque de lado. Recruta o bíceps em sua função completa.',
    errosComuns: [
      'Rotação apressada ou incompleta',
      'Balanço do tronco para iniciar cada subida',
      'Cotovelo deslocando para frente',
    ],
    musculos: ['Bíceps braquial', 'Supinador', 'Braquial anterior'],
  },
  'Rosca martelo com halteres em pé': {
    descricao:
      'Halteres com pegada neutra (palmas se olhando), cotovelos rentes ao tronco. Flexione os cotovelos subindo os halteres como um martelo e desça controlado. A pegada neutra recruta braquial e braquiorradial (espessura do antebraço).',
    errosComuns: [
      'Impulso do tronco',
      'Cotovelos andando para frente',
      'Punhos girando (permaneça neutro)',
    ],
    musculos: ['Braquial anterior', 'Braquiorradial', 'Bíceps braquial'],
  },
  'Rosca martelo na corda na polia baixa': {
    descricao:
      'Polia baixa com corda, pegada neutra: flexione os cotovelos subindo as pontas da corda e desça controlado. A polia mantém tensão constante, inclusive no fundo do movimento.',
    errosComuns: [
      'Inclinar o tronco para trás para ajudar',
      'Cotovelos deslocando',
      'Polia puxando rápido no retorno',
    ],
    musculos: ['Braquial anterior', 'Braquiorradial', 'Bíceps'],
  },
  'Rosca concentrada com halter': {
    descricao:
      'Sentado, cotovelo do braço que trabalha apoiado na parte interna da coxa, tronco levemente inclinado à frente. Flexione o cotovelo até a contração máxima, aperte 1 segundo e desça controlado. O apoio elimina trapaças.',
    errosComuns: [
      'Empurrar com a coxa',
      'Torção do tronco para levantar',
      'Amplitude parcial no alongamento',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca Scott com barra W no banco específico': {
    descricao:
      'Axilas apoiadas no banco Scott, barra W com pegada semisupinada. Flexione os cotovelos subindo a barra e desça controlado até a extensão quase completa, sem travar. O apoio elimina o impulso: versão mais rigorosa da rosca.',
    errosComuns: [
      'Axilas descolando do apoio',
      'Não descer até a extensão (a metade final é a mais valiosa)',
      'Carga alta demais para controlar a negativa',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca Scott na máquina': {
    descricao:
      'Braços apoiados no rolamento da máquina, cotovelos alinhados ao eixo: flexione subindo a alça e desça controlado. A máquina mantém tensão constante e isola o bíceps sem exigir estabilidade da barra.',
    errosComuns: [
      'Eixo dos cotovelos desalinhado do pivô da máquina',
      'Axilas descolando do apoio',
      'Amplitude parcial',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca inclinada em 45° com halteres no banco': {
    descricao:
      'Sentado no banco a 45°, halteres pendendo atrás da linha do corpo, braços alinhados com os ombros. Flexione os cotovelos subindo os halteres e desça controlado. A posição alonga a cabeça longa do bíceps no fundo.',
    errosComuns: [
      'Braços "viajando" para frente na subida (perde o alongamento)',
      'Carga alta demais (a posição alongada exige menos peso)',
      'Encolher os ombros em direção às orelhas',
    ],
    musculos: ['Bíceps braquial (cabeça longa)', 'Braquial anterior'],
  },
  'Rosca aranha (Spider Curl) no banco inclinado': {
    descricao:
      'De bruços no banco inclinado, halteres pendendo verticalmente, braços alinhados com os ombros. Flexione os cotovelos subindo os halteres sem mover a posição dos braços e desça controlado. O ângulo elimina o impulso e isola o bíceps.',
    errosComuns: [
      'Braços deslocando da posição vertical',
      'Levantar cabeça e peito para ajudar',
      'Carga alta demais para controlar a negativa',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca bíceps bilateral na polia alta (Hercules Curl)': {
    descricao:
      'Duas polias altas, um cabo em cada mão, braços abertos na linha dos ombros. Flexione os cotovelos trazendo as mãos em direção às têmporas, sem mover a posição dos cotovelos, e desça controlado. Tensão máxima justamente na posição de maior contração.',
    errosComuns: [
      'Cotovelos deslocando da linha dos ombros',
      'Inclinar o tronco para trás para ajudar',
      'Carga alta demais (a posição é instável)',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca inversa com barra reta (foco em braquiorradial)': {
    descricao:
      'Barra com pegada pronada (palmas para baixo) na largura dos ombros, cotovelos rentes ao tronco. Flexione os cotovelos subindo a barra e desça controlado. A pegada invertida recruta braquiorradial e braquial em vez do bíceps.',
    errosComuns: [
      'Carga alta demais (a pegada invertida é visivelmente mais fraca)',
      'Impulso de tronco',
      'Punhos quebrando (dor no punho — use barra W)',
    ],
    musculos: ['Braquiorradial', 'Braquial anterior', 'Extensores do carpo'],
  },
  'Rosca de punho com barra sobre o banco (flexores)': {
    descricao:
      'Sentado, antebraços apoiados no banco com punhos para fora da borda, barra com pegada supinada. Deixe os punhos caírem em extensão e flexione-os subindo a barra, apertando os flexores no topo. Os antebraços não descolam do banco.',
    errosComuns: [
      'Levantar os antebraços do apoio',
      'Amplitude exagerada que estressa o punho',
      'Carga alta demais (músculos do punho são pequenos)',
    ],
    musculos: ['Flexores do carpo', 'Flexor radial do carpo', 'Palmar longo'],
  },
  'Rosca de punho inversa com barra (extensores)': {
    descricao:
      'Antebraços apoiados no banco, barra com pegada pronada: desça os punhos em flexão e estenda-os subindo a barra, apertando os extensores no topo. Fundamental para equilibrar o antebraço e prevenir epicondilite.',
    errosComuns: [
      'Antebraços descolando do apoio',
      'Amplitude exagerada',
      'Pular o exercício (extensores fracos causam dor lateral no cotovelo)',
    ],
    musculos: ['Extensores do carpo', 'Extensores dos dedos'],
  },
  'Rotação de punho com halteres/martelo (pronossupinação)': {
    descricao:
      'Sentado, cotovelo a 90° apoiado na coxa, halter segurado apenas pela cabeça (reduz o momento). Gire o punho alternando palma para cima (supinação) e para baixo (pronação), devagar e controlado. Previne lesões no cotovelo.',
    errosComuns: [
      'Girar com o braço inteiro em vez do punho',
      'Carga alta demais',
      'Velocidade rápida (movimento deve ser lento)',
    ],
    musculos: ['Pronador redondo', 'Supinador', 'Bíceps braquial'],
  },
}
