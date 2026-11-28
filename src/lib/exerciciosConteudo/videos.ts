// Mapa nome normalizado → vídeo do YouTube de canais de referência
// (Musculação Online, Jeff Nippard, Squat University, ScottHermanFitness,
// Renaissance Periodization, Athlean-X). Um mesmo vídeo-base pode servir
// variantes do mesmo padrão de movimento (mesma remada, mesmo supino etc.).

import { normalizarNome } from './tipos'

export interface VideoInfo {
  videoId: string
  canal: string
}

const VIDEOS: Record<string, VideoInfo> = {
  // ── Peito ───────────────────────────────────────────────────────────────
  'supino reto com barra': { videoId: 'vcBig73ojpE', canal: 'Renaissance Periodization' },
  'supino reto com halteres': { videoId: 'vthMCtgVtFw', canal: 'Renaissance Periodization' },
  'supino inclinado a 30° com halteres': {
    videoId: 'SrqOu55lrYU',
    canal: 'Renaissance Periodization',
  },
  'supino inclinado a 45° com barra': {
    videoId: 'SrqOu55lrYU',
    canal: 'Renaissance Periodization',
  },
  'supino declinado com barra': { videoId: 'vthMCtgVtFw', canal: 'Renaissance Periodization' },
  'supino declinado com halteres': { videoId: 'vthMCtgVtFw', canal: 'Renaissance Periodization' },
  'crucifixo reto com halteres': { videoId: 'IWe6fTOC3Hc', canal: 'Renaissance Periodization' },
  'crucifixo inclinado com halteres': {
    videoId: 'IWe6fTOC3Hc',
    canal: 'Renaissance Periodization',
  },
  'floor press com halteres (no chão)': {
    videoId: 'vthMCtgVtFw',
    canal: 'Renaissance Periodization',
  },
  'flexão de braço tradicional (push-up)': { videoId: 'IODxDxX7oi4', canal: 'Jeff Nippard' },
  'flexão de braço com pés elevados (declinada)': { videoId: 'IODxDxX7oi4', canal: 'Jeff Nippard' },
  'flexão de braço diamante (foco em tríceps e miolo do peito)': {
    videoId: 'IODxDxX7oi4',
    canal: 'Jeff Nippard',
  },
  'supino convergente articulado na máquina': {
    videoId: 'vcBig73ojpE',
    canal: 'Renaissance Periodization',
  },
  'supino inclinado em máquina articulada': {
    videoId: 'SrqOu55lrYU',
    canal: 'Renaissance Periodization',
  },
  'peck deck / voador peitoral na máquina': {
    videoId: 'IWe6fTOC3Hc',
    canal: 'Renaissance Periodization',
  },
  'crossover polia alta (fase inferior)': {
    videoId: 'IWe6fTOC3Hc',
    canal: 'Renaissance Periodization',
  },
  'crossover polia média (fase medial)': {
    videoId: 'IWe6fTOC3Hc',
    canal: 'Renaissance Periodization',
  },
  'crossover polia baixa (fase clavicular)': {
    videoId: 'IWe6fTOC3Hc',
    canal: 'Renaissance Periodization',
  },
  'mergulho nas barras paralelas (dips) livre': {
    videoId: '2z8JJM0k5EY',
    canal: 'Renaissance Periodization',
  },
  'mergulho nas paralelas com sobrecarga (cinto/anilha)': {
    videoId: '2z8JJM0k5EY',
    canal: 'Renaissance Periodization',
  },

  // ── Ombro ───────────────────────────────────────────────────────────────
  'desenvolvimento militar com barra em pé (overhead press)': {
    videoId: '2yjwXTZQDDI',
    canal: 'Jeff Nippard',
  },
  'desenvolvimento com halteres sentado': { videoId: 'qEwKCR5JCog', canal: 'Jeff Nippard' },
  'desenvolvimento arnold com halteres': { videoId: '6Z15_WdOXmQ', canal: 'ScottHermanFitness' },
  'desenvolvimento em máquina articulada': { videoId: 'qEwKCR5JCog', canal: 'Jeff Nippard' },
  'elevação lateral com halteres em pé': { videoId: '3VcKaXpzURo', canal: 'Jeff Nippard' },
  'elevação lateral sentado': { videoId: '3VcKaXpzURo', canal: 'Jeff Nippard' },
  'elevação lateral unilateral na polia baixa': { videoId: '3VcKaXpzURo', canal: 'Jeff Nippard' },
  'elevação frontal com barra pronada': { videoId: '3VcKaXpzURo', canal: 'Jeff Nippard' },
  'elevação frontal com halteres neutra': { videoId: '3VcKaXpzURo', canal: 'Jeff Nippard' },
  'elevação frontal no cabo com corda': { videoId: '3VcKaXpzURo', canal: 'Jeff Nippard' },
  'crucifixo invertido com halteres em banco inclinado': {
    videoId: 'rep-qVOkqgk',
    canal: 'Jeff Nippard',
  },
  'voador invertido na máquina (reverse peck deck)': {
    videoId: 'rep-qVOkqgk',
    canal: 'Jeff Nippard',
  },
  'remada alta com pegada aberta na barra ou polia': {
    videoId: 'kpUtLbf9H8o',
    canal: 'ScottHermanFitness',
  },
  'encolhimento de ombros com barra pela frente': {
    videoId: 'cJRVVxmytaM',
    canal: 'ScottHermanFitness',
  },
  'encolhimento com halteres ao lado do corpo': {
    videoId: 'cJRVVxmytaM',
    canal: 'ScottHermanFitness',
  },
  'face pull na polia média/alta com corda': { videoId: 'rep-qVOkqgk', canal: 'Jeff Nippard' },

  // ── Costas ──────────────────────────────────────────────────────────────
  'barra fixa pegada pronada aberta (pull-up)': { videoId: 'HRV5YKKaeVw', canal: 'Jeff Nippard' },
  'barra fixa pegada supinada (chin-up)': { videoId: 'HRV5YKKaeVw', canal: 'Jeff Nippard' },
  'barra fixa pegada neutra': { videoId: 'HRV5YKKaeVw', canal: 'Jeff Nippard' },
  'puxada frontal aberta no pulley': { videoId: 'CAwf7n6Luuc', canal: 'ScottHermanFitness' },
  'puxada fechada com triângulo no pulley': { videoId: 'CAwf7n6Luuc', canal: 'ScottHermanFitness' },
  'puxada articulada unilateral na máquina': {
    videoId: 'CAwf7n6Luuc',
    canal: 'ScottHermanFitness',
  },
  'pulldown com braços estendidos na polia alta (barra reta ou corda)': {
    videoId: 'KAlXhKffS8M',
    canal: 'Renaissance Periodization',
  },
  'remada curvada com barra pegada pronada': {
    videoId: 'kBWAon7ItDw',
    canal: 'ScottHermanFitness',
  },
  'remada curvada com barra pegada supinada (yates row)': {
    videoId: 'kBWAon7ItDw',
    canal: 'ScottHermanFitness',
  },
  'remada serrote unilateral com halter': { videoId: 'roCP6wCXPqo', canal: 'ScottHermanFitness' },
  'remada cavalinho com barra em t': { videoId: 'ROyOwbYJcQU', canal: 'ScottHermanFitness' },
  'remada baixa no cabo com triângulo': { videoId: 'GZbfZ033f74', canal: 'ScottHermanFitness' },
  'remada aberta na polia baixa com barra romana': {
    videoId: 'GZbfZ033f74',
    canal: 'ScottHermanFitness',
  },
  'remada apoiada no peito em banco inclinado com halteres': {
    videoId: 'mLJstoyOhM0',
    canal: 'Renaissance Periodization',
  },
  'remada articulada baixa em máquina': { videoId: 'GZbfZ033f74', canal: 'ScottHermanFitness' },
  'remada invertida na barra fixa (australian pull-up)': {
    videoId: 'Y7YtCiWhbaI',
    canal: 'Renaissance Periodization',
  },

  // ── Braços ──────────────────────────────────────────────────────────────
  'tríceps testa com barra w no banco reto': {
    videoId: '-Ho737Yz0PU',
    canal: 'ScottHermanFitness',
  },
  'tríceps testa inclinado com halteres': { videoId: '-Ho737Yz0PU', canal: 'ScottHermanFitness' },
  'tríceps francês com halter bilateral': { videoId: 'YbX7Wd8jQ-Q', canal: 'Jeff Nippard' },
  'tríceps francês unilateral com halter': { videoId: 'YbX7Wd8jQ-Q', canal: 'Jeff Nippard' },
  'tríceps coice com halter': { videoId: 'YbX7Wd8jQ-Q', canal: 'Jeff Nippard' },
  'tríceps corda na polia alta': { videoId: '2-LAMcpzODU', canal: 'ScottHermanFitness' },
  'tríceps barra reta na polia alta': { videoId: '2-LAMcpzODU', canal: 'ScottHermanFitness' },
  'tríceps barra v na polia alta': { videoId: '2-LAMcpzODU', canal: 'ScottHermanFitness' },
  'tríceps unilateral pegada invertida na polia': {
    videoId: '2-LAMcpzODU',
    canal: 'ScottHermanFitness',
  },
  'tríceps testa na polia com corda': { videoId: '-Ho737Yz0PU', canal: 'ScottHermanFitness' },
  'mergulho no banco (bench dip) com peso sobre as pernas': {
    videoId: '6P_aFy2z0ZM',
    canal: 'Renaissance Periodization',
  },
  'supino fechado com barra (close-grip bench press)': {
    videoId: 'DrTRl0S4cIA',
    canal: 'Renaissance Periodization',
  },
  'rosca direta com barra reta': { videoId: 'ykJmrZ5v0Oo', canal: 'ScottHermanFitness' },
  'rosca direta com barra w': { videoId: 'ykJmrZ5v0Oo', canal: 'ScottHermanFitness' },
  'rosca alternada com halteres com rotação': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rosca martelo com halteres em pé': { videoId: 'zC3nLlDvinU', canal: 'ScottHermanFitness' },
  'rosca martelo na corda na polia baixa': { videoId: 'zC3nLlDvinU', canal: 'ScottHermanFitness' },
  'rosca concentrada com halter': { videoId: 'ykJmrZ5v0Oo', canal: 'ScottHermanFitness' },
  'rosca scott com barra w no banco específico': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rosca scott na máquina': { videoId: 'ykJmrZ5v0Oo', canal: 'ScottHermanFitness' },
  'rosca inclinada em 45° com halteres no banco': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rosca aranha (spider curl) no banco inclinado': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rosca bíceps bilateral na polia alta (hercules curl)': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rosca inversa com barra reta (foco em braquiorradial)': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rosca de punho com barra sobre o banco (flexores)': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rosca de punho inversa com barra (extensores)': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },
  'rotação de punho com halteres/martelo (pronossupinação)': {
    videoId: 'ykJmrZ5v0Oo',
    canal: 'ScottHermanFitness',
  },

  // ── Pernas / inferiores (Record + compacto) ─────────────────────────────
  'agachamento livre com barra nas costas (back squat)': {
    videoId: 'ultWZbUMPL8',
    canal: 'Jeff Nippard',
  },
  'agachamento livre com barra na frente (front squat)': {
    videoId: 'vQ39iZRwlO0',
    canal: 'Jeff Nippard',
  },
  'agachamento zercher': { videoId: '4h8cKbEg7u4', canal: 'Renaissance Periodization' },
  'agachamento taça (goblet squat) com halter ou kettlebell': {
    videoId: '6EmVFAfi8C4',
    canal: 'Renaissance Periodization',
  },
  'agachamento sumô com barra': { videoId: 'b2BRCmNywsQ', canal: 'Renaissance Periodization' },
  'agachamento sumô com halter sobre steps': {
    videoId: 'b2BRCmNywsQ',
    canal: 'Renaissance Periodization',
  },
  'agachamento búlgaro com barra ou halteres': { videoId: '2C-uNgKwPLE', canal: 'Jeff Nippard' },
  'agachamento búlgaro com halteres': { videoId: '2C-uNgKwPLE', canal: 'Jeff Nippard' },
  'agachamento búlgaro com barra': { videoId: '2C-uNgKwPLE', canal: 'Jeff Nippard' },
  'agachamento búlgaro com barra nas costas': { videoId: '2C-uNgKwPLE', canal: 'Jeff Nippard' },
  'agachamento sissy (sissy squat)': { videoId: 'Iy8pIsbFJbU', canal: 'Renaissance Periodization' },
  'agachamento sissy livre (peso corporal)': {
    videoId: 'Iy8pIsbFJbU',
    canal: 'Renaissance Periodization',
  },
  'agachamento anderson (pausa no fundo, saindo dos pinos)': {
    videoId: 'ultWZbUMPL8',
    canal: 'Jeff Nippard',
  },
  'agachamento com barra na nuca em smith': { videoId: 'ylE0RDb5yAg', canal: 'ScottHermanFitness' },
  'agachamento em smith com pés à frente': { videoId: 'ylE0RDb5yAg', canal: 'ScottHermanFitness' },
  'agachamento frontal no smith': { videoId: 'ylE0RDb5yAg', canal: 'ScottHermanFitness' },
  'agachamento sumô com anilha ou halter (goblet ou sumô)': {
    videoId: 'b2BRCmNywsQ',
    canal: 'Renaissance Periodization',
  },
  'agachamento na máquina hack': { videoId: 'izL3oT3Z1mI', canal: 'Jeff Nippard' },
  'agachamento na máquina multipower para idosos/iniciantes': {
    videoId: 'ylE0RDb5yAg',
    canal: 'ScottHermanFitness',
  },
  'supino reto 45° na máquina hack invertida': {
    videoId: 'IZxyjW7MPJQ',
    canal: 'ScottHermanFitness',
  },
  'agachamento pistola (pistol squat) livre': {
    videoId: '3l3jUmFAOnw',
    canal: 'Renaissance Periodization',
  },
  'agachamento cossaco com peso corporal ou kettlebell': {
    videoId: 'wiaDCDQMDZo',
    canal: 'Renaissance Periodization',
  },
  'agachamento no banco (box squat) com barra': {
    videoId: 'G3hbI6gC9E4',
    canal: 'Renaissance Periodization',
  },
  'agachamento no smith machine': { videoId: 'ylE0RDb5yAg', canal: 'ScottHermanFitness' },
  'step-up (subida no banco) com halteres': {
    videoId: '5BfWCcQf1vI',
    canal: 'Renaissance Periodization',
  },
  'leg press 45°': { videoId: 'IZxyjW7MPJQ', canal: 'ScottHermanFitness' },
  'leg press 45° tradicional': { videoId: 'IZxyjW7MPJQ', canal: 'ScottHermanFitness' },
  'leg press horizontal': { videoId: 'IZxyjW7MPJQ', canal: 'ScottHermanFitness' },
  'leg press 45° com pés altos na plataforma': {
    videoId: 'IZxyjW7MPJQ',
    canal: 'ScottHermanFitness',
  },
  'leg press 45° com pés baixos na plataforma': {
    videoId: 'IZxyjW7MPJQ',
    canal: 'ScottHermanFitness',
  },
  'leg press unilateral': { videoId: 'IZxyjW7MPJQ', canal: 'ScottHermanFitness' },
  'hack em pé (vertical leg press)': { videoId: 'IZxyjW7MPJQ', canal: 'ScottHermanFitness' },
  'hack inclinado com pausa': { videoId: 'IZxyjW7MPJQ', canal: 'ScottHermanFitness' },
  'hack squat em máquina': { videoId: 'izL3oT3Z1mI', canal: 'Jeff Nippard' },
  'avanço caminhando (walking lunge)': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'afundo com halteres (lunge)': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'afundo andando com halteres (walking lunge)': {
    videoId: 'QOVaHwm-Q6U',
    canal: 'ScottHermanFitness',
  },
  'afundo com halteres caminhando (walking lunge)': {
    videoId: 'QOVaHwm-Q6U',
    canal: 'ScottHermanFitness',
  },
  'afundo cruzado (curtsy lunge)': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'afundo com barra nas costas': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'afundo lateral com halter ou anilha': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'afundo lateral na polia baixa': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'passada lateral com step ou banco': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'afundo reverso (reverse lunge)': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'afundo com déficit (pé dianteiro elevado)': {
    videoId: 'QOVaHwm-Q6U',
    canal: 'ScottHermanFitness',
  },
  'passada estática no lugar com halteres': { videoId: 'QOVaHwm-Q6U', canal: 'ScottHermanFitness' },
  'levantamento terra convencional com barra': { videoId: 'r4MzjtBwARY', canal: 'Jeff Nippard' },
  'levantamento terra sumô com barra': { videoId: 'r4MzjtBwARY', canal: 'Jeff Nippard' },
  'levantamento terra romeno (rdl) com barra': { videoId: 'JCtzUYI2vfU', canal: 'Jeff Nippard' },
  'levantamento terra romeno unilateral com halter': {
    videoId: 'JCtzUYI2vfU',
    canal: 'Jeff Nippard',
  },
  'stiff com barra': { videoId: 'jEyCzb3R-eA', canal: 'ScottHermanFitness' },
  'stiff com halteres': { videoId: 'jEyCzb3R-eA', canal: 'ScottHermanFitness' },
  'good morning (bom-dia) com barra nas costas': {
    videoId: 'Tu_XTSzH8LI',
    canal: 'ScottHermanFitness',
  },
  'kettlebell swing bilateral (estilo russo)': { videoId: 'YSxHifyI6s8', canal: 'Jeff Nippard' },
  'kettlebell swing unilateral': { videoId: 'YSxHifyI6s8', canal: 'Jeff Nippard' },
  'elevação pélvica (hip thrust) com barra no banco': {
    videoId: 'LM8XHLYJoYs',
    canal: 'Jeff Nippard',
  },
  'elevação pélvica unilateral no chão com halter': {
    videoId: 'LM8XHLYJoYs',
    canal: 'Jeff Nippard',
  },
  'máquina de glute drive específica': { videoId: 'LM8XHLYJoYs', canal: 'Jeff Nippard' },
  'ponte de glúteos no solo (glute bridge) com anilha': {
    videoId: 'LM8XHLYJoYs',
    canal: 'Jeff Nippard',
  },
  'flexão nórdica reversa para quadríceps': {
    videoId: 'uYn2yF0uW3A',
    canal: 'Renaissance Periodization',
  },
  'flexão nórdica para isquiotibiais (peso corporal)': {
    videoId: 'uYn2yF0uW3A',
    canal: 'Renaissance Periodization',
  },
  'cadeira extensora bilateral': { videoId: '0T3Sx8xVvW4', canal: 'ScottHermanFitness' },
  'cadeira extensora unilateral': { videoId: '0T3Sx8xVvW4', canal: 'ScottHermanFitness' },
  'mesa flexora deitada': { videoId: '1Tq3QdCYU5U', canal: 'ScottHermanFitness' },
  'cadeira flexora sentada': { videoId: '1Tq3QdCYU5U', canal: 'ScottHermanFitness' },
  'flexora vertical em pé unilateral': { videoId: '1Tq3QdCYU5U', canal: 'ScottHermanFitness' },
  'cadeira abdutora de quadril': { videoId: 'IxuGRvA9b7o', canal: 'Renaissance Periodization' },
  'cadeira adutora de quadril': { videoId: 'IxuGRvA9b7o', canal: 'Renaissance Periodization' },
  'abdução de quadril na polia baixa': {
    videoId: 'IxuGRvA9b7o',
    canal: 'Renaissance Periodization',
  },
  'adução de quadril na polia baixa': {
    videoId: 'IxuGRvA9b7o',
    canal: 'Renaissance Periodization',
  },
  'coice de glúteo na polia baixa com tornozeleira': {
    videoId: 'IxuGRvA9b7o',
    canal: 'Renaissance Periodization',
  },
  'flexão de quadril na polia com tornozeleira (foco em psoas)': {
    videoId: 'IxuGRvA9b7o',
    canal: 'Renaissance Periodization',
  },
  'elevação de panturrilha em pé no aparelho/smith': {
    videoId: '-M4-G8p8fmc',
    canal: 'ScottHermanFitness',
  },
  'elevação de panturrilha sentado na máquina (foco no sóleo)': {
    videoId: '-M4-G8p8fmc',
    canal: 'ScottHermanFitness',
  },
  'elevação de panturrilha no leg press': { videoId: '-M4-G8p8fmc', canal: 'ScottHermanFitness' },

  // ── Core ────────────────────────────────────────────────────────────────
  'abdominal supra na máquina': { videoId: 'DHD1-2P94DI', canal: 'Athlean-X' },
  'abdominal supra no solo (crunch)': { videoId: 'DHD1-2P94DI', canal: 'Athlean-X' },
  'abdominal supra no solo com pernas elevadas (pernas em mesa)': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal solo com joelhos flexionados e braços cruzados': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal solo com joelhos flexionados e braços puxados de lado': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal solo com braços para cima (reto superior)': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal remador com peso (crunch com anilha): anilha no peito, pés no chão': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra no solo com pernas em mesa e braços puxados de lado': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra no solo com pernas em mesa e braços cruzados': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra com joelhos flexionados e braços atrás da cabeça': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra com joelhos flexionados e braços atrás da cabeça com pernas em mesa': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra com braços cruzados sobre o peito, pernas em mesa e lombar apoiada': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal remador com anilha, pés no chão, braços cruzados sobre o peito': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal remador com anilha, pés no chão, braços atrás da cabeça': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra com braços puxados de lado, joelhos flexionados e lombar apoiada': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra com braços cruzados, pernas em mesa e lombar apoiada': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra com braços puxados de lado, pernas em mesa, lombar apoiada': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal supra com braços atrás da cabeça, pernas em mesa, lombar apoiada': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'abdominal remador com anilha, pés no chão, braços atrás da cabeça (variante mesa)': {
    videoId: 'DHD1-2P94DI',
    canal: 'Athlean-X',
  },
  'prancha isométrica': { videoId: 'pSHjT_CQ-20', canal: 'Athlean-X' },
  'prancha lateral': { videoId: 'pSHjT_CQ-20', canal: 'Athlean-X' },
  'abdominal bicicleta': { videoId: '9FGlEx5AEEs', canal: 'Athlean-X' },
  'elevação de pernas suspenso': { videoId: 'PRvddwZz2F0', canal: 'Athlean-X' },
  'russian twist': { videoId: 'NePICRMPJx0', canal: 'Athlean-X' },
}

// Chaves já normalizadas uma única vez, para busca direta por normalizarNome.
export const MAPA_VIDEOS: Record<string, VideoInfo> = Object.fromEntries(
  Object.entries(VIDEOS).map(([chave, valor]) => [normalizarNome(chave), valor]),
)

/** Busca o vídeo pelo nome do exercício (normalizado). */
export function buscarVideo(nome: string): VideoInfo | undefined {
  if (!nome) return undefined
  return MAPA_VIDEOS[normalizarNome(nome)]
}
