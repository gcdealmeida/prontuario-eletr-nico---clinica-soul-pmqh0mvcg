import type { ConteudoExercicio } from './tipos'

/** Costas / dorsais — chaves = nomes da coleção (migration 0023). */
export const COSTAS: Record<string, ConteudoExercicio> = {
  'Barra fixa pegada pronada aberta (Pull-up)': {
    descricao:
      'Suspenso na barra com pegada pronada aberta (mais larga que os ombros). Deprime as escápulas (peito para cima) antes de puxar: suba até o queixo passar a barra com cotovelos apontando para baixo/lados e desça controlado até a extensão.',
    errosComuns: [
      'Puxar com os braços antes de estabilizar as escápulas',
      'Impulso de quadril (kipping) em treino de força',
      'Descida em queda livre',
      'Amplitude parcial (não estender no fundo)',
    ],
    musculos: ['Latíssimo do dorso', 'Redondo maior', 'Bíceps', 'Trapézio médio'],
  },
  'Barra fixa pegada supinada (Chin-up)': {
    descricao:
      'Pegada supinada (palmas para o rosto) na largura dos ombros. Deprime as escápulas, puxe até o queixo passar a barra com cotovelos apontando para baixo e desça controlado. A pegada supinada recruta mais bíceps e é a porta de entrada mais fácil para a primeira barra fixa.',
    errosComuns: [
      'Puxar só com os braços (sem depressão escapular antes)',
      'Queixo empurrado para cima e tronco arqueado',
      'Extensão parcial no fundo',
    ],
    musculos: ['Latíssimo do dorso', 'Bíceps braquial', 'Redondo maior'],
  },
  'Barra fixa pegada neutra': {
    descricao:
      'Pegada neutra (palmas se olhando) nas alças paralelas. Puxe até o queixo passar o nível das mãos e desça controlado. A rotação neutra é a mais confortável para ombros sensíveis e recruta bem dorsal e bíceps.',
    errosComuns: [
      'Impulso de tronco para vencer o ponto médio',
      'Amplitude parcial',
      'Escápulas soltas no fundo do movimento',
    ],
    musculos: ['Latíssimo do dorso', 'Bíceps', 'Trapézio médio', 'Romboides'],
  },
  'Puxada frontal aberta no pulley': {
    descricao:
      'Sentado com coxas travadas, barra larga com pegada pronada aberta. Puxe a barra até a clavícula superior com cotovelos apontando para baixo/lados e desça controlado até a extensão, deixando as escápulas subirem no final. Tronco quase vertical.',
    errosComuns: [
      'Inclinação exagerada do tronco para trás',
      'Puxar atrás da nuca (estressa ombro e pescoço)',
      'Impulso de tronco em cada repetição',
    ],
    musculos: ['Latíssimo do dorso', 'Redondo maior', 'Bíceps', 'Trapézio médio'],
  },
  'Puxada fechada com triângulo no pulley': {
    descricao:
      'Sentado, triângulo com pegada neutra. Puxe o cabo até o peito com cotovelos rentes ao tronco, aperte as escápulas no final e retorne controlado até a extensão completa. Tronco firme: só braços e escápulas se movem.',
    errosComuns: [
      'Tronco balançando para trás para puxar',
      'Amplitude parcial (não estender os braços no topo)',
      'Encolher os ombros durante a puxada',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Bíceps'],
  },
  'Puxada articulada unilateral na máquina': {
    descricao:
      'Assento e apoio ajustados: puxe a alça para baixo ao lado do tronco com cotovelo rente ao corpo, aperte o dorsal 1 segundo e retorne controlado até a extensão. Permite corrigir assimetrias entre os lados.',
    errosComuns: [
      'Eixo do pivô desalinhado do ombro',
      'Tronco rolando para o lado oposto para ajudar',
      'Amplitude parcial',
    ],
    musculos: ['Latíssimo do dorso', 'Redondo maior', 'Bíceps'],
  },
  'Pulldown com braços estendidos na polia alta (barra reta ou corda)': {
    descricao:
      'Em pé, tronco levemente inclinado, polia alta com braços quase estendidos e fixos. Puxe em arco até as coxas, apertando as escápulas no final, e retorne controlado. Os cotovelos não flexionam: o movimento acontece pelos ombros e escápulas.',
    errosComuns: [
      'Flexionar os cotovelos (vira puxada tradicional)',
      'Usar impulso do tronco',
      'Não apertar as escápulas no final',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio inferior', 'Romboides'],
  },
  'Remada curvada com barra pegada pronada': {
    descricao:
      'Tronco a ~45° (ou quase paralelo ao chão), lombar neutra, barra pendendo abaixo dos ombros. Puxe até o umbigo com cotovelos apontando para cima e para trás, aperte as escápulas e desça controlado. O tronco não muda de ângulo durante a série.',
    errosComuns: [
      'Torção do tronco para "levantar" a carga a cada repetição',
      'Lombar arredondada (perda da posição neutra)',
      'Puxar para o peito com cotovelos abertos (vira puxada de ombro)',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior', 'Bíceps'],
  },
  'Remada curvada com barra pegada supinada (Yates Row)': {
    descricao:
      'Tronco a ~45°, pegada supinada na largura dos ombros. Puxe até o umbigo com cotovelos rentes ao corpo e desça controlado. O tronco mais erguido e a pegada supinada recrutam mais bíceps e são mais amigáveis à lombar.',
    errosComuns: [
      'Tronco "andando" para cima durante a série',
      'Cotovelos abrindo',
      'Lombar arredondada',
    ],
    musculos: ['Latíssimo do dorso', 'Bíceps', 'Trapézio médio'],
  },
  'Remada serrote unilateral com halter': {
    descricao:
      'Mão e joelho opostos apoiados no banco, tronco quase paralelo ao chão, halter pendendo verticalmente. Puxe o halter até a lateral do tronco (cotovelo rente), aperte a escápula e desça controlado alongando bem no fundo.',
    errosComuns: [
      'Torção do tronco para levantar o halter',
      'Puxar com o braço sem mover a escápula',
      'Apoio instável (quadril alto, lombar desalinhada)',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Bíceps'],
  },
  'Remada cavalinho com barra em T': {
    descricao:
      'Peito apoiado no apoio da máquina T (ou posição curvada estável): puxe as alças até o tronco com cotovelos a ~45° do corpo, apertando as escápulas, e retorne controlado. O apoio do peito protege a lombar.',
    errosComuns: [
      'Peito descolando do apoio para gerar impulso',
      'Amplitude parcial',
      'Pegada muito estreita forçando os punhos',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior'],
  },
  'Remada baixa no cabo com triângulo': {
    descricao:
      'Sentado, pés apoiados, joelhos levemente flexionados. Puxe o cabo até o abdômen com cotovelos rentes ao tronco, aperte as escápulas 1 segundo e retorne controlado até a extensão completa.',
    errosComuns: [
      'Balanço de tronco (remada "de degrau")',
      'Amplitude parcial no alongamento',
      'Encolher os ombros',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Bíceps'],
  },
  'Remada aberta na polia baixa com barra romana': {
    descricao:
      'Remada baixa com barra romana e pegada pronada aberta: puxe até o esterno/baixo peito com cotovelos abertos a ~60–75°, apertando as escápulas. Privilegia trapézio médio, romboides e deltoide posterior em vez do dorsal.',
    errosComuns: [
      'Tronco balançando',
      'Puxar para o abdômen com cotovelos fechados (muda o alvo)',
      'Amplitude parcial',
    ],
    musculos: ['Trapézio médio', 'Romboides', 'Deltoide posterior', 'Bíceps'],
  },
  'Remada apoiada no peito em banco inclinado com halteres': {
    descricao:
      'De bruços no banco inclinado a 45°, halteres pendendo, pés bem apoiados. Puxe os halteres até a lateral do tronco (cotovelos rentes ou levemente abertos), aperte as escápulas e desça controlado. O peito apoiado protege a lombar.',
    errosComuns: [
      'Levantar o peito do banco para impulsionar',
      'Amplitude parcial no fundo',
      'Carga alta demais, perdendo o contato escapular',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior'],
  },
  'Remada articulada baixa em máquina': {
    descricao:
      'Peito apoiado no encosto, alças na linha dos ombros: puxe para trás ao lado do tronco com cotovelos rentes, aperte as escápulas 1 segundo e retorne controlado. A máquina estabiliza o tronco.',
    errosComuns: [
      'Alças fora da linha dos ombros (ajuste do assento)',
      'Peito descolando do apoio',
      'Amplitude parcial',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides'],
  },
  'Remada invertida na barra fixa (Australian Pull-up)': {
    descricao:
      'Barra na altura do quadril, corpo em linha reta pendendo com calcanhares no chão. Puxe o peito até a barra com cotovelos abertos e desça controlado. Pés elevados em step tornam o movimento mais difícil. Ótima progressão para a primeira barra fixa.',
    errosComuns: [
      'Quadril caído (core relaxado)',
      'Puxar só a cabeça (queixo empurrado para frente)',
      'Amplitude parcial',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior'],
  },
}
