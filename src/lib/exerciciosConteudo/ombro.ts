import type { ConteudoExercicio } from './tipos'

/** Ombros — chaves = nomes da coleção (migration 0023). */
export const OMBRO: Record<string, ConteudoExercicio> = {
  'Desenvolvimento militar com barra em pé (Overhead Press)': {
    descricao:
      'Barra na clavícula, pés na largura do quadril, core e glúteos contraídos. Empurre a barra verticalmente até acima da cabeça, com a cabeça "passando por baixo" no final (barra alinhada sobre o meio do crânio) e retorne à clavícula. Sem impulso das pernas: press de braços com tronco rígido.',
    errosComuns: [
      'Hiperextensão lombar para gerar impulso (press não é thrust)',
      'Barra terminando à frente da linha do corpo',
      'Cotovelos totalmente abertos para os lados na saída',
    ],
    musculos: ['Deltoide', 'Tríceps', 'Trapézio superior', 'Core'],
  },
  'Desenvolvimento com halteres sentado': {
    descricao:
      'Sentado com encosto, halteres na altura das orelhas e punhos firmes. Empurre para cima com leve arco convergente (halteres se aproximam no topo, sem bater) e retorne controlado. Lombar apoiada e costelas "para baixo".',
    errosComuns: [
      'Arquear a lombar para sair da posição',
      'Halteres descendo abaixo da linha das orelhas',
      'Bater os halteres com força no topo',
    ],
    musculos: ['Deltoide', 'Tríceps', 'Trapézio superior'],
  },
  'Desenvolvimento Arnold com halteres': {
    descricao:
      'Sentado, halteres à frente dos ombros com palmas voltadas para o rosto. Ao subir, gire os punhos até as palmas ficarem para frente no topo; inverta a rotação na descida. O arco combinado cobre as três porções do deltoide — use carga menor que no desenvolvimento comum.',
    errosComuns: [
      'Rotação apressada e sem controle',
      'Carga alta demais para controlar a rotação',
      'Encolher os ombros em direção às orelhas',
    ],
    musculos: ['Deltoide (todas as porções)', 'Tríceps', 'Trapézio superior'],
  },
  'Desenvolvimento em máquina articulada': {
    descricao:
      'Assento ajustado para as alças na altura das orelhas/ombros, punhos alinhados. Empurre para cima com arco controlado e retorne devagar, lombar apoiada no encosto e core firme.',
    errosComuns: [
      'Assento muito baixo ou alto (eixo das alças desalinhado do ombro)',
      'Quadril descolando do assento ao empurrar',
      'Soltar rápido na volta',
    ],
    musculos: ['Deltoide', 'Tríceps', 'Trapézio superior'],
  },
  'Elevação lateral com halteres em pé': {
    descricao:
      'Em pé, halteres ao lado do corpo com leve flexão de cotovelo fixa. Eleve os braços lateralmente até a altura dos ombros (quase em "T") com o mínimo de impulso e desça controlado em 2–3 segundos. Os cotovelos sobem primeiro.',
    errosComuns: [
      'Impulso do tronco para levantar a carga',
      'Subir acima da linha dos ombros (pega trapézio, não deltoide)',
      'Cotovelo flexionando e estendendo durante o movimento',
      'Descida em queda livre',
    ],
    musculos: ['Deltoide lateral', 'Supraespinhal'],
  },
  'Elevação lateral sentado': {
    descricao:
      'Sentado (com ou sem encosto), sem impulso das pernas: eleve os halteres lateralmente até a altura dos ombros com cotovelos quase fixos e desça controlado. A posição isola o deltoide lateral e expõe trapaças de tronco.',
    errosComuns: [
      'Balançar o tronco (use menos carga que em pé)',
      'Subir os ombros em vez dos braços',
      'Amplitude acima dos ombros',
    ],
    musculos: ['Deltoide lateral', 'Supraespinhal'],
  },
  'Elevação lateral unilateral na polia baixa': {
    descricao:
      'Em pé de lado para a polia, cabo na mão do braço mais distante. Eleve o braço lateralmente até a altura do ombro, cotovelo levemente flexionado e fixo, e desça controlado. A polia mantém tensão constante desde o início do movimento.',
    errosComuns: [
      'Inclinar o tronco para o lado oposto para ajudar',
      'Cotovelo travado reto (tensão desnecessária na articulação)',
      'Amplitude parcial no topo',
    ],
    musculos: ['Deltoide lateral', 'Supraespinhal'],
  },
  'Elevação frontal com barra pronada': {
    descricao:
      'Em pé, barra com pegada pronada na largura do quadril, braços à frente do corpo. Eleve a barra até a altura dos ombros com cotovelos quase estendidos e desça controlado. Use carga menor que no desenvolvimento: o movimento é monolateral (plano sagital).',
    errosComuns: [
      'Impulso lombar (hiperextensão) no ponto difícil',
      'Elevação acima da linha dos ombros',
      'Pegada muito aberta puxando o ombro para frente',
    ],
    musculos: ['Deltoide anterior', 'Peitoral superior'],
  },
  'Elevação frontal com halteres neutra': {
    descricao:
      'Em pé, halteres com pegada neutra (palmas se olhando) à frente das coxas. Eleve os braços até a altura dos ombros e desça controlado. A rotação neutra é confortável para ombros sensíveis.',
    errosComuns: [
      'Subir acima da linha dos ombros',
      'Impulso do tronco',
      'Cotovelo totalmente travado',
    ],
    musculos: ['Deltoide anterior', 'Peitoral superior'],
  },
  'Elevação frontal no cabo com corda': {
    descricao:
      'Polia baixa atrás do corpo, corda ou barra na mão. Eleve o braço à frente até a altura do ombro e desça controlado. A tensão é constante em toda a amplitude — controle bem a negativa em 2–3 segundos.',
    errosComuns: [
      'Polia puxando o braço rapidamente no retorno',
      'Inclinar o tronco para trás para ajudar na subida',
      'Amplitude acima dos ombros',
    ],
    musculos: ['Deltoide anterior', 'Peitoral superior'],
  },
  'Crucifixo invertido com halteres em banco inclinado': {
    descricao:
      'De bruços no banco inclinado a 30–45°, halteres pendendo abaixo dos ombros. Com cotovelos levemente flexionados e fixos, eleve os braços para os lados até a linha dos ombros, apertando as escápulas, e desça controlado.',
    errosComuns: [
      'Carga alta demais (o deltoide posterior é pequeno)',
      'Levantar cabeça e peito do banco para gerar impulso',
      'Flexionar os cotovelos para puxar (vira remada)',
    ],
    musculos: ['Deltoide posterior', 'Romboides', 'Trapézio médio', 'Infraespinhal'],
  },
  'Voador invertido na máquina (Reverse Peck Deck)': {
    descricao:
      'Sentado de frente para o encosto do Peck Deck, peito apoiado, alças na linha dos ombros. Abra os braços para trás até a linha dos ombros, apertando as escápulas, e retorne controlado.',
    errosComuns: [
      'Peito descolado do encosto (perde o isolamento)',
      'Braços indo muito atrás do corpo',
      'Carga alta demais, obrigando a encolher os ombros',
    ],
    musculos: ['Deltoide posterior', 'Romboides', 'Trapézio médio'],
  },
  'Remada alta com pegada aberta na barra ou polia': {
    descricao:
      'Barra ou cabo à frente do quadril, pegada aberta (mais larga que os ombros). Puxe verticalmente até a altura do esterno/clavícula, cotovelos apontando para cima e para os lados, e desça controlado. A pegada aberta é mais amigável ao ombro.',
    errosComuns: [
      'Pegada fechada com cotovelos acima dos punhos (impingimento)',
      'Puxar até o queixo',
      'Impulso lombar para vencer pontos difíceis',
    ],
    musculos: ['Deltoide lateral', 'Trapézio superior', 'Elevador da escápula'],
  },
  'Encolhimento de ombros com barra pela frente': {
    descricao:
      'Barra à frente das coxas, pegada na largura dos ombros, braços como "ganchos". Eleve os ombros verticalmente em direção às orelhas, pause 1 segundo no topo e desça controlado. O movimento acontece só pelas escápulas.',
    errosComuns: [
      'Rolar os ombros em círculos (nada adiciona e estressa o pescoço)',
      'Flexionar os cotovelos para ajudar',
      'Amplitude parcial sem pausa no topo',
    ],
    musculos: ['Trapézio superior', 'Elevador da escápula', 'Romboides'],
  },
  'Encolhimento com halteres ao lado do corpo': {
    descricao:
      'Halteres ao lado do corpo, braços passivos: eleve os ombros verticalmente em direção às orelhas, pause 1 segundo no topo e desça devagar. A pegada lateral é mais confortável para o ombro que a barra pela frente.',
    errosComuns: [
      'Rotação dos ombros em vez de elevação reta',
      'Flexionar os cotovelos',
      'Usar impulso para subir',
    ],
    musculos: ['Trapézio superior', 'Elevador da escápula', 'Romboides'],
  },
  'Face Pull na polia média/alta com corda': {
    descricao:
      'Polia alta/média com corda, pegada neutra (polegares para trás). Puxe a corda na direção do rosto abrindo os cotovelos para os lados, terminando com as mãos ao lado das orelhas e escápulas retraídas. Um dos melhores exercícios de saúde do ombro.',
    errosComuns: [
      'Carga pesada demais, virando remada de tronco',
      'Cotovelos caindo (vira puxada para baixo)',
      'Hiperextensão lombar para gerar força',
    ],
    musculos: ['Deltoide posterior', 'Infraespinhal', 'Redondo menor', 'Romboides'],
  },
}
