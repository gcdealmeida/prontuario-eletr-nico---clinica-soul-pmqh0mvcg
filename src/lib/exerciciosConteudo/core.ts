import type { ConteudoExercicio } from './tipos'

/** Core / tronco — abdômen, lombar, glúteos, core. Chaves = nomes da coleção (migration 0023). */
export const CORE: Record<string, ConteudoExercicio> = {
  'Abdominal supra na máquina': {
    descricao:
      'Sentado na máquina com alças/encosto ajustados: flexione o tronco trazendo o esterno em direção à pelve (encurtar a distância esterno-púbis), aperte o abdômen 1 segundo e retorne controlado. Não é "colar queixo no peito": é rolar a coluna.',
    errosComuns: [
      'Puxar com os braços em vez de flexionar o tronco',
      'Amplitude parcial sem pausa na contração',
      'Assento mal ajustado (eixo do pivô longe do quadril)',
    ],
    musculos: ['Reto abdominal', 'Oblíquos'],
  },
  'Abdominal supra no solo (crunch)': {
    descricao:
      'Deitado, joelhos flexionados, mãos leves na cabeça (não puxando o pescoço). Eleve os ombros do chão encurtando a distância esterno-púbis, aperte o abdômen 1 segundo no topo e desça controlado sem relaxar totalmente.',
    errosComuns: [
      'Puxar a cabeça com as mãos',
      'Subir o tronco inteiro (vira flexão de quadril)',
      'Bater a cabeça no chão na descida',
    ],
    musculos: ['Reto abdominal'],
  },
  'Abdominal supra no solo com pernas elevadas (pernas em mesa)': {
    descricao:
      'Deitado, pernas elevadas em mesa (90°/90°), lombar pressionada contra o chão. Eleve os ombros do chão encurtando esterno-púbis e desça controlado sem deixar a lombar arquear.',
    errosComuns: [
      'Lombar descolando do chão (core não está controlando)',
      'Puxar o pescoço com as mãos',
      'Pernas caírem da posição de mesa',
    ],
    musculos: ['Reto abdominal', 'Oblíquos'],
  },
  'Abdominal solo com joelhos flexionados e braços cruzados': {
    descricao:
      'Deitado, joelhos flexionados, braços cruzados sobre o peito. Eleve os ombros encurtando esterno-púbis, aperte o abdômen e desça controlado. Cruzar os braços reduz a tentação de puxar o pescoço.',
    errosComuns: [
      'Subir o tronco inteiro em bloco',
      'Amplitude exagerada que arqueia a lombar na volta',
      'Prender a respiração (expire ao subir)',
    ],
    musculos: ['Reto abdominal'],
  },
  'Abdominal solo com joelhos flexionados e braços puxados de lado': {
    descricao:
      'Deitado, joelhos flexionados, um braço estendido ao lado do tronco. Eleve os ombros girando levemente o tronco em direção ao joelho oposto, aperte o oblíquo e desça controlado. Foco no oblíquo do lado que encurta.',
    errosComuns: [
      'Girar só a cabeça (o tronco é que roda)',
      'Puxar o pescoço',
      'Amplitude exagerada que tira o apoio lombar',
    ],
    musculos: ['Oblíquos', 'Reto abdominal'],
  },
  'Abdominal solo com braços para cima (reto superior)': {
    descricao:
      'Deitado, joelhos flexionados, braços estendidos apontando para o teto. Eleve os ombros encurtando esterno-púbis mantendo os braços apontando para cima e desça controlado. A posição dos braços impede o "puxar o pescoço".',
    errosComuns: [
      'Braços caindo na direção dos joelhos para gerar impulso',
      'Lombar descolando do chão',
      'Prender a respiração',
    ],
    musculos: ['Reto abdominal'],
  },
  'Abdominal remador com peso (crunch com anilha): anilha no peito, pés no chão': {
    descricao:
      'Deitado, joelhos flexionados, anilha abraçada sobre o peito. Eleve os ombros encurtando esterno-púbis, aperte o abdômen 1 segundo e desça controlado. A carga adiciona resistência com tronco rolando (não subindo em bloco).',
    errosComuns: [
      'Subir em bloco rígido (perde a flexão da coluna)',
      'Anilha puxando o tronco rápido demais na descida',
      'Pernas balançando',
    ],
    musculos: ['Reto abdominal'],
  },
  'Abdominal supra no solo com pernas em mesa e braços puxados de lado': {
    pernas_apoio: true,
    descricao:
      'Deitado, pernas em mesa, um braço estendido ao lado. Eleve os ombros girando o tronco em direção ao joelho oposto, aperte o oblíquo e desça controlado sem deixar a lombar arquear.',
    errosComuns: [
      'Lombar descolando (pernas em mesa exigem mais core)',
      'Girar só a cabeça',
      'Amplitude exagerada',
    ],
    musculos: ['Oblíquos', 'Reto abdominal'],
  },
  'Abdominal supra no solo com pernas em mesa e braços cruzados': {
    descricao:
      'Deitado, pernas em mesa, braços cruzados sobre o peito. Eleve os ombros encurtando esterno-púbis e desça controlado, mantendo a lombar pressionada no chão o tempo todo.',
    errosComuns: [
      'Lombar arqueando na descida',
      'Subir em bloco (sem rolar a coluna)',
      'Prender a respiração',
    ],
    musculos: ['Reto abdominal', 'Oblíquos'],
  },
  'Abdominal supra com joelhos flexionados e braços atrás da cabeça': {
    descricao:
      'Deitado, joelhos flexionados, mãos leves atrás da cabeça (sem puxar). Eleve os ombros encurtando esterno-púbis, aperte o abdômen no topo e desça controlado. Exige mais da musculatura do pescoço: mantenha o queixo neutro.',
    errosComuns: [
      'Puxar a cabeça para frente com as mãos',
      'Subir em bloco',
      'Prender a respiração',
    ],
    musculos: ['Reto abdominal'],
  },
  'Abdominal supra com joelhos flexionados e braços atrás da cabeça com pernas em mesa': {
    descricao:
      'Deitado, pernas em mesa, mãos leves atrás da cabeça. Eleve os ombros encurtando esterno-púbis, aperte o abdômen e desça controlado, com lombar pressionada contra o chão o tempo todo.',
    errosComuns: ['Lombar descolando do chão', 'Puxar o pescoço', 'Pernas caírem da mesa'],
    musculos: ['Reto abdominal', 'Oblíquos'],
  },
  'Abdominal supra com braços cruzados sobre o peito, pernas em mesa e lombar apoiada': {
    descricao:
      'Deitado, pernas em mesa, braços cruzados. Eleve os ombros encurtando esterno-púbis, aperte o abdômen no topo e desça controlado. Versão mais estável para quem tem desconforto lombar no crunch comum.',
    errosComuns: ['Lombar descolando', 'Subir em bloco', 'Amplitude parcial sem pausa'],
    musculos: ['Reto abdominal'],
  },
  'Abdominal remador com anilha, pés no chão, braços cruzados sobre o peito': {
    descricao:
      'Deitado, joelhos flexionados, anilha abraçada sobre o peito: eleve os ombros rolando a coluna, aperte o abdômen 1 segundo e desça controlado. Versão carregada do crunch.',
    errosComuns: ['Subir em bloco', 'Descida em queda livre', 'Pernas balançando'],
    musculos: ['Reto abdominal'],
  },
  'Abdominal remador com anilha, pés no chão, braços atrás da cabeça': {
    descricao:
      'Deitado, anilha abraçada (ou segura atrás da cabeça com cuidado): eleve os ombros rolando a coluna, aperte o abdômen e desça controlado. Mantenha o queixo neutro e expire ao subir.',
    errosComuns: [
      'Puxar o pescoço (segure a anilha sobre o peito)',
      'Subir em bloco',
      'Descida em queda livre',
    ],
    musculos: ['Reto abdominal'],
  },
  'Abdominal supra com braços puxados de lado, joelhos flexionados e lombar apoiada': {
    descricao:
      'Deitado, joelhos flexionados, um braço estendido ao lado. Eleve os ombros girando o tronco em direção ao joelho oposto, aperte o oblíquo e desça controlado com lombar apoiada.',
    errosComuns: ['Girar só a cabeça', 'Lombar arqueando na descida', 'Amplitude exagerada'],
    musculos: ['Oblíquos', 'Reto abdominal'],
  },
  'Abdominal supra com braços cruzados, pernas em mesa e lombar apoiada': {
    descricao:
      'Deitado, pernas em mesa, braços cruzados sobre o peito: eleve os ombros rolando a coluna, aperte o abdômen e desça controlado, sem deixar a lombar arquear.',
    errosComuns: ['Lombar descolando do chão', 'Subir em bloco', 'Prender a respiração'],
    musculos: ['Reto abdominal', 'Oblíquos'],
  },
  'Abdominal supra com braços puxados de lado, pernas em mesa, lombar apoiada': {
    descricao:
      'Deitado, pernas em mesa, um braço estendido ao lado. Eleve os ombros girando o tronco, aperte o oblíquo e desça controlado, com lombar pressionada no chão.',
    errosComuns: ['Lombar descolando', 'Girar só a cabeça', 'Amplitude exagerada'],
    musculos: ['Oblíquos', 'Reto abdominal'],
  },
  'Abdominal supra com braços atrás da cabeça, pernas em mesa, lombar apoiada': {
    descricao:
      'Deitado, pernas em mesa, mãos leves atrás da cabeça: eleve os ombros rolando a coluna, aperte o abdômen e desça controlado, sem deixar a lombar arquear.',
    errosComuns: ['Puxar o pescoço', 'Lombar descolando', 'Subir em bloco'],
    musculos: ['Reto abdominal', 'Oblíquos'],
  },
  'Abdominal remador com anilha, pés no chão, braços atrás da cabeça (variante mesa)': {
    descricao:
      'Deitado, pernas em mesa, anilha abraçada sobre o peito: eleve os ombros rolando a coluna, aperte o abdômen e desça controlado. Mantenha a lombar pressionada no chão.',
    errosComuns: ['Lombar descolando', 'Subir em bloco', 'Anilha puxando a descida'],
    musculos: ['Reto abdominal'],
  },
}
