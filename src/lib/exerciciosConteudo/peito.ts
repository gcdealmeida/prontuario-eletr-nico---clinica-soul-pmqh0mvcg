import type { ConteudoExercicio } from './tipos'

/** Peito — chaves = nomes da coleção (migration 0023). */
export const PEITO: Record<string, ConteudoExercicio> = {
  'Supino reto com barra': {
    descricao:
      'Deite no banco com olhos alinhados à barra, pés firmes no chão e escápulas retraídas. Pegada um pouco mais aberta que os ombros: desça controlado até o meio do peito, cotovelos a ~45° do tronco, e empurre para cima sem travar violentamente os cotovelos, mantendo glúteos e ombros apoiados.',
    errosComuns: [
      'Tirar glúteos/ombros do banco ao empurrar (pontuar o banco)',
      'Descer a barra muito alto, perto do pescoço',
      'Cotovelos totalmente abertos a 90° do tronco, sobrecarregando o ombro',
      'Quicar a barra no peito para ganhar impulso',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino reto com halteres': {
    descricao:
      'Deitado no banco, halteres acima do peito, escápulas retraídas e deprimidas. Desça os halteres até sentir alongamento do peitoral, cotovelos a ~45° do tronco, e empurre em arco suave até os halteres quase se tocarem acima do peito, sem bater um no outro.',
    errosComuns: [
      'Punhos quebrando para trás (extensão excessiva do punho)',
      'Descer os halteres abaixo do nível confortável do ombro',
      'Empurrar os halteres um contra o outro no topo',
      'Perder o apoio escapular durante a série',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino inclinado a 30° com halteres': {
    descricao:
      'Banco a 30°, halteres na linha do peito com escápulas retraídas. Desça controlado até a porção superior do peitoral, cotovelos levemente à frente dos ombros, e empurre descrevendo um arco suave. A inclinação baixa privilegia a porção clavicular sem sobrecarregar o ombro.',
    errosComuns: [
      'Inclinar demais o banco (>45°), virando exercício de ombro',
      'Halteres convergindo à frente da cabeça na subida',
      'Descer além da mobilidade confortável do ombro',
    ],
    musculos: ['Peitoral maior (porção clavicular)', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino inclinado a 45° com barra': {
    descricao:
      'Banco a 45°, pegada pouco mais aberta que os ombros. Desça até o terço superior do peitoral (logo abaixo da clavícula), cotovelos controlados, e empurre sem travar agressivamente. Pés apoiados, tronco inteiro em contato com o banco durante a série.',
    errosComuns: [
      'Descer a barra no pescoço ou muito abaixo da clavícula',
      'Ombros subindo em direção às orelhas no esforço',
      'Levantar o tronco do banco ao empurrar',
    ],
    musculos: ['Peitoral maior (porção clavicular)', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino declinado com barra': {
    descricao:
      'Banco em declínio suave (–15° a –20°), barra alinhada à parte inferior do peitoral. Desça controlado até o esterno, cotovelos a ~45° do tronco, e empurre até estender os cotovelos. O declínio encurta o arco e privilegia o peitoral inferior.',
    errosComuns: [
      'Declínio muito acentuado (carga vai para tríceps e ombro)',
      'Quadril deslizando para baixo no banco',
      'Descer a barra no abdômen',
    ],
    musculos: ['Peitoral maior (porção esternal)', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Supino declinado com halteres': {
    descricao:
      'Mesma posição do declinado com barra, um halter em cada mão: desça até a linha do esterno com cotovelos a ~45° do tronco e empurre em arco até os halteres alinhados sobre a porção inferior do peito.',
    errosComuns: [
      'Pés mal travados no gancho do banco',
      'Cotovelos muito abertos na descida',
      'Ombros rolando para frente no final da subida',
    ],
    musculos: ['Peitoral maior (porção esternal)', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Crucifixo reto com halteres': {
    descricao:
      'Deitado no banco reto, halteres acima do peito com cotovelos levemente flexionados e FIXOS. Abra os braços em arco amplo e controlado até alongar o peitoral e volte "abraçando" o peito. O cotovelo não flexiona e estende durante o movimento.',
    errosComuns: [
      'Flexionar/estender o cotovelo, transformando em supino',
      'Descer além do nível confortável do ombro',
      'Carga excessiva que impede o arco controlado',
    ],
    musculos: ['Peitoral maior (esternal)', 'Deltoide anterior'],
  },
  'Crucifixo inclinado com halteres': {
    descricao:
      'Banco a 30–45°, mesmo padrão do crucifixo reto: cotovelos levemente flexionados e fixos, abertura ampla até alongar a porção superior do peitoral e retorno apertando o peito, sem passar muito atrás da linha dos ombros.',
    errosComuns: [
      'Usar a carga do crucifixo reto (a inclinação pede menos peso)',
      'Cabeça saindo do banco e pescoço fletido',
      'Cotovelos muito flexionados, virando supino',
    ],
    musculos: ['Peitoral maior (porção clavicular)', 'Deltoide anterior'],
  },
  'Floor Press com halteres (no chão)': {
    descricao:
      'Deitado no chão com joelhos flexionados, halteres acima do peito. Desça controlado até a parte posterior do braço encostar no chão (arco mais curto que no supino) e empurre para cima. Protege o ombro de amplitudes extremas.',
    errosComuns: [
      'Cotovelo batendo com impacto no chão',
      'Arquear demais a lombar para ganhar amplitude',
      'Punhos quebrando para trás',
    ],
    musculos: ['Peitoral maior', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Flexão de braço tradicional (Push-up)': {
    descricao:
      'Em prancha, mãos um pouco mais abertas que os ombros na linha do peito. Abdômen e glúteos contraídos mantêm o corpo em linha reta: desça até o peito chegar a 3–5 cm do chão, cotovelos a ~45° do tronco, e empurre o chão de volta.',
    errosComuns: [
      'Quadril caído ou empinado (core relaxado)',
      'Cabeça descendo antes do tronco',
      'Amplitude parcial (não descer ou não estender no topo)',
      'Cotovelos totalmente abertos a 90° do tronco',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps', 'Core'],
  },
  'Flexão de braço com pés elevados (declinada)': {
    descricao:
      'Flexão tradicional com os pés apoiados em step ou banco: quanto mais alto o apoio, maior a exigência do peitoral superior e dos deltoides. Core firme para o corpo não desabar; ombros na vertical sobre as mãos na descida.',
    errosComuns: [
      'Apoio dos pés alto demais para o nível atual',
      'Hiperextensão lombar pelo core relaxado',
      'Descer a cabeça primeiro',
    ],
    musculos: ['Peitoral superior', 'Deltoide anterior', 'Tríceps', 'Core'],
  },
  'Flexão de braço diamante (foco em tríceps e miolo do peito)': {
    descricao:
      'Em prancha, triângulo formado por polegares e indicadores sob o esterno. Desça com os cotovelos rentes ao tronco até o peito chegar perto das mãos e empurre de volta. É uma flexão de tríceps: controle importa mais que velocidade.',
    errosComuns: [
      'Cotovelos abrindo para os lados',
      'Quadril elevado (tensão insuficiente do core)',
      'Amplitude parcial no topo',
    ],
    musculos: ['Tríceps braquial', 'Peitoral maior (esternal)', 'Deltoide anterior'],
  },
  'Supino convergente articulado na máquina': {
    descricao:
      'Ajuste o assento para as alças ficarem na linha do meio do peito e os punhos alinhados com os cotovelos. Empurre descrevendo um arco convergente (mãos se aproximam no topo), sem travar violentamente os cotovelos, e retorne controlado.',
    errosComuns: [
      'Assento mal ajustado (alças fora da linha do peito)',
      'Ombros descolando do encosto',
      'Negativa solta, sem controle',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino inclinado em máquina articulada': {
    descricao:
      'Máquina convergente com encosto a 30–45° e alças na linha do peitoral superior. Empurre com arco convergente controlado e volte devagar, mantendo escápulas apoiadas no encosto o tempo todo.',
    errosComuns: [
      'Encosto mal posicionado, forçando o ombro no início do arco',
      'Amplitude excessiva no alongamento',
      'Empurrar com o quadril descolado do assento',
    ],
    musculos: ['Peitoral maior (clavicular)', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Peck Deck / Voador peitoral na máquina': {
    descricao:
      'Ajuste o assento para alças na altura do peito e cotovelos no mesmo plano. Com cotovelos levemente flexionados e fixos, junte as alças à frente do peito como quem abraça um tronco e retorne controlado, sem deixar o peso bater.',
    errosComuns: [
      'Alças ajustadas muito abaixo ou acima da linha do peito',
      'Usar os ombros para puxar (elevação escapular)',
      'Máquina puxando rapidamente no retorno',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior'],
  },
  'Crossover polia alta (fase inferior)': {
    descricao:
      'Polias na altura mais alta, um cabo em cada mão, um pé à frente para estabilidade. Cotovelos levemente flexionados e fixos: puxe os cabos para baixo e à frente do abdômen, cruzando levemente as mãos se confortável, e retorne controlado.',
    errosComuns: [
      'Flexionar os cotovelos durante o movimento (vira tríceps)',
      'Inclinar para frente demais usando o peso corporal',
      'Retorno sem controle da negativa',
    ],
    musculos: ['Peitoral maior (esternal)', 'Deltoide anterior'],
  },
  'Crossover polia média (fase medial)': {
    descricao:
      'Polias na altura do peito: puxe os cabos em linha reta à frente do tronco, juntando as mãos na altura do esterno, cotovelos levemente flexionados e fixos. Retorne controlado até um alongamento confortável.',
    errosComuns: [
      'Trajetória para cima ou para baixo (perde a linha do peitoral médio)',
      'Tronco balançando para gerar impulso',
      'Cotovelo quebrando e estendendo durante o arco',
    ],
    musculos: ['Peitoral maior (esternal)', 'Deltoide anterior'],
  },
  'Crossover polia baixa (fase clavicular)': {
    descricao:
      'Polias na altura mais baixa: puxe os cabos para cima e à frente, juntando as mãos na altura do peito/clavícula, cotovelos levemente flexionados e fixos. Retorne controlado. Esse ângulo privilegia a porção superior do peitoral.',
    errosComuns: [
      'Encolher os ombros durante a subida',
      'Trajetória desalinhada, mãos terminando acima da cabeça',
      'Usar impulso do tronco',
    ],
    musculos: ['Peitoral maior (clavicular)', 'Deltoide anterior'],
  },
  'Mergulho nas barras paralelas (Dips) livre': {
    descricao:
      'Apoiado nas paralelas com braços estendidos, ombros afastados das orelhas e leve flexão de tronco à frente. Desça controlado até o ombro chegar à altura do cotovelo e empurre de volta, peito aberto e core firme.',
    errosComuns: [
      'Descer abaixo do conforto do ombro (dor anterior)',
      'Ombros subindo em direção às orelhas',
      'Balançar as pernas para gerar impulso',
    ],
    musculos: ['Peitoral inferior', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Mergulho nas paralelas com sobrecarga (cinto/anilha)': {
    descricao:
      'Dip livre com carga presa ao cinto ou pinçada entre os pés. Progrida só depois de dominar 10–12 repetições técnicas do peso corporal. Mesma qualidade de movimento: descida controlada, sem ultrapassar o conforto do ombro.',
    errosComuns: [
      'Adicionar carga antes de dominar o peso corporal',
      'Carga balançando como pêndulo',
      'Descida mais rápida por causa do peso extra',
    ],
    musculos: ['Peitoral inferior', 'Tríceps braquial', 'Deltoide anterior'],
  },
}
