import type { ConteudoExercicio } from './tipos'

/** Membros superiores: peito, ombros, costas, braços. Chaves = nomes da coleção (migration 0023). */
export const SUPERIORES: Record<string, ConteudoExercicio> = {
  'Supino reto com barra': {
    descricao:
      'Deite-se no banco com os olhos alinhados à barra, pés firmes no chão e escápulas retraídas. Segure a barra um pouco mais aberta que os ombros, tire-a do suporte e desça controlado até o meio do peito, com cotovelos a cerca de 45° do tronco. Empurre a barra para cima sem travar violentamente os cotovelos, mantendo o peito aberto e os glúteos em contato com o banco.',
    errosComuns: [
      'Tirar os glúteos ou ombros do banco ao empurrar (pontuar o banco)',
      'Descer a barra muito alto, perto do pescoço',
      'Deixar os cotovelos abrirem a 90° do tronco, sobrecarregando o ombro',
      'Quicar a barra no peito para ganhar impulso',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino reto com halteres': {
    descricao:
      'Deite-se no banco com um halter em cada mão e suba-os alinhados ao peito. Escápulas retraídas e deprimidas, pés firmes. Desça os halteres em linha levemente diagonal até sentir alongamento do peitoral, cotovelos a ~45° do tronco, e empurre até os halteres quase se tocarem acima do peito, sem bater um no outro.',
    errosComuns: [
      'Deixar os punhos quebrarem para trás (extensão excessiva do punho)',
      'Descer os halteres abaixo do nível de conforto do ombro',
      'Empurrar os halteres um contra o outro no topo',
      'Perder o apoio escapular durante o movimento',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino inclinado a 30° com halteres': {
    descricao:
      'Ajuste o banco a 30° e deite-se com os halteres na altura do peito. Retraia as escápulas e desça controlado até a porção superior do peitoral, cotovelos levemente à frente da linha dos ombros. Empurre para cima e levemente para trás, descrevendo um arco suave. A inclinação baixa (30°) privilegia a porção clavicular do peitoral sem sobrecarregar o ombro.',
    errosComuns: [
      'Inclinar demais o banco (>45°), transformando em exercício de ombro',
      'Subir os halteres convergindo à frente da cabeça',
      'Halteres descendo até estourar a mobilidade do ombro',
    ],
    musculos: ['Peitoral maior (porção clavicular)', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino inclinado a 45° com barra': {
    descricao:
      'Banco a 45°, barra segura pouco mais aberta que os ombros. Desça até o terço superior do peitoral (logo abaixo da clavícula), cotovelos controlados, e empurre para cima sem travar agressivamente. Mantenha os pés apoiados e o tronco inteiro em contato com o banco durante toda a série.',
    errosComuns: [
      'Descer a barra no pescoço ou muito abaixo da clavícula',
      'Elevação dos ombros em direção às orelhas no esforço',
      'Levantar o tronco do banco ao empurrar',
    ],
    musculos: ['Peitoral maior (porção clavicular)', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino declinado com barra': {
    descricao:
      'Banco em declínio suave (–15° a –20°), barra alinhada à parte inferior do peitoral. Desça controlado até o esterno, cotovelos a ~45° do tronco, e empurre até estender os cotovelos. O declínio encurta o arco do movimento e privilegia o peitoral inferior com boa transferência para o tríceps.',
    errosComuns: [
      'Declínio muito acentuado, direcionando a carga para o tríceps e ombro',
      'Deixar o quadril deslizar para baixo no banco',
      'Descer a barra no abdômen',
    ],
    musculos: ['Peitoral maior (porção esternal)', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Supino declinado com halteres': {
    descricao:
      'Mesma posição do declinado com barra, um halter em cada mão. Desça os halteres até a linha do esterno, cotovelos a ~45° do tronco, e empurre descrevendo um arco até os halteres ficarem alinhados sobre a porção inferior do peito.',
    errosComuns: [
      'Perder o apoio dos pés (o gancho do banco deve travá-los)',
      'Descer os halteres com cotovelos muito abertos',
      'Permitir que os ombros rolem para frente no final da subida',
    ],
    musculos: ['Peitoral maior (porção esternal)', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Crucifixo reto com halteres': {
    descricao:
      'Deitado no banco reto, halteres acima do peito com cotovelos levemente flexionados (ângulo fixo). Abra os braços descrevendo um arco amplo e controlado até sentir o alongamento do peitoral, e volte apertando o peito como se abraçasse uma árvore. O cotovelo NÃO flexiona e estende durante o movimento.',
    errosComuns: [
      'Flexionar e estender o cotovelo, transformando em supino',
      'Descer além do nível confortável do ombro',
      'Carga excessiva que impede o arco controlado',
    ],
    musculos: ['Peitoral maior (esternal)', 'Deltoide anterior'],
  },
  'Crucifixo inclinado com halteres': {
    descricao:
      'Banco a 30–45°, mesmo padrão do crucifixo reto: cotovelos levemente flexionados e fixos, abertura ampla até alongar a porção superior do peitoral e retorno apertando o peito. Desça até a linha dos ombros, sem passar muito atrás do corpo.',
    errosComuns: [
      'Usar carga de crucifixo reto (a inclinação pede menos peso)',
      'Deixar a cabeça sair do banco e o pescoço fletir',
      'Cotovelos muito flexionados, virando supino',
    ],
    musculos: ['Peitoral maior (porção clavicular)', 'Deltoide anterior'],
  },
  'Floor Press com halteres (no chão)': {
    descricao:
      'Deite-se no chão com os joelhos flexionados e os pés apoiados, halteres acima do peito. Desça controlado até a parte posterior do braço encostar no chão (o arco é mais curto que no supino) e empurre para cima. O chão protege o ombro de amplitudes extremas e é ótimo para quem sente dor no final da descida do supino.',
    errosComuns: [
      'Deixar o cotovelo bater com impacto no chão',
      'Arquear demais a lombar para ganhar amplitude',
      'Punhos quebrando para trás',
    ],
    musculos: ['Peitoral maior', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Flexão de braço tradicional (Push-up)': {
    descricao:
      'Em prancha, mãos um pouco mais abertas que os ombros na linha do peito. Contraia abdômen e glúteos para manter o corpo em linha reta e desça até o peito chegar a 3–5 cm do chão, cotovelos a ~45° do tronco. Empurre o chão de volta, mantendo escápulas estáveis.',
    errosComuns: [
      'Quadril caído (falta de ativação do core) ou empinado',
      'Cabeça descendo antes do tronco (empurrar o queixo)',
      'Amplitude parcial: não descer o suficiente ou não estender no topo',
      'Cotovelos totalmente abertos a 90° do tronco',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps', 'Core'],
  },
  'Flexão de braço com pés elevados (declinada)': {
    descricao:
      'Mesma execução da flexão tradicional com os pés apoiados em um step ou banco: quanto mais alto o apoio, maior a exigência do peitoral superior e dos deltoides. Mantenha o core firme para o corpo não desabar; a linha dos ombros deve ficar na vertical sobre as mãos na descida.',
    errosComuns: [
      'Apoio dos pés muito alto para o nível atual (perde o alinhamento)',
      'Hiperextensão lombar pelo core relaxado',
      'Descer a cabeça primeiro',
    ],
    musculos: ['Peitoral superior', 'Deltoide anterior', 'Tríceps', 'Core'],
  },
  'Flexão de braço diamante (foco em tríceps e miolo do peito)': {
    descricao:
      'Em prancha, forme um triângulo com polegares e indicadores sob o esterno. Desça mantendo os cotovelos rentes ao tronco até o peito chegar perto das mãos e empurre de volta. É uma flexão de tríceps: o controle do tronco importa mais que a velocidade.',
    errosComuns: [
      'Cotovelos abrindo para os lados',
      'Quadril elevado pela tensão insuficiente do core',
      'Amplitude parcial no topo',
    ],
    musculos: ['Tríceps braquial', 'Peitoral maior (porção esternal)', 'Deltoide anterior'],
  },
  'Supino convergente articulado na máquina': {
    descricao:
      'Ajuste o assento para que as alças fiquem na linha do meio do peito e os punhos alinhados com os cotovelos. Empurre as alças descrevendo um arco convergente (as mãos se aproximam no topo), sem travar violentamente os cotovelos, e retorne controlado.',
    errosComuns: [
      'Assento mal ajustado (alças abaixo ou acima da linha do peito)',
      'Levantar os ombros do encosto',
      'Soltar as alças rapidamente na volta (negativa sem controle)',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Supino inclinado em máquina articulada': {
    descricao:
      'Máquina convergente ajustada ao ângulo inclinado: encosto a 30–45°, alças na linha do peitoral superior. Empurre com arco convergente controlado e volte devagar, mantendo escápulas apoiadas no encosto o tempo todo.',
    errosComuns: [
      'Encosto mal posicionado, forçando o ombro no início do arco',
      'Amplitude excessiva no alongamento',
      'Empurrar com o quadril descolado do assento',
    ],
    musculos: ['Peitoral maior (clavicular)', 'Deltoide anterior', 'Tríceps braquial'],
  },
  'Peck Deck / Voador peitoral na máquina': {
    descricao:
      'Ajuste o assento para que as alças fiquem na altura do peito e os cotovelos no mesmo plano. Com cotovelos levemente flexionados e fixos, junte as alças à frente do peito imaginando abraçar um tronco, e retorne controlado até sentir alongamento, sem deixar o peso bater.',
    errosComuns: [
      'Alças ajustadas muito abaixo ou acima da linha do peito',
      'Usar os ombros para puxar (elevação escapular)',
      'Deixar a máquina puxar rapidamente no retorno',
    ],
    musculos: ['Peitoral maior', 'Deltoide anterior'],
  },
  'Crossover polia alta (fase inferior)': {
    descricao:
      'Polias na altura mais alta, um cabo em cada mão, um pé à frente para estabilidade. Com cotovelos levemente flexionados e fixos, puxe os cabos para baixo e à frente do abdômen, cruzando levemente as mãos se confortável, e retorne controlado. Foque em “apertar” o peitoral inferior no final.',
    errosComuns: [
      'Flexionar os cotovelos durante o movimento (vira tríceps)',
      'Usar o peso corporal para puxar (inclinar para frente demais)',
      'Retorno solto, sem controle da negativa',
    ],
    musculos: ['Peitoral maior (esternal)', 'Deltoide anterior'],
  },
  'Crossover polia média (fase medial)': {
    descricao:
      'Polias na altura do peito: puxe os cabos em linha reta à frente do tronco, juntando as mãos à frente do esterno, cotovelos levemente flexionados e fixos. Retorne controlado até um alongamento confortável do peitoral.',
    errosComuns: [
      'Trajetória para cima ou para baixo (perde a linha do peitoral médio)',
      'Tronco balançando para gerar impulso',
      'Cotovelo quebrando e estendendo durante o arco',
    ],
    musculos: ['Peitoral maior (esternal)', 'Deltoide anterior'],
  },
  'Crossover polia baixa (fase clavicular)': {
    descricao:
      'Polias na altura mais baixa: pegue os cabos e puxe para cima e à frente, juntando as mãos na altura do peito/clavícula, cotovelos levemente flexionados e fixos. Retorne controlado. Esse ângulo privilegia a porção clavicular (superior) do peitoral.',
    errosComuns: [
      'Elevação dos ombros (encolher) durante a subida',
      'Trajetória desalinhada, mãos terminando acima da cabeça',
      'Usar impulso do tronco',
    ],
    musculos: ['Peitoral maior (clavicular)', 'Deltoide anterior'],
  },
  'Mergulho nas barras paralelas (Dips) livre': {
    descricao:
      'Apoie-se nas paralelas com os braços estendidos, ombros deprimidos (afastados das orelhas) e leve flexão de tronco para frente. Desça controlado até o ombro chegar à altura do cotovelo e empurre de volta. Mantenha o peito “orgulhoso” e o core firme durante toda a série.',
    errosComuns: [
      'Descer abaixo do conforto do ombro (ponto de dor anterior)',
      'Ombros subindo em direção às orelhas (falta de depressão escapular)',
      'Balançar as pernas para gerar impulso',
    ],
    musculos: ['Peitoral inferior', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Mergulho nas paralelas com sobrecarga (cinto/anilha)': {
    descricao:
      'Mesma execução do dip livre com carga presa ao cinto ou pinçada entre os pés. Passe na progressão apenas quando dominar 10–12 repetições técnicas do dip livre. Mantenha a mesma qualidade de movimento: descida controlada, sem ultrapassar o conforto do ombro.',
    errosComuns: [
      'Adicionar carga antes de dominar o peso corporal',
      'Pêndulo da carga balançando (perde a linha do movimento)',
      'Descida mais rápida por causa do peso extra',
    ],
    musculos: ['Peitoral inferior', 'Tríceps braquial', 'Deltoide anterior'],
  },
  'Desenvolvimento militar com barra em pé (Overhead Press)': {
    descricao:
      'Barra na clavícula, pés na largura do quadril, core e glúteos contraídos. Empurre a barra verticalmente até acima da cabeça, com a cabeça “passando por baixo” no final (barra alinhada sobre o meio do crânio) e retorne à clavícula. Nada de impulso das pernas: é press de braços com tronco rígido.',
    errosComuns: [
      'Hiperextensão lombar para gerar impulso (press não é thrust)',
      'Barra terminando à frente da linha do corpo',
      'Cotovelos abrindo totalmente para os lados na saída',
    ],
    musculos: ['Deltoide', 'Tríceps', 'Trapézio superior', 'Core'],
  },
  'Desenvolvimento com halteres sentado': {
    descricao:
      'Sentado com encosto, halteres na altura das orelhas, punhos firmes. Empurre para cima descrevendo um leve arco convergente (halteres se aproximam no topo, sem bater) e retorne controlado até a linha das orelhas. Mantenha a lombar apoiada no encosto e costelas “para baixo”.',
    errosComuns: [
      'Arquear a lombar para sair da posição (empurrar o peito para frente)',
      'Halteres descendo abaixo da linha das orelhas',
      'Bater os halteres com força no topo',
    ],
    musculos: ['Deltoide', 'Tríceps', 'Trapézio superior'],
  },
  'Desenvolvimento Arnold com halteres': {
    descricao:
      'Sentado, halteres na frente dos ombros com palmas viradas para o rosto (pegada supinada). Ao subir, gire os punhos para que as palmas fiquem para frente no topo. Na descida, inverta a rotação. O arco combinado de elevação e rotação cobre as três porções do deltoide, mas exige carga menor que o desenvolvimento comum.',
    errosComuns: [
      'Rotação apressada, sem controle (perde o benefício do arco)',
      'Carga alta demais para controlar a rotação',
      'Subir os ombros em direção às orelhas',
    ],
    musculos: ['Deltoide (todas as porções)', 'Tríceps', 'Trapézio superior'],
  },
  'Desenvolvimento em máquina articulada': {
    descricao:
      'Ajuste o assento para que as alças fiquem na altura das orelhas/ombros e os punhos alinhados. Empurre para cima com arco controlado e retorne devagar, mantendo a lombar apoiada no encosto e o core firme.',
    errosComuns: [
      'Assento muito baixo ou alto (eixo das alças desalinhado do ombro)',
      'Levantar o quadril do assento ao empurrar',
      'Soltar rápido na volta',
    ],
    musculos: ['Deltoide', 'Tríceps', 'Trapézio superior'],
  },
  'Elevação lateral com halteres em pé': {
    descricao:
      'Em pé, halteres ao lado do corpo com leve flexão de cotovelo fixa. Eleve os braços lateralmente até a altura dos ombros (quase em “T”), com o mínimo de impulso, e desça controlado em 2–3 segundos. Imagine “derramar água” com os cotovelos subindo primeiro.',
    errosComuns: [
      'Impulso do tronco para levantar a carga',
      'Subir acima da linha dos ombros (pega trapézio, não deltoide)',
      'Cotovelo flexionando e estendendo durante o movimento',
      'Descida sem controle (queda livre)',
    ],
    musculos: ['Deltoide lateral', 'Supraespinhal'],
  },
  'Elevação lateral sentado': {
    descricao:
      'Sentado (com ou sem encosto), elimina o impulso das pernas: eleve os halteres lateralmente até a altura dos ombros com cotovelos quase fixos e desça controlado. A posição sentada isola melhor o deltoide lateral e expõe trapaças de tronco.',
    errosComuns: [
      'Balançar o tronco (mais difícil de esconder sentado — use menos carga)',
      'Subir os ombros em vez dos braços',
      'Amplitude acima dos ombros',
    ],
    musculos: ['Deltoide lateral', 'Supraespinhal'],
  },
  'Elevação lateral unilateral na polia baixa': {
    descricao:
      'Em pé de lado para a polia, cabo na mão do braço mais distante. Eleve o braço lateralmente até a altura do ombro, cotovelo levemente flexionado e fixo, e desça controlado. A polia mantém tensão constante no início do movimento, que com halteres é fácil de “descansar”.',
    errosComuns: [
      'Inclinar o tronco para o lado oposto para ajudar',
      'Cotovelo travado reto (tensão desnecessária na articulação)',
      'Amplitude parcial no topo',
    ],
    musculos: ['Deltoide lateral', 'Supraespinhal'],
  },
  'Elevação frontal com barra pronada': {
    descricao:
      'Em pé, barra com pegada pronada na largura do quadril, braços à frente do corpo. Eleve a barra até a altura dos ombros com cotovelos quase estendidos e desça controlado. Como o movimento é monolateral (plano sagital), use carga menor que no desenvolvimento.',
    errosComuns: [
      'Impulso lombar (hiperextensão) para vencer o ponto difícil',
      'Elevação acima dos ombros',
      'Pegada muito aberta, puxando o ombro para frente',
    ],
    musculos: ['Deltoide anterior', 'Peitoral superior'],
  },
  'Elevação frontal com halteres neutra': {
    descricao:
      'Em pé, halteres com pegada neutra (palmas se olhando) à frente das coxas. Eleve um braço ou os dois até a altura dos ombros e desça controlado. A pegada neutra é confortável para ombros sensíveis porque mantém o úmero em rotação neutra.',
    errosComuns: [
      'Subir acima da linha dos ombros',
      'Impulso do tronco',
      'Cotovelo totalmente travado',
    ],
    musculos: ['Deltoide anterior', 'Peitoral superior'],
  },
  'Elevação frontal no cabo com corda': {
    descricao:
      'Polia baixa atrás do corpo, corda ou barra na mão. Eleve o braço à frente até a altura do ombro e desça controlado. A tensão da polia é constante em toda a amplitude — controle bem a negativa em 2–3 segundos.',
    errosComuns: [
      'Deixar a polia puxar o braço rapidamente no retorno',
      'Inclinar o tronco para trás para ajudar na subida',
      'Amplitude acima dos ombros',
    ],
    musculos: ['Deltoide anterior', 'Peitoral superior'],
  },
  'Crucifixo invertido com halteres em banco inclinado': {
    descricao:
      'Deitado de bruços em banco inclinado a 30–45°, halteres pendendo abaixo dos ombros. Com cotovelos levemente flexionados e fixos, eleve os braços para os lados até a linha dos ombros, apertando as escápulas, e desça controlado. Imagine “pinçar uma moeda” entre as escápulas no topo.',
    errosComuns: [
      'Carga alta demais (o deltoide posterior é pequeno e pede pouco peso)',
      'Subir a cabeça e o peito do banco para gerar impulso',
      'Cotovelos flexionando para puxar (vira remada)',
    ],
    musculos: ['Deltoide posterior', 'Romboides', 'Trapézio médio', 'Infraespinhal'],
  },
  'Voador invertido na máquina (Reverse Peck Deck)': {
    descricao:
      'Sentado de frente para o encosto do Peck Deck (invertido), peito apoiado, alças na linha dos ombros. Abra os braços para trás até a linha dos ombros, apertando as escápulas, e retorne controlado. A máquina dá estabilidade: foque em sentir o deltoide posterior trabalhando.',
    errosComuns: [
      'Peito descolado do encosto (perde o isolamento)',
      'Amplitude levando os braços muito atrás do corpo',
      'Carga alta demais que obriga a encolher os ombros',
    ],
    musculos: ['Deltoide posterior', 'Romboides', 'Trapézio médio'],
  },
  'Remada alta com pegada aberta na barra ou polia': {
    descricao:
      'Barra ou cabo na altura do quadril, pegada aberta (mais larga que os ombros). Puxe a carga verticalmente até a altura do esterno/clavícula, cotovelos apontando para cima e para os lados, e desça controlado. Pegada aberta mantém os cotovelos mais alinhados e é mais amigável ao ombro.',
    errosComuns: [
      'Pegada fechada com cotovelos acima da linha dos punhos (impingimento)',
      'Puxar até o queixo',
      'Impulso lombar para vencer pontos difíceis',
    ],
    musculos: ['Deltoide lateral', 'Trapézio superior', 'Elevador da escápula'],
  },
  'Encolhimento de ombros com barra pela frente': {
    descricao:
      'Em pé, barra à frente das coxas com pegada na largura dos ombros. Eleve os ombros em direção às orelhas em linha reta vertical, faça uma pausa de 1 segundo no topo e desça controlado. Os braços são apenas “ganchos”: o movimento acontece só pelas escápulas.',
    errosComuns: [
      'Rolar os ombros (círculos), que não adiciona nada e estressa o pescoço',
      'Flexionar os cotovelos para ajudar',
      'Amplitude parcial sem pausa no topo',
    ],
    musculos: ['Trapézio superior', 'Elevador da escápula', 'Romboides'],
  },
  'Encolhimento com halteres ao lado do corpo': {
    descricao:
      'Halteres ao lado do corpo, braços como ganchos: eleve os ombros verticalmente em direção às orelhas, pause 1 segundo no topo e desça devagar. A pegada neutra e lateral é mais confortável para o ombro que a barra pela frente.',
    errosComuns: [
      'Rotação dos ombros em vez de elevação reta',
      'Flexionar os cotovelos (os braços devem permanecer passivos)',
      'Usar impulso para subir',
    ],
    musculos: ['Trapézio superior', 'Elevador da escápula', 'Romboides'],
  },
  'Face Pull na polia média/alta com corda': {
    descricao:
      'Polia alta/média com corda, pegada neutra (polegares para trás). Puxe a corda na direção do rosto, abrindo os cotovelos para os lados e terminando com as mãos ao lado das orelhas e as escápulas retraídas. Retorne controlado. É um dos melhores exercícios de saúde do ombro: fortalece deltoide posterior e rotadores externos.',
    errosComuns: [
      'Puxar pesado demais e virar remada de tronco',
      'Cotovelos caindo (movimento vira puxada para baixo)',
      'Hiperextensão lombar para gerar força',
    ],
    musculos: ['Deltoide posterior', 'Infraespinhal', 'Redondo menor', 'Romboides'],
  },
  'Tríceps testa com barra W no banco reto': {
    descricao:
      'Deitado no banco, barra W acima do peito com braços estendidos. Flexione apenas os cotovelos para descer a barra em direção à testa (ou um pouco atrás), e estenda de volta sem mover os braços da posição vertical. Os ombros são imóveis: o movimento é só de cotovelo.',
    errosComuns: [
      'Abrir os cotovelos para os lados (perde tensão no tríceps)',
      'Mover os ombros para ajudar',
      'Descer com velocidade (a barra chega perto da cabeça — controle!)',
    ],
    musculos: ['Tríceps braquial (cabeça longa e lateral)'],
  },
  'Tríceps testa inclinado com halteres': {
    descricao:
      'Banco inclinado a 30–45°, halteres acima com braços levemente inclinados para trás. Flexione só os cotovelos para descer os halteres em direção às têmporas e estenda de volta mantendo o ângulo do braço constante. A inclinação alonga mais a cabeça longa do tríceps.',
    errosComuns: [
      'Braços balançando (o ângulo do braço deve ficar fixo)',
      'Cotovelos abrindo para os lados',
      'Carga alta demais para controlar a descida',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Tríceps francês com halter bilateral': {
    descricao:
      'Sentado com encosto ou em pé, halter (ou dois) segurado acima da cabeça com duas mãos. Flexione os cotovelos para descer o peso atrás da cabeça, mantendo os braços apontando para cima e cotovelos apontando para o teto, e estenda de volta. Alonga a cabeça longa do tríceps em amplitude máxima.',
    errosComuns: [
      'Cotovelos abrindo (devem ficar apontados para cima)',
      'Arquear a lombar para ganhar alavanca',
      'Amplitude muito curta (metade do arco)',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Tríceps francês unilateral com halter': {
    descricao:
      'Mesma posição do francês bilateral, mas com um halter em uma mão: desça o peso atrás da cabeça com controle e estenda. Permite corrigir assimetrias entre os lados e exige mais estabilidade do ombro em rotação.',
    errosComuns: [
      'Cotovelo deslocando para o lado durante a série',
      'Carga alta demais (a posição unilateral é menos estável)',
      'Perder a postura (tronco inclinando para o lado do peso)',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Tríceps coice com halter': {
    descricao:
      'Tronco inclinado a ~45° (ou apoio no banco), braço rente ao tronco com cotovelo a 90°. Estenda o cotovelo para trás até o braço alinhar com o tronco, aperte o tríceps 1 segundo e retorne devagar. O cotovelo fica “colado” no lugar: só ele se move.',
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
      'Cotovelos se afastando do tronco (a polia vira press de peito)',
      'Inclinar o tronco para gerar impulso',
      'Não fazer a rotação final das pontas (perde contração)',
    ],
    musculos: ['Tríceps braquial'],
  },
  'Tríceps barra reta na polia alta': {
    descricao:
      'Polia alta com barra reta, cotovelos rentes ao corpo. Estenda os cotovelos até os braços ficarem ao lado do tronco, aperte o tríceps 1 segundo e retorne controlado até a flexão máxima. Mantenha o tronco estável e o core firme.',
    errosComuns: [
      'Empurrar com o peso do corpo (degrau para frente)',
      'Cotovelos abrindo na descida',
      'Amplitude parcial no topo (antebraço não toca o bíceps)',
    ],
    musculos: ['Tríceps braquial'],
  },
  'Tríceps barra V na polia alta': {
    descricao:
      'Mesma execução da barra reta, com o formato em V permitindo pegada um pouco mais aberta e “amigável” ao cotovelo. Cotovelos rentes ao tronco, extensão completa com pausa e retorno controlado.',
    errosComuns: [
      'Empurrar com o corpo',
      'Punhos quebrando para baixo no final (use pegada firme)',
      'Amplitude parcial',
    ],
    musculos: ['Tríceps braquial'],
  },
  'Tríceps unilateral pegada invertida na polia': {
    descricao:
      'Polia alta, cabo na mão com pegada supinada (palma para cima). Cotovelo rente ao tronco: estenda até o braço alinhar, girando a palma para baixo no final, e retorne controlado. A rotação aumenta o trabalho da cabeça lateral e dá pico de contração no final.',
    errosComuns: [
      'Cotovelo se afastando do tronco',
      'Rotação apressada sem extensão completa',
      'Carga alta demais que rouba a rotação final',
    ],
    musculos: ['Tríceps braquial (cabeça lateral)'],
  },
  'Tríceps testa na polia com corda': {
    descricao:
      'Deitado de costas para a polia alta, corda nas mãos, braços apontando para cima e levemente para trás. Flexione apenas os cotovelos para trazer a corda em direção à testa/atrás da cabeça e estenda de volta. A polia mantém tensão constante, inclusive no topo.',
    errosComuns: [
      'Mover os ombros (o ângulo do braço deve ficar fixo)',
      'Cotovelos abrindo',
      'Deixar a polia puxar rápido no topo',
    ],
    musculos: ['Tríceps braquial (cabeça longa)'],
  },
  'Mergulho no banco (Bench Dip) com peso sobre as pernas': {
    descricao:
      'Mãos no banco atrás do corpo, pernas estendidas à frente (ou flexionadas para facilitar), anilha sobre as coxas se desejar. Flexione os cotovelos para descer o quadril até ~90° de flexão de cotovelo e empurre de volta. Mantenha o peito aberto e os ombros afastados das orelhas.',
    errosComuns: [
      'H quadril descer muito baixo (estressa o ombro anterior)',
      'Ombros encolhidos em direção às orelhas',
      'Puxar as pernas para ajudar no impulso',
    ],
    musculos: ['Tríceps braquial', 'Deltoide anterior', 'Peitoral inferior'],
  },
  'Supino fechado com barra (Close-grip Bench Press)': {
    descricao:
      'Supino reto com pegada na largura dos ombros (ou pouco menor). Desça a barra até o esterno com cotovelos rentes ao tronco e empurre de volta. A mecânica é a do supino, mas os cotovelos fechados transferem o protagonismo para o tríceps.',
    errosComuns: [
      'Pegada estreita demais (estressa punhos e cotovelos)',
      'Cotovelos abrindo para os lados na descida',
      'Descer na linha do peitoral superior (a barra vai ao esterno)',
    ],
    musculos: ['Tríceps braquial', 'Peitoral maior', 'Deltoide anterior'],
  },
  'Barra fixa pegada pronada aberta (Pull-up)': {
    descricao:
      'Suspenso na barra com pegada pronada aberta (mais larga que os ombros). Puxe o corpo até o queixo passar a barra, com cotovelos apontando para baixo/lados, e desça controlado até a extensão. Antes de puxar, deprime as escápulas (peito para cima) para proteger o ombro.',
    errosComuns: [
      'Puxar com os braços antes de estabilizar as escápulas',
      'Impulso de quadril (kipping) em treino de força',
      'Descida em queda livre',
      'Amplitude parcial (não descer até estender)',
    ],
    musculos: ['Latíssimo do dorso', 'Redondo maior', 'Bíceps', 'Trapézio médio'],
  },
  'Barra fixa pegada supinada (Chin-up)': {
    descricao:
      'Pegada supinada (palmas para o rosto) na largura dos ombros. Puxe até o queixo passar a barra com cotovelos apontando para baixo e desça controlado. A pegada supinada recruta mais bíceps e é a porta de entrada mais fácil para a primeira barra fixa.',
    errosComuns: [
      'Puxar só com os braços (deprimia escapular antes de puxar)',
      'Queixo empurrado para cima e tronco arqueado',
      'Extensão parcial no fundo',
    ],
    musculos: ['Latíssimo do dorso', 'Bíceps braquial', 'Redondo maior'],
  },
  'Barra fixa pegada neutra': {
    descricao:
      'Pegada neutra (palmas se olhando, paralelas) nas alças específicas da barra. Puxe até o queixo passar o nível das mãos e desça controlado. A rotação neutra é a mais confortável para ombros sensíveis e recruta bem o grande dorsal e o bíceps.',
    errosComuns: [
      'Impulso de tronco para vencer o ponto médio',
      'Amplitude parcial',
      'Escápulas “soltas” no fundo do movimento',
    ],
    musculos: ['Latíssimo do dorso', 'Bíceps', 'Trapézio médio', 'Romboides'],
  },
  'Puxada frontal aberta no pulley': {
    descricao:
      'Sentado com coxas travadas, barra larga com pegada pronada aberta. Puxe a barra até a clavícula superior com cotovelos apontando para baixo/lados e desça controlado até a extensão, deixando as escápulas subirem no final. Tronco quase vertical: inclinar para trás demais vira remada.',
    errosComuns: [
      'Inclinação exagerada do tronco para trás',
      'Puxar atrás da nuca (padrão antigo, estressa o ombro e o pescoço)',
      'Impulso de tronco em cada repetição',
    ],
    musculos: ['Latíssimo do dorso', 'Redondo maior', 'Bíceps', 'Trapézio médio'],
  },
  'Puxada fechada com triângulo no pulley': {
    descricao:
      'Sentado, triângulo/V com pegada neutra. Puxe o cabo até o peito, cotovelos rentes ao tronco, apertando as escápulas no final, e retorne controlado até a extensão completa. Mantenha o tronco firme: apenas os braços e as escápulas se movem.',
    errosComuns: [
      'Tronco balançando para trás para puxar',
      'Amplitude parcial (não estender os braços no topo)',
      'Encolher os ombros durante a puxada',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Bíceps'],
  },
  'Puxada articulada unilateral na máquina': {
    descricao:
      'Ajuste o assento e o apoio do braço na máquina: puxe a alça para baixo ao lado do tronco com cotovelo rente ao corpo, aperte o dorsal 1 segundo e retorne controlado até a extensão. Permite corrigir diferenças de força entre os lados.',
    errosComuns: [
      'Ajuste do eixo desalinhado do ombro',
      'Tronco rolando para o lado oposto para ajudar',
      'Amplitude parcial',
    ],
    musculos: ['Latíssimo do dorso', 'Redondo maior', 'Bíceps'],
  },
  'Pulldown com braços estendidos na polia alta (barra reta ou corda)': {
    descricao:
      'Em pé, tronco levemente inclinado, polia alta na mão com braços quase estendidos e fixos. Puxe a barra/corda em arco até as coxas, apertando as escápulas no final, e retorne controlado. Os cotovelos não flexionam: o movimento acontece pelos ombros e escápulas.',
    errosComuns: [
      'Flexionar os cotovelos (vira puxada tradicional)',
      'Usar impulso do tronco',
      'Não apertar as escápulas no final',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio inferior', 'Romboides'],
  },
  'Remada curvada com barra pegada pronada': {
    descricao:
      'Tronco a ~45° (ou quase paralelo ao chão), lombar neutra, barra pendendo abaixo dos ombros. Puxe a barra até o umbigo/baixo abdômen, cotovelos apontando para cima e para trás, aperte as escápulas e desça controlado. O tronco não muda de ângulo durante a série.',
    errosComuns: [
      'Torção do tronco para “levantar” a carga a cada repetição',
      'Lombar arredondada (perda da posição neutra)',
      'Puxar para o peito com cotovelos abertos (vira puxada de ombro)',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior', 'Bíceps'],
  },
  'Remada curvada com barra pegada supinada (Yates Row)': {
    descricao:
      'Mesma base da remada curvada, mas com tronco a ~45° e pegada supinada na largura dos ombros. Puxe até o umbigo com cotovelos rentes ao corpo e desça controlado. O ângulo do tronco mais erguido e a pegada supinada recrutam mais bíceps e são mais amigáveis à lombar.',
    errosComuns: [
      'Tronco “andando” para cima durante a série (vira remada em pé)',
      'Cotovelos abrindo',
      'Lombar arredondada',
    ],
    musculos: ['Latíssimo do dorso', 'Bíceps', 'Trapézio médio'],
  },
  'Remada serrote unilateral com halter': {
    descricao:
      'Mão e joelho opostos apoiados no banco, tronco quase paralelo ao chão, halter pendendo verticalmente. Puxe o halter até a lateral do tronco (cotovelo rente ao corpo), aperte a escápula e desça controlado, alongando bem no fundo. Imagine “arrancar uma corda de serra”: por isso o nome.',
    errosComuns: [
      'Torção do tronco para levantar o halter',
      'Puxar com o braço sem mover a escápula',
      'Apoio instável (quadril alto, lombar desalinhada)',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Bíceps'],
  },
  'Remada cavalinho com barra em T': {
    descricao:
      'Apoie o peito no apoio da máquina T (ou assuma posição curvada estável) e puxe as alças até o tronco, cotovelos em ~45° do corpo, apertando as escápulas. Retorne controlado até a extensão. O apoio do peito elimina o trinca de lombar e permite focar 100% nas costas.',
    errosComuns: [
      'Peito descolando do apoio para gerar impulso',
      'Amplitude parcial',
      'Pegada muito estreita forçando os punhos',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior'],
  },
  'Remada baixa no cabo com triângulo': {
    descricao:
      'Sentado, pés apoiados, joelhos levemente flexionados, triângulo na mão. Puxe o cabo até o abdômen com cotovelos rentes ao tronco, aperte as escápulas 1 segundo e retorne controlado até a extensão completa, deixando o tronco ser “levado” só um pouco para frente.',
    errosComuns: [
      'Balanço de tronco (remada “de degrau”)',
      'Amplitude parcial no alongamento',
      'Encolher os ombros',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Bíceps'],
  },
  'Remada aberta na polia baixa com barra romana': {
    descricao:
      'Mesma posição da remada baixa, com barra romana e pegada pronada aberta: puxe até o esterno/baixo peito com cotovelos abertos a ~60–75°, apertando as escápulas. Esse ângulo privilegia trapézio médio, romboides e deltoide posterior em vez do grande dorsal.',
    errosComuns: [
      'Tronco balançando',
      'Puxar para o abdômen com cotovelos fechados (muda o alvo)',
      'Amplitude parcial',
    ],
    musculos: ['Trapézio médio', 'Romboides', 'Deltoide posterior', 'Bíceps'],
  },
  'Remada apoiada no peito em banco inclinado com halteres': {
    descricao:
      'Deitado de bruços no banco inclinado a 45°, halteres pendendo, pés bem apoiados. Puxe os halteres até a lateral do tronco (cotovelos rentes) ou levemente abertos, aperte as escápulas e desça controlado. O peito apoiado protege a lombar durante a série inteira.',
    errosComuns: [
      'Levantar o peito do banco para impulsionar',
      'Amplitude parcial no fundo',
      'Puxar muito pesado e perder o contato escapular',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior'],
  },
  'Remada articulada baixa em máquina': {
    descricao:
      'Peito apoiado no encosto da máquina, alças na linha dos ombros: puxe para trás ao lado do tronco com cotovelos rentes, aperte as escápulas 1 segundo e retorne controlado. A máquina estabiliza o tronco e permite focar na qualidade da contração.',
    errosComuns: [
      'Ajuste do assento (alças fora da linha dos ombros)',
      'Peito descolando do apoio',
      'Amplitude parcial',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides'],
  },
  'Remada invertida na barra fixa (Australian Pull-up)': {
    descricao:
      'Barra na altura do quadril, corpo em linha reta pendendo com os pés no chão e calcanhares apoiados. Puxe o peito até a barra com cotovelos abertos e desça controlado. Quanto mais horizontais os pés (elevados em um step), mais difícil. Excelente progressão para a primeira barra fixa.',
    errosComuns: [
      'Quadril caído (core relaxado)',
      'Puxar só a cabeça (queixo empurrado para frente)',
      'Amplitude parcial',
    ],
    musculos: ['Latíssimo do dorso', 'Trapézio médio', 'Romboides', 'Deltoide posterior'],
  },
  'Rosca direta com barra reta': {
    descricao:
      'Em pé, barra com pegada supinada na largura dos ombros, cotovelos rentes ao tronco. Flexione os cotovelos para subir a barra até a contração máxima do bíceps e desça controlado. Os cotovelos ficam “colados” e o tronco parado: só o antebraço se move.',
    errosComuns: [
      'Impulso lombar para vencer o ponto difícil',
      'Cotovelos andando para frente (vira elevação frontal de ombro)',
      'Descida em queda livre',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior', 'Braquiorradial'],
  },
  'Rosca direta com barra W': {
    descricao:
      'Mesma execução da rosca direta com barra W: o formato permite pegada semirrotada que reduz a tensão no punho e cotovelo. Suba controlado, aperte no topo e desça em 2–3 segundos. Escolha essa barra se a reta causar desconforto no punho.',
    errosComuns: [
      'Impulso de tronco',
      'Cotovelos deslocando para frente',
      'Amplitude parcial (não estender completamente no fundo)',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca alternada com halteres com rotação': {
    descricao:
      'Halteres ao lado do corpo com pegada neutra. Ao subir um braço, gire o punho para que a palma fique para cima no topo (supinação ativa). Desça controlado e troque de lado. A rotação recruta o bíceps em sua função completa e é a versão mais “anatômica” da rosca.',
    errosComuns: [
      'Rotação apressada ou incompleta',
      'Balanço do tronco para iniciar cada subida',
      'Cotovelo deslocando para frente',
    ],
    musculos: ['Bíceps braquial', 'Supinador', 'Braquial anterior'],
  },
  'Rosca martelo com halteres em pé': {
    descricao:
      'Halteres com pegada neutra (palmas se olhando), cotovelos rentes ao tronco. Flexione os cotovelos subindo os halteres como um martelo e desça controlado. A pegada neutra recruta o braquial e o braquiorradial (espessura do antebraço).',
    errosComuns: [
      'Impulso do tronco',
      'Cotovelos andando para frente',
      'Punhos girando (deve permanecer neutro)',
    ],
    musculos: ['Braquial anterior', 'Braquiorradial', 'Bíceps braquial'],
  },
  'Rosca martelo na corda na polia baixa': {
    descricao:
      'Polia baixa com corda, pegada neutra: flexione os cotovelos subindo as pontas da corda e desça controlado. A polia mantém tensão constante, inclusive no fundo do movimento, onde o bíceps normalmente “descansa” com halteres.',
    errosComuns: [
      'Inclinar o tronco para trás para ajudar',
      'Cotovelos deslocando',
      'Deixar a polia puxar rápido no retorno',
    ],
    musculos: ['Braquial anterior', 'Braquiorradial', 'Bíceps'],
  },
  'Rosca concentrada com halter': {
    descricao:
      'Sentado, cotovelo do braço trabalhando apoiado na parte interna da coxa, tronco levemente inclinado à frente. Flexione o cotovelo até a contração máxima, aperte 1 segundo e desça controlado. O apoio elimina trapaças: só o bíceps move o halter.',
    errosComuns: [
      'Empurrar com a coxa',
      'Torção do tronco para levantar',
      'Amplitude parcial no alongamento',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca Scott com barra W no banco específico': {
    descricao:
      'Axilas apoiadas no banco Scott (assento no topo), barra W com pegada semisupinada. Flexione os cotovelos subindo a barra e desça controlado até a extensão quase completa, sem travar. O apoio elimina o impulso: é a versão mais rigorosa da rosca.',
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
      'Sentado no banco a 45° com halteres pendendo atrás da linha do corpo, braços alinhados com os ombros. Flexione os cotovelos subindo os halteres e desça controlado. A posição alonga a cabeça longa do bíceps no fundo — amplitude máxima de estiramento.',
    errosComuns: [
      'Braços “viajando” para frente na subida (perde o alongamento)',
      'Carga alta demais (a posição alongada exige menos peso)',
      'Subir os ombros em direção às orelhas',
    ],
    musculos: ['Bíceps braquial (cabeça longa)', 'Braquial anterior'],
  },
  'Rosca aranha (Spider Curl) no banco inclinado': {
    descricao:
      'Deitado de bruços no banco inclinado, halteres pendendo verticalmente, braços alinhados com os ombros. Flexione os cotovelos subindo os halteres sem mover a posição dos braços e desça controlado. O ângulo elimina completamente o impulso e isola o bíceps.',
    errosComuns: [
      'Braços deslocando da posição vertical',
      'Levantar a cabeça e o peito para ajudar',
      'Carga alta demais para controlar a negativa',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca bíceps bilateral na polia alta (Hercules Curl)': {
    descricao:
      'Duas polias altas, um cabo em cada mão, braços abertos na linha dos ombros. Flexione os cotovelos trazendo as mãos em direção às têmporas, sem mover a posição dos cotovelos, e desça controlado. A tensão da polia é máxima justamente na posição de maior contração.',
    errosComuns: [
      'Cotovelos deslocando da linha dos ombros',
      'Inclinar o tronco para trás para ajudar',
      'Carga alta demais (a posição é instável)',
    ],
    musculos: ['Bíceps braquial', 'Braquial anterior'],
  },
  'Rosca inversa com barra reta (foco em braquiorradial)': {
    descricao:
      'Barra com pegada pronada (palmas para baixo) na largura dos ombros, cotovelos rentes ao tronco. Flexione os cotovelos subindo a barra e desça controlado. A pegada invertida tira o bíceps do protagonismo e recruta braquiorradial e braquial.',
    errosComuns: [
      'Carga alta demais (a pegada invertida é visivelmente mais fraca)',
      'Impulso de tronco',
      'Punhos quebrando (dor no punho — use barra W)',
    ],
    musculos: ['Braquiorradial', 'Braquial anterior', 'Extensor radial curto do carpo'],
  },
  'Rosca de punho com barra sobre o banco (flexores)': {
    descricao:
      'Sentado, antebraços apoiados no banco com os punhos para fora da borda, barra com pegada supinada. Deixe os punhos caírem em extensão e flexione-os subindo a barra, apertando os flexores do antebraço no topo. Os antebraços não descolam do banco.',
    errosComuns: [
      'Levantar os antebraços do apoio',
      'Amplitude exagerada que estressa o punho',
      'Carga alta demais (os músculos do punho são pequenos)',
    ],
    musculos: ['Flexores do carpo', 'Flexor radial do carpo', 'Palmar longo'],
  },
  'Rosca de punho inversa com barra (extensores)': {
    descricao:
      'Antebraços apoiados no banco, barra com pegada pronada: desça os punhos em flexão e estenda-os subindo a barra, apertando os extensores no topo. Fundamental para equilibrar o antebraço e prevenir dor lateral do cotovelo (epicondilite).',
    errosComuns: [
      'Antebraços descolando do apoio',
      'Amplitude exagerada',
      'Ignorar o exercício (extensores fracos são causa comum de dor no cotovelo)',
    ],
    musculos: ['Extensores do carpo', 'Extensores dos dedos'],
  },
  'Rotação de punho com halteres/martelo (pronossupinação)': {
    descricao:
      'Sentado, cotovelo a 90° apoiado na coxa, halter na ponta (segure só a cabeça do halter para reduzir o momento). Gire o punho alternando a palma para cima (supinação) e para baixo (pronação), devagar e controlado. Fortalece os rotadores do antebraço e previne lesões no cotovelo.',
    errosComuns: [
      'Girar com o braço inteiro em vez do punho',
      'Carga alta demais',
      'Velocidade rápida (movimento deve ser lento e controlado)',
    ],
    musculos: ['Pronador redondo', 'Supinador', 'Bíceps braquial'],
  },
}
