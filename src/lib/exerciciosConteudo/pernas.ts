import type { ConteudoExercicio } from './tipos'

/** Pernas e glúteos — chaves = nomes da coleção (migration 0023). */
export const PERNAS: Record<string, ConteudoExercicio> = {
  'Agachamento livre com barra nas costas (Back Squat)': {
    descricao:
      'Barra no trapézio, pés na largura dos ombros com pontas levemente abertas. Inspire, destrave o quadril e desça flexionando joelhos e quadril até coxas ao menos paralelas ao chão, joelhos alinhados com os pés, tronco firme. Empurre o chão para subir. Core ativo do início ao fim.',
    errosComuns: [
      'Joelhos colapsando para dentro',
      'Calcanhares descolando do chão',
      'Lombar arredondada no fundo (butt wink)',
      'Subir antes de descer (empurrar quadril para frente)',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Adutores', 'Eretores da espinha'],
  },
  'Agachamento livre com barra na frente (Front Squat)': {
    descricao:
      'Barra apoiada nos deltoides anteriores (pegada de limpeza ou cruzada), cotovelos altos. Desça mantendo o tronco quase vertical e suba empurrando o chão. A posição frontal exige mobilidade de punho/ombro e castiga menos a lombar.',
    errosComuns: [
      'Cotovelos caindo (barra rola para frente)',
      'Tronco inclinando para frente',
      'Calcanhares descolando',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Core'],
  },
  'Agachamento búlgaro com barra ou halteres': {
    descricao:
      'Pé de trás apoiado no banco, pé da frente à frente do quadril. Desça flexionando o joelho da frente até ~90° e empurre o chão para subir. Tronco levemente inclinado à frente aumenta o glúteo; vertical aumenta o quadríceps. Halteres ao lado do corpo para equilíbrio.',
    errosComuns: [
      'Pé da frente muito próximo do banco (joelho passa muito da ponta)',
      'Pé de trás subindo com o peso',
      'Tronco torcendo para equilibrar',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Glúteo médio'],
  },
  'Agachamento sissy (Sissy Squat)': {
    descricao:
      'Em pé, segurando apoio, quadril estendido e corpo em linha reta. Flexione os joelhos deixando o corpo recuar (joelhos à frente), calcanhares podendo subir, e volte empurrando o chão. Alta exigência de quadríceps e equilíbrio — comece sem peso.',
    errosComuns: [
      'Quadril flexionando (o tronco não deve inclinar)',
      'Descer rápido demais',
      'Sem apoio nas primeiras tentativas',
    ],
    musculos: ['Quadríceps', 'Flexores do quadril'],
  },
  'Agachamento Anderson (pausa no fundo, saindo dos pinos)': {
    descricao:
      'Barra nos pinos na altura do fundo do seu agachamento. Entre, posicione, pause 1–2 segundos com a barra totalmente apoiada nos pinos e suba com explosão. Elimina o reflexo de estiramento e trava a saída do fundo — excelente para travar "sticking points".',
    errosComuns: [
      'Aproveitar impulso ao encostar na barra (barra deve parar)',
      'Posição inconsistente a cada repetição',
      'Saída desalinhada (quadril e ombros sobem juntos)',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Eretores da espinha'],
  },
  'Agachamento com barra na nuca em Smith': {
    descricao:
      'Barra do Smith nas costas, pés à frente da linha da barra. Desça controlado até ~90° e suba. A trajetória fixa permite foco no quadríceps e é útil para iniciantes, mas exige atenção ao posicionamento dos pés.',
    errosComuns: [
      'Pés sob a barra (agachamento vira sentado, estressa joelho)',
      'Pés muito à frente (sobrecarrega lombar)',
      'Descer rápido demais e "quicar" no fundo',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Agachamento em Smith com pés à frente': {
    descricao:
      'Smith com pés bem à frente da barra, tronco quase vertical: o alvo é quadríceps e o movimento é mais amigável à lombar. Desça até coxas paralelas e suba empurrando o chão pelos calcanhares.',
    errosComuns: [
      'Pés pouco à frente (tronco inclina e lombar paga)',
      'Calcanhares subindo',
      'Amplitude parcial no topo',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Agachamento sumô com anilha ou halter (Goblet ou Sumô)': {
    descricao:
      'Pés largos com pontas bem abertas, anilha/halter junto ao peito ou halter pendendo entre as pernas. Desça até coxas paralelas com joelhos abrindo na direção das pontas dos pés e suba empurrando o chão. Grande trabalho de adutores e glúteo.',
    errosComuns: [
      'Joelhos caindo para dentro',
      'Tronco inclinando demais (sumô exige tronco mais vertical)',
      'Amplitude parcial no topo',
    ],
    musculos: ['Quadríceps', 'Adutores', 'Glúteo máximo'],
  },
  'Agachamento frontal no Smith': {
    descricao:
      'Smith com barra na frente (nos deltoides), cotovelos altos, pés levemente à frente. Desça mantendo tronco vertical e suba empurrando o chão. Trajetória fixa do Smith facilita o aprendizado do padrão frontal.',
    errosComuns: ['Cotovelos caindo (barra rola)', 'Calcanhares descolando', 'Amplitude parcial'],
    musculos: ['Quadríceps', 'Core'],
  },
  'Agachamento na máquina hack': {
    descricao:
      'Ombros sob as alças, pés na plataforma na largura dos ombros. Desça até coxas paralelas e suba sem travar os joelhos. Lombar totalmente apoiada: a máquina dirige a carga quase toda ao quadríceps.',
    errosComuns: [
      'Calcanhares descolando',
      'Lombar descolando do apoio no fundo',
      'Travar os joelhos no topo',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Agachamento na máquina multipower para idosos/iniciantes': {
    descricao:
      'Smith com carga leve, pés levemente à frente, assento/suporte se necessário. Desça até uma profundidade confortável e suba com controle. Ideal para idosos e iniciantes: amplitude e profundidade podem ser limitadas por pinos de segurança.',
    errosComuns: [
      'Profundidade além da mobilidade do aluno',
      'Carga progressiva apressada',
      'Sem supervisão nas primeiras sessões',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Supino reto 45° na máquina hack invertida': {
    descricao:
      'Deitado na hack invertida (peito para baixo), pés na plataforma: empurre a carga estendendo joelhos e quadril e retorne controlado. Posição reduz exigência lombar e isola pernas.',
    errosComuns: [
      'Lombar hiperextendida na plataforma',
      'Amplitude parcial',
      'Travar os joelhos no topo',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Leg press 45°': {
    descricao:
      'Deitado a 45°, pés na plataforma na largura dos ombros. Desça até ~90° de flexão de joelho (quadril para não descolar) e empurre pelos pés inteiros sem travar os joelhos. Ajuste a profundidade conforme mobilidade do quadril.',
    errosComuns: [
      'Quadril descolando do banco (lombar arredondada) — reduza a amplitude',
      'Descer rápido e quicar no fundo',
      'Empurrar só com a ponta dos pés',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Adutores'],
  },
  'Leg press horizontal': {
    descricao:
      'Sentado quase deitado, pés na plataforma: desça até ~90° e empurre sem travar joelhos. Ângulo horizontal reduz a carga axial na coluna.',
    errosComuns: [
      'Amplitude parcial',
      'Mãos puxando as alças para ajudar',
      'Travar joelhos no topo',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Leg press 45° com pés altos na plataforma': {
    descricao:
      'Leg press 45° com pés posicionados na parte alta da plataforma: aumenta a flexão de quadril e transfere parte do trabalho para glúteos e posteriores.',
    errosComuns: [
      'Quadril descolando do banco',
      'Amplitude exagerada para a mobilidade disponível',
      'Travar joelhos',
    ],
    musculos: ['Glúteo máximo', 'Isquiotibiais', 'Quadríceps'],
  },
  'Leg press 45° com pés baixos na plataforma': {
    descricao:
      'Pés na parte baixa da plataforma: aumenta a flexão de joelho e concentra o trabalho no quadríceps. Use amplitude compatível com a mobilidade do tornozelo.',
    errosComuns: [
      'Calcanhares descolando',
      'Amplitude além da mobilidade (quadril descola)',
      'Descer rápido demais',
    ],
    musculos: ['Quadríceps'],
  },
  'Leg press unilateral': {
    descricao:
      'Leg press com um pé na plataforma, centralizado: desça até ~90° e empurre. A versão unilateral corrige assimetrias e exige estabilidade de tronco.',
    errosComuns: [
      'Tronco rolando para o lado que trabalha',
      'Pé fora do eixo da plataforma',
      'Amplitude parcial',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Glúteo médio'],
  },
  'Hack em pé (Vertical Leg Press)': {
    descricao:
      'Deitado de costas no hack vertical, pés na plataforma acima: desça até ~90° e empurre sem travar joelhos. Trajetória vertical e lombar apoiada; atenção à amplitude, pois o quadril descola com facilidade.',
    errosComuns: ['Quadril descolando do banco', 'Amplitude exagerada', 'Travar joelhos no topo'],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Hack inclinado com pausa': {
    descricao:
      'Hack ou leg press com pausa de 1–2 segundos no fundo, sem descansar a carga: elimina o reflexo e aumenta o tempo sob tensão. Desça controlado, pause ativo e empurre com explosão.',
    errosComuns: [
      '"Descansar" a carga no fundo (perde tensão)',
      'Pausa longa demais e sem controle',
      'Amplitude reduzida antes da pausa',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Afundo com halteres (Lunge)': {
    descricao:
      'Halteres ao lado do corpo, passo largo à frente. Desça o joelho de trás em direção ao chão (tronco firme, leve inclinação à frente) e empurre o chão para voltar. Passos largos recrutam mais glúteo; curtos, mais quadríceps.',
    errosComuns: [
      'Tronco torcendo para equilibrar',
      'Joelho da frente colapsando para dentro',
      'Passo curto (joelho passa muito da ponta do pé)',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Glúteo médio'],
  },
  'Afundo andando com halteres (Walking Lunge)': {
    descricao:
      'Afundos consecutivos caminhando: a cada passo, desça até o joelho de trás quase tocar o chão e traga o pé de trás para o próximo passo. Mantenha tronco firme e passo consistente. Excelente para glúteos e equilíbrio.',
    errosComuns: [
      'Passos inconsistentes (um longo, um curto)',
      'Tronco torcendo',
      'Joelho colapsando para dentro',
    ],
    musculos: ['Glúteo máximo', 'Quadríceps', 'Glúteo médio'],
  },
  'Afundo cruzado (Curtsy Lunge)': {
    descricao:
      'Passo cruzando o pé de trás para trás e diagonal, desça flexionando o joelho da frente e empurre para voltar. Tronco firme e quadril estável: recruta bem glúteo médio e máximo.',
    errosComuns: [
      'Quadril rolando (mantenha o quadril apontando à frente)',
      'Passo cruzado muito estreito',
      'Amplitude parcial',
    ],
    musculos: ['Glúteo máximo', 'Glúteo médio', 'Quadríceps'],
  },
  'Afundo com barra nas costas': {
    descricao:
      'Barra no trapézio (como no agachamento), passo à frente e desça até o joelho de trás quase tocar o chão, empurre para voltar. A barra aumenta a exigência de core e estabilidade.',
    errosComuns: ['Impulso com a barra (tronco torcendo)', 'Passo curto', 'Amplitude parcial'],
    musculos: ['Quadríceps', 'Glúteo máximo'],
  },
  'Afundo lateral com halter ou anilha': {
    descricao:
      'Em pé, passo lateral largo, desça flexionando o joelho do lado do passo com o outro perna estendida e pé no chão. Empurre o chão para voltar. Tronco levemente à frente do joelho que trabalha. Alvo: adutores e glúteo médio.',
    errosComuns: [
      'Joelho que trabalha colapsando para dentro',
      'Pé do lado estendido descolando do chão',
      'Tronco torto',
    ],
    musculos: ['Adutores', 'Glúteo médio', 'Quadríceps'],
  },
  'Afundo lateral na polia baixa': {
    descricao:
      'Polia baixa com cabo na mão do lado oposto ao passo (ou nas duas mãos): desça em afundo lateral e volte controlado. A polia adiciona tensão no lado que trabalha.',
    errosComuns: ['Joelho colapsando para dentro', 'Tronco torto', 'Amplitude parcial'],
    musculos: ['Adutores', 'Glúteo médio'],
  },
  'Passada lateral com step ou banco': {
    descricao:
      'Em pé ao lado do step/banco, suba com o pé externo e desça controlado; troque de lado.',
    errosComuns: [
      'Subir usando impulso sem apoiar bem o pé',
      'Quadril caindo ao descer',
      'Passada muito estreita',
    ],
    musculos: ['Glúteo médio', 'Quadríceps', 'Panturrilha'],
  },
  'Afundo com halteres caminhando (Walking Lunge)': {
    descricao:
      'Dê um passo à frente e desça em afundo até o joelho de trás quase tocar o chão; empurre com a perna da frente para avançar no próximo passo. Tronco ereto, core firme e passos largos o suficiente para o joelho não passar muito da ponta do pé.',
    errosComuns: [
      'Passo curto demais (joelho avança demais)',
      'Joelho da frente colapsando para dentro',
      'Tronco inclinado para frente de forma descontrolada',
    ],
    musculos: ['Quadríceps', 'Glúteos', 'Isquiotibiais', 'Panturrilha'],
  },
  'Agachamento búlgaro com barra nas costas': {
    descricao:
      'Pé de trás elevado em banco, barra apoiada nas costas. Desça controlado até a coxa da frente ficar paralela ao chão e suba empurrando com a perna da frente. Distância do banco ajusta o foco (mais perto = quadríceps; mais longe = glúteo).',
    errosComuns: [
      'Base muito curta (joelho avança demais)',
      'Tronco desabando para frente',
      'Joelho colapsando para dentro',
    ],
    musculos: ['Quadríceps', 'Glúteo máximo', 'Isquiotibiais'],
  },
}
