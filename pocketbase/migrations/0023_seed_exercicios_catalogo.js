migrate(
  (app) => {
    const exerciciosCol = app.findCollectionByNameOrId('exercicios')

    const lista = [
      // 1. Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)
      // Agachamentos e Joelho-Dominantes
      {
        nome: 'Agachamento livre com barra nas costas (Back Squat)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento frontal com barra (Front Squat)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento Zercher',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento taça (Goblet Squat) com halter ou kettlebell',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento sumô com barra',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento sumô com halter sobre steps',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento búlgaro com halteres',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento búlgaro com barra',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Avanço caminhando (Walking Lunge)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Passada estática no lugar com halteres',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Afundo reverso (Reverse Lunge)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Afundo com déficit (pé dianteiro elevado)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento pistola (Pistol Squat) livre',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento cossaco com peso corporal ou kettlebell',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento Sissy livre (peso corporal)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Agachamento no banco (Box Squat) com barra',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },
      {
        nome: 'Step-up (subida no banco) com halteres',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Agachamentos e Joelho-Dominantes',
      },

      // Quadril-Dominantes e Cadeia Posterior
      {
        nome: 'Levantamento terra convencional com barra',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Levantamento terra sumô com barra',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Levantamento terra romeno (RDL) com barra',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Levantamento terra romeno unilateral com halter',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Stiff com barra',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Stiff com halteres',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Elevação pélvica (Hip Thrust) com barra no banco',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Elevação pélvica unilateral no chão com halter',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Good Morning (bom-dia) com barra nas costas',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Kettlebell Swing bilateral (estilo russo)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Kettlebell Swing unilateral',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Ponte de glúteos no solo (Glute Bridge) com anilha',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Flexão nórdica reversa para quadríceps',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },
      {
        nome: 'Flexão nórdica para isquiotibiais (peso corporal)',
        cat: 'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
        sub: 'Quadril-Dominantes e Cadeia Posterior',
      },

      // 2. Membros Inferiores — Máquinas e Polias
      {
        nome: 'Leg press 45° tradicional',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Leg press horizontal',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Hack Squat em máquina',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Agachamento no Smith machine',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Cadeira extensora bilateral',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Cadeira extensora unilateral',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Mesa flexora deitada',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Cadeira flexora sentada',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Flexora vertical em pé unilateral',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Cadeira abdutora de quadril',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Cadeira adutora de quadril',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Elevação de panturrilha em pé no aparelho/Smith',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Elevação de panturrilha sentado na máquina (foco no sóleo)',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Elevação de panturrilha no Leg Press',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Coice de glúteo na polia baixa com tornozeleira',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Abdução de quadril na polia baixa',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Adução de quadril na polia baixa',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Flexão de quadril na polia com tornozeleira (foco em psoas)',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },
      {
        nome: 'Máquina de Glute Drive específica',
        cat: 'Membros Inferiores — Máquinas e Polias',
        sub: 'Máquinas e Polias',
      },

      // 3. Membros Superiores — Peito, Ombros e Tríceps (Empurrar)
      // Peitoral (Barras, Halteres e Máquinas)
      {
        nome: 'Supino reto com barra',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Supino reto com halteres',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Supino inclinado a 30° com halteres',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Supino inclinado a 45° com barra',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Supino declinado com barra',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Supino declinado com halteres',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Crucifixo reto com halteres',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Crucifixo inclinado com halteres',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Floor Press com halteres (no chão)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Flexão de braço tradicional (Push-up)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Flexão de braço com pés elevados (declinada)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Flexão de braço diamante (foco em tríceps e miolo do peito)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Supino convergente articulado na máquina',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Supino inclinado em máquina articulada',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Peck Deck / Voador peitoral na máquina',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Crossover polia alta (fase inferior)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Crossover polia média (fase medial)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Crossover polia baixa (fase clavicular)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Mergulho nas barras paralelas (Dips) livre',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },
      {
        nome: 'Mergulho nas paralelas com sobrecarga (cinto/anilha)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Peitoral',
      },

      // Deltoides e Trapézio
      {
        nome: 'Desenvolvimento militar com barra em pé (Overhead Press)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Desenvolvimento com halteres sentado',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Desenvolvimento Arnold com halteres',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Desenvolvimento em máquina articulada',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Elevação lateral com halteres em pé',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Elevação lateral sentado',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Elevação lateral unilateral na polia baixa',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Elevação frontal com barra pronada',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Elevação frontal com halteres neutra',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Elevação frontal no cabo com corda',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Crucifixo invertido com halteres em banco inclinado',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Voador invertido na máquina (Reverse Peck Deck)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Remada alta com pegada aberta na barra ou polia',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Encolhimento de ombros com barra pela frente',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Encolhimento com halteres ao lado do corpo',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },
      {
        nome: 'Face Pull na polia média/alta com corda',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Deltoides e Trapézio',
      },

      // Tríceps
      {
        nome: 'Tríceps testa com barra W no banco reto',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps testa inclinado com halteres',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps francês com halter bilateral',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps francês unilateral com halter',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps coice com halter',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps corda na polia alta',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps barra reta na polia alta',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps barra V na polia alta',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps unilateral pegada invertida na polia',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Tríceps testa na polia com corda',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Mergulho no banco (Bench Dip) com peso sobre as pernas',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },
      {
        nome: 'Supino fechado com barra (Close-grip Bench Press)',
        cat: 'Membros Superiores — Peito, Ombros e Tríceps (Empurrar)',
        sub: 'Tríceps',
      },

      // 4. Membros Superiores — Costas, Bíceps e Antebraço (Puxar)
      // Dorsais e Trapézio Médio/Inferior
      {
        nome: 'Barra fixa pegada pronada aberta (Pull-up)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Barra fixa pegada supinada (Chin-up)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Barra fixa pegada neutra',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Puxada frontal aberta no pulley',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Puxada fechada com triângulo no pulley',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Puxada articulada unilateral na máquina',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Pulldown com braços estendidos na polia alta (barra reta ou corda)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada curvada com barra pegada pronada',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada curvada com barra pegada supinada (Yates Row)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada serrote unilateral com halter',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada cavalinho com barra em T',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada baixa no cabo com triângulo',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada aberta na polia baixa com barra romana',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada apoiada no peito em banco inclinado com halteres',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada articulada baixa em máquina',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },
      {
        nome: 'Remada invertida na barra fixa (Australian Pull-up)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Dorsais e Costas',
      },

      // Bíceps e Antebraço
      {
        nome: 'Rosca direta com barra reta',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca direta com barra W',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca alternada com halteres com rotação',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca martelo com halteres em pé',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca martelo na corda na polia baixa',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca concentrada com halter',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca Scott com barra W no banco específico',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca Scott na máquina',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca inclinada em 45° com halteres no banco',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca aranha (Spider Curl) no banco inclinado',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca bíceps bilateral na polia alta (Hercules Curl)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca inversa com barra reta (foco em braquiorradial)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca de punho com barra sobre o banco (flexores)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rosca de punho inversa com barra (extensores)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },
      {
        nome: 'Rotação de punho com halteres/martelo (pronossupinação)',
        cat: 'Membros Superiores — Costas, Bíceps e Antebraço (Puxar)',
        sub: 'Bíceps e Antebraço',
      },

      // 5. Core, Abdômen e Estabilidade Lombar
      {
        nome: 'Prancha ventral isométrica tradicional no solo',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Prancha lateral estática',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Prancha lateral com abdução da perna superior (estrela)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Prancha com toques nos ombros (Shoulder Taps)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Prancha RKC de alta tensão',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Ab Wheel Rollout (roda abdominal no solo)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Ab Wheel Rollout em pé (nível avançado)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Dead Bug (inseto morto) com membros contralaterais',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Bird Dog (perdigueiro) no solo com isometria',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Hollow Body Hold (canoa no solo)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Elevação de pernas suspensa na barra fixa (Hanging Leg Raise)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Elevação de joelhos na barra fixa (Knee Raise)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Abdominal reto no solo com pernas elevadas',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Abdominal canivete no solo (V-Up)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Abdominal supra na bola suíça',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Abdominal infra na paralela',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Russian Twist com anilha ou bola medicinal',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Pallof Press no cabo com isometria',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Pallof Press com rotação dinâmica',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Woodchopper (lenhador) diagonal descendente na polia',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Woodchopper diagonal ascendente na polia',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Rotação russa no solo com barra (Landmine Rotations)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Extensão lombar no banco romano a 45°',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: 'Extensão lombar unilateral no banco a 45°',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Estabilidade Core',
      },
      {
        nome: "Caminhada do fazendeiro (Farmer's Walk) com halteres pesados",
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Transporte e Pegada',
      },
      {
        nome: 'Caminhada da mala (Suitcase Carry - unilateral)',
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Transporte e Pegada',
      },
      {
        nome: "Caminhada do garçom (Waiter's Walk - halter acima da cabeça)",
        cat: 'Core, Abdômen e Estabilidade Lombar',
        sub: 'Transporte e Pegada',
      },

      // 6. Treinamento Funcional e Calistenia Dinâmica
      {
        nome: 'Burpee tradicional com salto',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Mountain Climbers (alpinista no solo)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Thruster com halteres (agachamento seguido de desenvolvimento)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Thruster com barra',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Devil Press com halteres',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Snatch unilateral com kettlebell (arranque)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Clean and Jerk com halteres ou kettlebells',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Turkish Get-Up (levantamento turco) com kettlebell',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Bear Crawl (rastreio do urso) para frente e para trás',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Crab Walk (caminhada do caranguejo)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Inchworm (minhoca - caminhada com as mãos a partir da flexão)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Wall Ball (arremesso de medicine ball na parede com agachamento)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Slam Ball (arremesso explosivo de bola no solo)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Battle Rope: ondas alternadas',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Battle Rope: batidas duplas simultâneas (Double Slams)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Empurrar trenó de carga (Sled Push)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Puxar trenó de carga de costas (Sled Drag)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Balanço na fita de suspensão (TRX): remada invertida',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Suspensão (TRX)',
      },
      {
        nome: 'TRX: flexão de braço suspensa',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Suspensão (TRX)',
      },
      {
        nome: 'TRX: flexão de joelhos para isquiotibiais (Hamstring Curl)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Suspensão (TRX)',
      },
      {
        nome: 'Pular corda tradicional (velocidade constante)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },
      {
        nome: 'Salto duplo de corda (Double Under)',
        cat: 'Treinamento Funcional e Calistenia Dinâmica',
        sub: 'Funcional e Calistenia',
      },

      // 7. Pliometria e Treinamento de Salto
      {
        nome: 'Salto na caixa pliométrica (Box Jump)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Salto em profundidade (Depth Jump para reatividade elástica)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Salto vertical com contramovimento (CMJ)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Salto horizontal a partir da estática (Broad Jump)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Saltos horizontais contínuos em passada longa (Bounding)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Saltos laterais de patinador (Skater Jumps)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Salto no caixote com aterrissagem unilateral',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Agachamento com salto (Jump Squat) contínuo',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Afundo pliométrico alternado com troca no ar (Jumping Lunges)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Saltos agrupados no lugar com joelhos no peito (Tuck Jumps)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Salto unilateral sobre cones/obstáculos baixos',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Flexão pliométrica com bater de palmas (Clapping Push-Up)',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Lançamento de medicine ball de peito contra parede com explosão',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Lançamento rotacional explosivo de medicine ball contra parede',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },
      {
        nome: 'Salto em zigue-zague com parada em equilíbrio',
        cat: 'Pliometria e Treinamento de Salto',
        sub: 'Saltos e Explosão',
      },

      // 8. Equilíbrio, Propriocepção e Estabilidade Articular
      {
        nome: 'Apoio unípode estático em olhos abertos',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Apoio unípode estático com olhos fechados',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Apoio unípode sobre disco de equilíbrio (Balance Pad)',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Agachamento unilateral no Bosu invertido (base rígida para cima)',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Caminhada em linha reta ponta-calcanhar (Tandem Walk)',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Estrela de alcance com os pés em apoio unípode (Star Excursion Balance)',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Levantamento terra romeno unípode sem carga (foco no tornozelo e quadril)',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Passe de bola em pé unípode contra a parede',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Agachamento sobre balanço de prancha de instabilidade (Wobble Board)',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Prancha com cotovelos apoiados sobre a bola suíça',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Prancha ventral com pés apoiados na bola suíça',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Ponte de glúteos unilateral com pé apoiado no Bosu',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },
      {
        nome: 'Flexão de braços com mãos apoiadas em bola medicinal',
        cat: 'Equilíbrio, Propriocepção e Estabilidade Articular',
        sub: 'Propriocepção',
      },

      // 9. Exercícios com Elásticos (Minibands e Superbands)
      {
        nome: 'Caminhada lateral com miniband nos joelhos (Monster Walk)',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Caminhada lateral com miniband nos tornozelos',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Ostra (Clamshell) com miniband em decúbito lateral',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Ponte de glúteos com abdução no topo usando miniband',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Extensão de quadril de quatro apoios com mini elástico',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Agachamento livre com miniband acima dos joelhos (ativação de glúteo médio)',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Afastamento escapular horizontal com elástico (Band Pull-Apart)',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Rotação externa de ombro com cotovelo a 90° fixo ao corpo',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Rotação interna de ombro com elástico fixado na maçaneta/poste',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Desenvolvimento de ombros com superband sob os pés',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Remada sentada no solo com elástico preso nos pés',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Flexão de braço resistida com elástico passado nas costas',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Agachamento com superband sob os pés e sobre os ombros',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Boa-noite (Good Morning) com superband',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Extensão de tríceps acima da cabeça com elástico ancorado',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },
      {
        nome: 'Rosca bíceps com elástico pisado',
        cat: 'Exercícios com Elásticos (Minibands e Superbands)',
        sub: 'Elásticos',
      },

      // 10. Mobilidade Articular e Flexibilidade Ativa
      // Tornozelo e Quadril
      {
        nome: 'Mobilidade de tornozelo na parede em avanço (foco em dorsiflexão)',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },
      {
        nome: 'Mobilidade de dorsiflexão com elástico puxando o tálus',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },
      {
        nome: 'Rotação interna e externa de quadril sentada no solo (posição 90/90)',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },
      {
        nome: 'Transição fluida de quadril 90/90 para o outro lado sem as mãos',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },
      {
        nome: 'Alongamento do sapo (Frog Stretch) para adutores',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },
      {
        nome: 'Alongamento ativo do flexor do quadril em meio ajoelhado (Couch Stretch)',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },
      {
        nome: 'Mobilidade de rotação de quadril em quatro apoios (CARs de quadril)',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },
      {
        nome: 'Postura do pombo ativa (Pigeon Pose)',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Tornozelo e Quadril',
      },

      // Coluna Torácica e Ombros
      {
        nome: 'Rotação torácica em quatro apoios com mão na nuca',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Gato-Camelo (Cat-Cow) em quatro apoios para mobilidade espinhal',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Rotação torácica sentado com cotovelos em bloco',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Enfiando a linha na agulha (Thread the Needle) em quatro apoios',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Mobilidade de extensão torácica sobre o rolo de espuma (Foam Roller)',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Rotação articular controlada (CARs) de ombro em pé',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Deslocamento de ombros com bastão/vassoura para trás e para frente',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Alongamento peitoral no batente da porta com flexão de cotovelo',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },
      {
        nome: 'Anjo na parede (Wall Angel) com contato de punhos e cotovelos',
        cat: 'Mobilidade Articular e Flexibilidade Ativa',
        sub: 'Coluna Torácica e Ombros',
      },

      // 11. Reabilitação Fisioterapêutica e Ativações Terapêuticas
      // Complexo do Ombro e Manguito Rotador
      {
        nome: 'Exercícios pendulares de Codman (alívio e descompressão articular)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Complexo do Ombro e Manguito Rotador',
      },
      {
        nome: 'Exercício em "W" e "Y" no solo (Prone Y-T-W) para trapézio inferior e romboides',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Complexo do Ombro e Manguito Rotador',
      },
      {
        nome: 'Rotação externa em decúbito lateral com halter de 1 kg',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Complexo do Ombro e Manguito Rotador',
      },
      {
        nome: 'Deslize escapular na parede (Serrated Wall Slides) com elevação',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Complexo do Ombro e Manguito Rotador',
      },
      {
        nome: 'Push-up Plus (prancha com protrusão máxima de escápula para serrátil anterior)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Complexo do Ombro e Manguito Rotador',
      },
      {
        nome: 'Rotação externa em 90° de abdução no cabo (plano de elevação)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Complexo do Ombro e Manguito Rotador',
      },

      // Joelho, Quadril e Pelve
      {
        nome: 'Isometria de quadríceps em extensão completa contra toalha/rolo sob o joelho',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Joelho, Quadril e Pelve',
      },
      {
        nome: 'Elevação de perna reta (Straight Leg Raise - SLR) no solo',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Joelho, Quadril e Pelve',
      },
      {
        nome: 'Ponte de glúteos isométrica com bola entre os joelhos (estabilidade pélvica)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Joelho, Quadril e Pelve',
      },
      {
        nome: 'Deslizamento de calcanhar no solo (Heel Slides) pós-artroplastia/lesão ligamentar',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Joelho, Quadril e Pelve',
      },
      {
        nome: 'Agachamento espanhol (Spanish Squat) com elástico na fossa poplítea (foco em tendão patelar)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Joelho, Quadril e Pelve',
      },
      {
        nome: 'Descida excêntrica de degrau (Step-down) focando em alinhamento de valgo dinâmico',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Joelho, Quadril e Pelve',
      },
      {
        nome: 'Fortalecimento de tibial anterior com elevação de pontas dos pés no solo',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Joelho, Quadril e Pelve',
      },

      // Coluna e Região Cervical/Lombar
      {
        nome: 'Ativação isométrica do transverso abdominal (manobra de Drawing-in)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Coluna e Região Cervical/Lombar',
      },
      {
        nome: 'Retração cervical (Chin Tuck) contra a parede para alívio de dor cervical',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Coluna e Região Cervical/Lombar',
      },
      {
        nome: 'Extensão de tronco em prono estilo McKenzie (esfinge)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Coluna e Região Cervical/Lombar',
      },
      {
        nome: 'Flexão lombar em decúbito dorsal trazendo os joelhos ao peito (posição de Williams)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Coluna e Região Cervical/Lombar',
      },
      {
        nome: 'Ponte com calcanhares estendidos em isometria suave (ativação sem carga compressiva)',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Coluna e Região Cervical/Lombar',
      },
      {
        nome: 'Isometria lombar com cinto ou faixa contra a parede',
        cat: 'Reabilitação Fisioterapêutica e Ativações Terapêuticas',
        sub: 'Coluna e Região Cervical/Lombar',
      },
    ]

    for (let i = 0; i < lista.length; i++) {
      const item = lista[i]
      try {
        app.findFirstRecordByData('exercicios', 'nome', item.nome)
      } catch (_) {
        const rec = new Record(exerciciosCol)
        rec.set('nome', item.nome)
        rec.set('categoria', item.cat)
        rec.set('subcategoria', item.sub || '')
        rec.set('link', '')
        rec.set('descricao', '')
        app.save(rec)
      }
    }
  },
  (app) => {
    // Reversão opcional de dados
  },
)
