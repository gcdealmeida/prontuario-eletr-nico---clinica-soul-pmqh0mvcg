// Aliases: nomes alternativos/sinônimos que a busca por tokens não resolve
// (variações de vocabulário, ex. "frontal" vs "na frente", elástico vs barra).
// Chave e valor JÁ NORMALIZADOS (normalizarNome: minúsculo, sem acentos).
// Se o alvo não existir no dicionário, a busca continua (por tokens e vídeo).

export const ALIAS_NOMES: Record<string, string> = {
  // ── Peito ────────────────────────────────────────────────────────────────
  'supino reto': 'supino reto com barra',
  'supino inclinado': 'supino inclinado a 30° com halteres',
  'supino inclinado com halteres': 'supino inclinado a 30° com halteres',
  'supino inclinado com barra': 'supino inclinado a 45° com barra',
  'supino declinado': 'supino declinado com barra',

  // ── Pernas ───────────────────────────────────────────────────────────────
  'agachamento frontal': 'agachamento livre com barra na frente (front squat)',
  'agachamento frontal com barra': 'agachamento livre com barra na frente (front squat)',
  'agachamento frontal com barra (front squat)':
    'agachamento livre com barra na frente (front squat)',
  'agachamento bulgaro': 'agachamento bulgaro com barra ou halteres',
  'agachamento livre com miniband acima dos joelhos (ativacao de gluteo medio)':
    'agachamento livre com barra nas costas (back squat)',
  'agachamento com superband sob os pes e sobre os ombros':
    'agachamento livre com barra nas costas (back squat)',
  'descida excentrica de degrau (step-down) focando em alinhamento de valgo dinamico':
    'step-up (subida no banco) com halteres',

  // ── Costas / elásticos ───────────────────────────────────────────────────
  'remada sentada no solo com elastico preso nos pes': 'remada baixa no cabo com triangulo',
  'desenvolvimento de ombros com superband sob os pes':
    'desenvolvimento militar com barra em pe (overhead press)',
  'boa-noite (good morning) com superband': 'good morning (bom-dia) com barra nas costas',
  'rosca biceps com elastico pisado': 'rosca direta com barra reta',
  'extensao de triceps acima da cabeca com elastico ancorado':
    'triceps frances com halter bilateral',
  'flexao de braco resistida com elastico passado nas costas':
    'flexao de braco tradicional (push-up)',

  // ── Core ─────────────────────────────────────────────────────────────────
  'abdominal reto': 'abdominal supra no solo (crunch)',
  'abdominal reto no solo com pernas elevadas':
    'abdominal supra no solo com pernas elevadas (pernas em mesa)',
  'elevacao de pernas suspensa na barra fixa (hanging leg raise)': 'elevacao de pernas suspenso',
  'elevacao de joelhos na barra fixa (knee raise)': 'elevacao de pernas suspenso',

  // ── Mobilidade / reabilitação (mesmo padrão de movimento) ────────────────
  'mobilidade de dorsiflexao com elastico puxando o talus':
    'mobilidade de tornozelo na parede em avanco (foco em dorsiflexao)',
  'rotacao toracica sentado com cotovelos em bloco':
    'rotacao toracica em quatro apoios com mao na nuca',
  'transicao fluida de quadril 90/90 para o outro lado sem as maos':
    'rotacao interna e externa de quadril sentada no solo (posicao 90/90)',
}
