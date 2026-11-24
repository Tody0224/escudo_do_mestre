// =========================================================================
// CONSTANTES E MECÂNICAS DO PLAYTEST BETA 1.2 DE ORDEM PARANORMAL II
// =========================================================================
const ORDEM_ATTRIBUTES = ["Físico", "Mente", "Emoção"];

const ORDEM_SKILLS_META = [
  { key: "Acrobacia", attr: "Físico" },
  { key: "Animais", attr: "Emoção" },
  { key: "Aptidão", attr: "Mente" },
  { key: "Atletismo", attr: "Físico" },
  { key: "Bruxaria", attr: "Mente" },
  { key: "Crime", attr: "Físico" },
  { key: "Disciplina", attr: "Emoção" },
  { key: "Enganação", attr: "Emoção" },
  { key: "Furtividade", attr: "Físico" },
  { key: "Inspecionar", attr: "Mente" },
  { key: "Intimidar", attr: "Emoção" },
  { key: "Intuição", attr: "Emoção" },
  { key: "Luta", attr: "Físico" },
  { key: "Medicina", attr: "Mente" },
  { key: "Ofício", attr: "Mente" },
  { key: "Percepção", attr: "Mente" },
  { key: "Persuasão", attr: "Emoção" },
  { key: "Pontaria", attr: "Físico" },
  { key: "Sobrevivência", attr: "Mente" },
  { key: "Vigor", attr: "Físico" }
];

// Lista exata das 20 perícias do Playtest Beta 1.2 para a ficha imprimível (todas iniciam em d4)
const SHEET_SKILLS_LIST = ORDEM_SKILLS_META.map((s) => s.key);

const SHEET_COLOR_PRESETS = [
  { name: "Rosa", accent: "#db2777", soft: "#fdf2f8" },
  { name: "Vermelho", accent: "#dc2626", soft: "#fef2f2" },
  { name: "Roxo", accent: "#7c3aed", soft: "#f5f3ff" },
  { name: "Laranja", accent: "#ea580c", soft: "#fff7ed" },
  { name: "Amarelo", accent: "#ca8a04", soft: "#fefce8" },
  { name: "Turquesa", accent: "#0d9488", soft: "#f0fdfa" },
  { name: "Verde", accent: "#15803d", soft: "#f0fdf4" },
  { name: "Azul", accent: "#2563eb", soft: "#eff6ff" }
];

const DIE_LEVELS = [
  { value: 4, label: "4 (d4)" },
  { value: 6, label: "6 (d6)" },
  { value: 8, label: "8 (d8)" },
  { value: 10, label: "10 (d10)" },
  { value: 12, label: "12 (d12)" },
  { value: 20, label: "20 (d20)" }
];

const ORDEM_DTS = [
  { value: 6, label: "DT 6 — Fácil / Cautelosa" },
  { value: 7, label: "DT 7 — Padrão do Sistema" },
  { value: 8, label: "DT 8 — Moderada / Rápida" },
  { value: 10, label: "DT 10 — Difícil / Pavor" },
  { value: 12, label: "DT 12 — Muito Difícil" },
  { value: 13, label: "DT 13 — Extrema (+3 sobre Difícil)" }
];

const ELEMENTOS = ["Nenhum", "Sangue", "Morte", "Conhecimento", "Energia", "Medo"];

const ORDEM_MECHANICS = [
  {
    key: "padrao",
    name: "Teste Padrão",
    defaultAttr: "Mente",
    defaultSkill: "Percepção",
    defaultDt: 7,
    rules: "Rola-se 1 dado de Atributo + 1 dado de Perícia e soma-se os resultados contra a DT (padrão 7). Máximo 4 dados rolados por teste, somando até os 3 maiores. Sucesso Crítico: 2+ dados iguais >= 6 (passa automaticamente e soma as 2 maiores rolagens em dano/pontos). Falha Crítica: todos os dados rolarem 1 (ou Dado de Pavor anular todos)."
  },
  {
    key: "esconder",
    name: "Esconder-se (Furtividade)",
    defaultAttr: "Físico",
    defaultSkill: "Furtividade",
    defaultDt: 7,
    rules: "Exige cobertura ou camuflagem e quebra de linha de visão. Rola-se Físico + Furtividade contra a DT do ambiente (padrão 7) ou em teste oposto contra Percepção dos observadores. Enquanto escondido, o próximo ataque deixa o alvo Desprevenido."
  },
  {
    key: "destrancar",
    name: "Destrancar / Sintonizar (Termo de Dados)",
    defaultAttr: "Físico",
    defaultSkill: "Crime",
    defaultDt: 7,
    rules: "O mestre rola em segredo N dados d6 (a quantidade varia conforme a complexidade da tranca). A cada tentativa, o jogador escolhe N valores de 1 a 6 e o mestre responde se cada dado está BAIXO, EXATO ou ALTO. Tentativas por rodada = valor de Crime (d4=1, d6=2, d8=3, d10=4, d12=5). Esgotar o limite máximo danifica a fechadura."
  },
  {
    key: "sustentar",
    name: "Sustentar (Desafio de Acesso)",
    defaultAttr: "Físico",
    defaultSkill: "Atletismo",
    defaultDt: 7,
    rules: "Gasta 1 PV e faz um teste de Atletismo contra a DT para erguer/empurrar algo pesado enquanto aliados agem. No fim de cada rodada extra sustentando, repete o teste de Atletismo com -1 passo acumulativo."
  },
  {
    key: "arrombar",
    name: "Arrombar (Força Bruta)",
    defaultAttr: "Físico",
    defaultSkill: "Atletismo",
    defaultDt: 7,
    rules: "Gasta 1 PV pelo esforço e faz teste de Atletismo contra a DT da fechadura/objeto. Ao passar, soma a Rolagem Alta (RA) até atingir a Pontuação Alvo (PA) definida para a barreira. Pode gerar barulho ou danificar o conteúdo."
  },
  {
    key: "alcancar_segura",
    name: "Alcançar — Forma Segura",
    defaultAttr: "Físico",
    defaultSkill: "Acrobacia",
    defaultDt: 7,
    rules: "Gasta 2 ações em sequência realizando um teste de Acrobacia (DT do ambiente) em cada. Se passar nos dois, alcança ao final da segunda ação. Se falhar em qualquer um, sofre dano igual à Rolagem Baixa (RB) e recomeça."
  },
  {
    key: "alcancar_arriscada",
    name: "Alcançar — Forma Arriscada",
    defaultAttr: "Físico",
    defaultSkill: "Acrobacia",
    defaultDt: 10,
    rules: "Gasta 1 ação e faz teste de Acrobacia com DT do ambiente +3. Se passar, alcança imediatamente. Se falhar, sofre dano igual à Rolagem Alta (RA)."
  },
  {
    key: "equilibrio",
    name: "Equilíbrio (Travessia)",
    defaultAttr: "Físico",
    defaultSkill: "Acrobacia",
    defaultDt: 7,
    rules: "Rola-se 2d10 sem somar. Diferença de 0 ou 1 entre os dois d10 mantém o equilíbrio. Diferença >= 2 inicia queda: pode gastar Dados de Equilíbrio (d4 = metade de Acrobacia: d4->2d4, d6->3d4, d8->4d4, d10->5d4, d12->6d4) somando a um dos d10 (sem ultrapassar o outro d10 por 2+)."
  },
  {
    key: "escalar_rapida",
    name: "Escalar — Forma Rápida",
    defaultAttr: "Físico",
    defaultSkill: "Atletismo",
    defaultDt: 8,
    rules: "Meta padrão de 10 pontos. Ao passar no teste de Atletismo (DT 8), soma a Rolagem Alta (RA) aos pontos acumulados. Se falhar, cai e sofre dano igual aos pontos já acumulados."
  },
  {
    key: "escalar_cautelosa",
    name: "Escalar — Forma Cautelosa",
    defaultAttr: "Físico",
    defaultSkill: "Atletismo",
    defaultDt: 6,
    rules: "Meta padrão de 10 pontos. Ao passar no teste de Atletismo (DT 6), soma a Rolagem Baixa (RB) aos pontos acumulados. Se falhar, cai e sofre dano igual aos pontos já acumulados."
  },
  {
    key: "perseguicao",
    name: "Perseguição (Avançar / Fôlego)",
    defaultAttr: "Físico",
    defaultSkill: "Atletismo",
    defaultDt: 10,
    rules: "Dura 4 rodadas (meta: 25 PA; marcos: 5 PA na 2ª rodada, 15 PA na 3ª, 25 PA na 4ª ou sofre 1d6 dano/rodada). Reserva de Fôlego = metade do Vigor em dados d6 bônus. Avançar (DT 10): ganha RA se passar ou RB se falhar. Esforço Extra: +1 passo perdendo 1d4 PV (+1d4 acumulativo). Carregar Outro: -1 passo para igualar PA do aliado."
  },
  {
    key: "investigacao_examinar",
    name: "Investigação (Investigar / Examinar / Recapitular)",
    defaultAttr: "Mente",
    defaultSkill: "Inspecionar",
    defaultDt: 10,
    rules: "Investigar compara passivamente o dado da perícia com a DT (sem rolar). Depois, pode Observar (outra perícia passiva) ou Examinar (teste ativo; se não revelar informação nova, perde 1 PD). Recapitular (Intuição DT 10) e Compartilhar (Inspecionar DT 10, livre) rendem 1 pista extra cada por cena."
  },
  {
    key: "primeiros_socorros",
    name: "Primeiros Socorros",
    defaultAttr: "Mente",
    defaultSkill: "Medicina",
    defaultDt: 7,
    rules: "Teste de Mente + Medicina (DT 7) remove Moribundo, recupera 1 PV e acorda o alvo. A DT aumenta em +3 a cada uso no mesmo alvo na cena. Sofre -2 passos sem maleta médica ou ao usar em si mesmo."
  },
  {
    key: "teste_lesao",
    name: "Teste de Lesão (0 PV)",
    defaultAttr: "Físico",
    defaultSkill: "Vigor",
    defaultDt: 7,
    rules: "Realizado ao chegar a 0 PV ou no fim de cada rodada Moribundo (Físico + Vigor DT 7, +3 por teste anterior na cena). Crítico: recupera 1 PV e acorda; Sucesso: fica Inconsciente e Moribundo; Falha: rola 1d20 na tabela de Lesões (+1 por patamar acima de iniciante); Falha Crítica: morte."
  },
  {
    key: "teste_trauma",
    name: "Teste de Trauma / Medo (Pavor)",
    defaultAttr: "Emoção",
    defaultSkill: "Disciplina",
    defaultDt: 7,
    rules: "Ao chegar a 0 PD (ou em gatilhos de horror), rola Emoção + Disciplina (DT 7 +3 por trauma na cena, ou DT 10 em sustos). Falha em 0 PD rola 1d20 na tabela de Traumas. Dado de Pavor (d6): anula dados de teste menores que o valor rolado nele até rolar 1, gastar 1 PD (-1 passo) ou 5 PD (converte em dado bônus)."
  },
  {
    key: "manobra_combate",
    name: "Manobra de Combate (Teste Oposto)",
    defaultAttr: "Físico",
    defaultSkill: "Luta",
    defaultDt: 7,
    rules: "Na Fase de Ataques Corpo a Corpo, substitui ataque por teste oposto de Luta contra Acrobacia ou Luta do alvo: Agarrar (imóvel, -1 passo, esmagar causa RA), Derrubar (caído; vencer por 5+ causa RB), Desarmar, Empurrar ou Quebrar item."
  },
  {
    key: "custom",
    name: "Mecânica Personalizada",
    defaultAttr: "Mente",
    defaultSkill: "Percepção",
    defaultDt: 7,
    rules: ""
  }
];

// =========================================================================
// COMPÊNDIO COMPLETO DE REGRAS (ABA DE CONSULTA RÁPIDA DO MESTRE)
// =========================================================================
const ORDEM_RULES_COMPENDIUM = [
  {
    id: "base-testes",
    category: "Testes & Dados",
    title: "1. Testes Básicos, Passos, RA/RB e Críticos",
    summary: "Como rolar Atributo + Perícia, calcular Rolagem Alta/Baixa, Críticos e Falhas Críticas.",
    blocks: [
      {
        subtitle: "Escala de Dados (Passos) e Limites",
        items: [
          "Escala padrão: d4 -> d6 -> d8 -> d10 -> d12 (d20 apenas por efeitos paranormais sobre-humanos).",
          "Teste padrão: Rola-se 1 dado de Atributo + 1 dado de Perícia e soma-se contra a Dificuldade (DT padrão = 7).",
          "Limite de dados: Pode rolar no máximo 4 dados por teste e somar no máximo os 3 maiores resultados.",
          "Ajudar (1 ação): Exige perícia coerente em d6+. Concede +1 passo (perícia d6/d8) ou +2 passos (perícia d10/d12)."
        ]
      },
      {
        subtitle: "Rolagem Alta (RA), Rolagem Baixa (RB) e Críticos",
        items: [
          "RA e RB: São o maior e o menor valor numérico tirado nos dados individuais (independente do tipo do dado).",
          "Sucesso Crítico: 2 ou mais dados mostram o mesmo valor >= 6. Passa automaticamente na DT e soma as 2 maiores rolagens ao dano ou pontos acumulados.",
          "Falha Crítica: Todos os dados rolam 1 (ou o Dado de Pavor anula todos). Falha automaticamente e rola 1d8: (1) Vexame; (2) Físico -1 passo na cena; (3) Mente -1 passo na cena; (4) Emoção -1 passo na cena; (5) Perde 1d4 PV; (6) Perde 1d4 PD; (7) Perde 1 item/recurso; (8) Sem efeito extra."
        ]
      }
    ],
    table: {
      headers: ["DT", "Nível de Dificuldade", "Uso Típico"],
      rows: [
        ["DT 6", "Fácil / Cautelosa", "Escalada cautelosa, pistas óbvias, tarefas simples"],
        ["DT 7", "Padrão do Sistema", "Ataques básicos, testes comuns, Primeiros Socorros e Lesão inicial"],
        ["DT 8", "Moderada / Rápida", "Escalada rápida, pistas ocultas intermediárias"],
        ["DT 10", "Difícil / Pavor", "Perseguição (Avançar), Recapitular, Compartilhar, Presença Aterradora"],
        ["DT 12", "Muito Difícil", "Feitos extremos ou pistas muito bem escondidas"],
        ["DT 13", "Extrema (+3)", "Alcançar arriscado sobre DT 10, alvos em alcance longo ou com cobertura"]
      ]
    }
  },
  {
    id: "pericias-atributos",
    category: "Testes & Dados",
    title: "2. Os 3 Atributos e as 20 Perícias",
    summary: "Referência completa de cada atributo, escala de competência e todas as 20 perícias.",
    blocks: [
      {
        subtitle: "Atributos (Escala d4 a d12)",
        items: [
          "Físico: Força muscular, coordenação motora, velocidade e fôlego.",
          "Mente: Velocidade de raciocínio, educação formal e sentidos.",
          "Emoção: Força de vontade, magnetismo social e instintos.",
          "Referência de escala: d4 (abaixo da média / destreinado), d6 (média humana / treinado), d8 (acima da média / especialista), d10 (mestre), d12 (ápice humano / grão-mestre)."
        ]
      }
    ],
    table: {
      headers: ["Perícia", "Atributo-Base", "Aplicação Principal"],
      rows: [
        ["Acrobacia", "Físico", "Equilíbrio, piruetas, esquiva/defesa, alcançar lugares"],
        ["Animais", "Emoção", "Manejar animais, acalmar feras, cavalgar"],
        ["Aptidão", "Mente", "Conhecimento específico (Artes, Erudição [d6+ = alfabetizado], Folclore, Guerra, Nobreza, Religião)"],
        ["Atletismo", "Físico", "Correr, perseguições, escalar, nadar, arrombar, sustentar peso"],
        ["Bruxaria", "Mente", "Conhecimento sobre magia, rituais e o paranormal"],
        ["Crime", "Físico", "Abrir fechaduras (Termo de Dados), furtar, falsificar"],
        ["Disciplina", "Emoção", "Resistir a traumas, medo, sustos e manter foco"],
        ["Enganação", "Emoção", "Mentir, disfarçar-se, fintar em combate, seduzir"],
        ["Furtividade", "Físico", "Esconder-se, mover-se em silêncio, emboscadas"],
        ["Inspecionar", "Mente", "Analisar evidências, documentos, selos, Compartilhar pistas"],
        ["Intimidar", "Emoção", "Assustar e coagir pessoas"],
        ["Intuição", "Emoção", "Ler intenções, sexto sentido, Recapitular pistas"],
        ["Luta", "Físico", "Ataques corpo a corpo, manobras de combate e defesa corpo a corpo"],
        ["Medicina", "Mente", "Primeiros socorros, tratamentos, identificar ervas/venenos"],
        ["Ofício", "Mente", "Fabricar e reparar itens (Alquimia, Carpintaria, Metalurgia, etc.)"],
        ["Percepção", "Mente", "Notar detalhes por visão/audição/olfato, revistar ambientes"],
        ["Persuasão", "Emoção", "Convencer com retórica e argumentos"],
        ["Pontaria", "Físico", "Ataques à distância com armas de disparo ou arremesso"],
        ["Sobrevivência", "Mente", "Rastrear, orientar-se, acampar"],
        ["Vigor", "Físico", "Testes de Lesão (0 PV), dados de Fôlego em perseguição, resistir a venenos"]
      ]
    }
  },
  {
    id: "investigacao",
    category: "Investigação & Exploração",
    title: "3. Cenas de Investigação e Pistas",
    summary: "Passo a passo de Investigar (passivo), Interagir, Observar, Examinar, Recapitular e Compartilhar.",
    blocks: [
      {
        subtitle: "Passo a Passo em um Ponto de Interesse",
        items: [
          "Passo 1 (Escolher Ponto): O mestre lê o Cabeçalho (descrição básica). Cada ponto possui um Quadro de Perícias/DT e uma Descrição Contextual secreta.",
          "Passo 2A — Interagir: Ação física simples (abrir gaveta, virar quadro). O mestre narra o resultado ou pede um teste. Encerra o turno.",
          "Passo 2B — Investigar (Passivo): O jogador escolhe uma perícia listada no ponto e informa seu DADO (ex: 'Intuição d6'). Recebe automaticamente todas as informações daquela perícia com DT <= ao seu dado, sem rolar.",
          "Passo 3A — Observar (após Investigar): Escolhe outra perícia listada no mesmo ponto e recebe passivamente as linhas com DT <= ao seu dado. Encerra o turno.",
          "Passo 3B — Examinar (após Investigar): Faz um teste rolado da perícia escolhida no Passo 2B para tentar alcançar DTs maiores. Se não obtiver nenhuma informação nova, perde 1 PD. Encerra o turno."
        ]
      },
      {
        subtitle: "Ações Globais de Dedução (Máximo 1 sucesso de cada por cena)",
        items: [
          "Recapitular (1 ação): O jogador interpreta seu personagem resumindo as pistas obtidas. Se coerente, testa Intuição (DT 10); se passar, descobre 1 nova pista.",
          "Compartilhar (não gasta ação): Explica uma pista da cena para um aliado; o aliado testa Inspecionar (DT 10) e, se passar, deduz 1 nova pista."
        ]
      }
    ]
  },
  {
    id: "desafios-acesso",
    category: "Investigação & Exploração",
    title: "4. Desafios de Acesso e Perseguições",
    summary: "Regras de Destrancar (Termo), Arrombar, Alcançar, Equilíbrio, Escalar, Sustentar e Perseguição.",
    blocks: [
      {
        subtitle: "Fechaduras e Barreiras",
        items: [
          "Destrancar (Termo de Dados): Mestre rola N d6 secretos. Jogador escolhe N valores por tentativa e mestre diz BAIXO, EXATO ou ALTO para cada dado. Tentativas por rodada = dado de Crime (d4=1, d6=2, d8=3, d10=4, d12=5). Esgotar tentativas danifica a tranca.",
          "Arrombar: Gasta 1 PV + Atletismo vs DT. Ao passar, acumula a RA até atingir a Pontuação Alvo (PA) da porta/baú.",
          "Sustentar: Gasta 1 PV + Atletismo para erguer/segurar peso. A cada rodada extra sustentando, repete Atletismo com -1 passo acumulativo."
        ]
      },
      {
        subtitle: "Movimentação Extrema",
        items: [
          "Alcançar — Forma Segura: 2 ações seguidas de Acrobacia vs DT do ambiente. Falha em qualquer uma causa dano = RB e reinicia.",
          "Alcançar — Forma Arriscada: 1 ação de Acrobacia vs DT +3. Falha causa dano = RA.",
          "Equilíbrio: Rola 2d10 sem somar. Diferença 0 ou 1 = equilibrado. Diferença >= 2 = caindo; pode gastar Dados de Equilíbrio (d4 = metade de Acrobacia) somando a um dos d10 (cuidado para não passar o outro d10 por 2+).",
          "Escalar (meta padrão 10 pts): Rápida (Atletismo DT 8, soma RA) ou Cautelosa (Atletismo DT 6, soma RB). Falha = queda com dano igual aos pontos já acumulados."
        ]
      },
      {
        subtitle: "Perseguição (4 Rodadas — Meta 25 PA)",
        items: [
          "Marcos de Perigo: Fim da 2ª rodada exige 5 PA; fim da 3ª exige 15 PA; fim da 4ª exige 25 PA. Quem ficar abaixo do marco é atingido/derrubado e sofre 1d6 dano por rodada restante.",
          "Reserva de Fôlego: Dados d6 bônus iguais à metade de Vigor (d4->2d6, d6->3d6, d8->4d6, d10->5d6, d12->6d6).",
          "Avançar: Atletismo DT 10 (passa = ganha RA em PA; falha = ganha RB em PA). Outras perícias podem ser justificadas 1 vez.",
          "Esforço Extra: +1 passo no teste perdendo 1d4 PV (2º uso perde 2d4 PV, 3º perde 3d4 PV...). Carregar Outro: -1 passo para igualar o PA do aliado."
        ]
      }
    ]
  },
  {
    id: "combate-fases",
    category: "Combate",
    title: "5. Combate por Fases, Ações e Manobras",
    summary: "Ordem por 3 fases (sem iniciativa), zonas de movimento, ataques, defesa, armadura e manobras.",
    blocks: [
      {
        subtitle: "Sequência da Rodada (3 Fases — 1 Ação por Rodada)",
        items: [
          "1. Fase Geral: Qualquer ação que não seja ataque (usar habilidades/itens, mover entre zonas, mirar, fintar, preparar, atrapalhar, defender-se).",
          "2. Fase de Ataques à Distância: Disparos e arremessos (acontecem simultaneamente dentro da fase).",
          "3. Fase de Ataques Corpo a Corpo: Golpes corpo a corpo e manobras (acontecem simultaneamente; se ambos se atacam corpo a corpo, vira teste oposto).",
          "Regra de ouro: Quem age em uma fase não age nas fases seguintes daquela rodada. Ações livres (falar, soltar item) não gastam ação; levantar-se ou sacar item como ação livre impõe -1 passo na rodada."
        ]
      },
      {
        subtitle: "Ações Táticas, Ataques e Proteção",
        items: [
          "Ataque Padrão: Físico + Luta (corpo a corpo, alcance curto) ou Pontaria (à distância, DT 7 curto / DT 10 longo). Dano = RA + modificador da arma.",
          "Atirar em Corpo a Corpo: -2 passos no ataque, OU rola 1d6 e em resultado ímpar acerta quem estava lutando com o alvo.",
          "Defender-se (Fase Geral): Acrobacia (ou Luta contra corpo a corpo) + 1d6 oposto a um ataque declarado contra você.",
          "Atrapalhar (Fase Geral): Perícia coerente oposta a Percepção do alvo -> impõe -1 passo até o fim da rodada.",
          "Fintar (Fase Geral): Enganação oposta a Intuição -> +2 passos no próximo ataque contra o alvo até o fim da próxima rodada.",
          "Mirar (Fase Geral): +1d6 em ataques à distância contra o alvo na próxima rodada.",
          "Zonas, Cobertura e Armadura: Mover na mesma zona é livre; mudar de zona custa 1 ação. Cobertura leve = DT +3; Ocultação leve = -1 passo; Ocultação total = -2 passos. Gastar 1 Ponto de Armadura (livre) reduz um dano em 1d10."
        ]
      },
      {
        subtitle: "Manobras de Combate (Fase Corpo a Corpo — Luta vs Acrobacia/Luta)",
        items: [
          "Agarrar: Alvo fica imóvel, sofre -1 passo em ataques e só usa armas pequenas/naturais. Esmagar causa dano = RA. Tiros contra envolvidos têm 50% de chance de acertar o alvo errado.",
          "Derrubar: Deixa o alvo caído (-1 passo físico; ataques corpo a corpo contra ele ganham +1 passo; tiros sofrem DT +3). Vencer por 5+ causa dano = RB.",
          "Desarmar / Empurrar / Quebrar: Derruba item (vencer por 5+ pega ou arremessa), empurra para trás (5+ impõe -1 passo) ou causa dano do ataque no objeto."
        ]
      }
    ]
  },
  {
    id: "lesoes-traumas-pavor",
    category: "Horror, Dano & Relações",
    title: "6. Lesões (0 PV), Traumas (0 PD), Pavor e Relações",
    summary: "Tabelas completas de 1d20 para Lesões e Traumas, mecânica do Dado de Pavor e invocação de Relações.",
    blocks: [
      {
        subtitle: "0 PV — Teste de Lesão & Primeiros Socorros",
        items: [
          "Teste de Lesão: Físico + Vigor vs DT 7 (+3 por teste de lesão já feito na cena). Crítico: recupera 1 PV e acorda; Sucesso: fica Inconsciente e Moribundo (repete no fim das rodadas seguintes); Falha: rola 1d20 na tabela de Lesões (+1 por patamar acima de iniciante); Falha Crítica: morte.",
          "Dano Não Letal: Se cair a 0 PV com dano não letal acumulado, ganha +1d6 no Teste de Lesão e rola 2d20 na tabela escolhendo o melhor.",
          "Primeiros Socorros: Mente + Medicina vs DT 7 (+3 por uso no alvo na cena; -2 passos sem maleta médica ou em si mesmo). Remove Moribundo, cura 1 PV e acorda."
        ]
      },
      {
        subtitle: "0 PD — Teste de Trauma & Dado de Pavor",
        items: [
          "Teste de Trauma: Emoção + Disciplina vs DT 7 (+3 por trauma na cena). Falha: rola 1d20 na tabela de Traumas (+1 por patamar acima de iniciante).",
          "Dado de Pavor (1d6): Ganho por sustos/horrores (aumenta 1 passo se recebido novamente). Rolado junto em todo teste, NÃO soma: ele ANULA dados do teste com resultado menor que o Dado de Pavor (anular todos = Falha Crítica). Se rolar 1 no Dado de Pavor, o efeito acaba. Antes do teste: gastar 1 PD reduz 1 passo; gastar 5 PD converte em dado bônus."
        ]
      },
      {
        subtitle: "Relações (Invocar 1 vez por missão)",
        items: [
          "Grau 1 — Afinidade: +1d6 em teste ligado à pessoa OU +1d6 extra ao Ajudar.",
          "Grau 2 — Vínculo: +1d8 em teste ligado à pessoa, +1d8 extra ao Ajudar OU gastar 1 ação para motivar e curar 2d4 PD.",
          "Grau 3 — Devoção: +1d12 em teste ligado à pessoa, +1d12 extra ao Ajudar, motivar curando 2d6 PD OU fazer 1 ação extra no turno para ajudá-la em perigo."
        ]
      }
    ],
    table: {
      headers: ["1d20", "Tabela de Lesões (0 PV)", "Tabela de Traumas (0 PD)"],
      rows: [
        ["1–4", "Morte Súbita: Personagem morre.", "Colapso Total: Mente sucumbe (perde o personagem)."],
        ["5–6", "Morte Lenta (5–9): Age 1 última rodada com 1 PV e morre ao fim dela.", "TEPT: Todo dano emocional sofrido aumenta em +1."],
        ["7–8", "Morte Lenta (5–9): Age 1 última rodada com 1 PV e morre ao fim dela.", "Degradação Cognitiva: -1 em Mente (até curar)."],
        ["9–10", "9: Morte Lenta | 10: Laceração Profunda (-2 PV acumulativo).", "Mácula Psíquica: -1 em Emoção (até curar)."],
        ["11–12", "11: Sem Olho (-1 Percepção/Pontaria) | 12: Sem Mão (1 item).", "Chaga da Alma: Perde 2 PD."],
        ["13–14", "13: Sem Pé (-2 passos mover/perseguir) | 14: Tendão (-2 Acrobacia).", "Retração Defensiva: -2 em Persuasão e Intuição."],
        ["15–17", "15: Músculo (-2 Atletismo) | 16: Órgão (-2 Vigor) | 17: Sensorial (-2 Percepção).", "Pânico: Recebe um Dado de Pavor (d6)."],
        ["18–19", "18: Cicatriz (-2 Persuasão, +1 Intimidar) | 19: Contusão (Físico -1 passo na cena).", "Estupor Catatônico: Perde a ação na próxima rodada."],
        ["20+", "Surto de Adrenalina: Sem sequelas e recupera 1 PV!", "Injeção de Ânimo: Sem sequelas e recupera 1 PD!"]
      ]
    }
  }
];


const COMBAT_CONDITIONS = [
  { key: "Sangrando", tone: "danger", desc: "Perde 1d6 PV no início de cada turno até estancar (Medicina DT 7 ou Vigor DT 7)." },
  { key: "Machucado", tone: "warning", desc: "Com metade ou menos dos PV máximos." },
  { key: "Morrendo", tone: "danger", desc: "0 PV: inconsciente e à beira da morte. Precisa ser estabilizado." },
  { key: "Apavorado", tone: "purple", desc: "Medo intenso: penalidade em testes e evita a fonte do pavor." },
  { key: "Abalado", tone: "warning", desc: "-1 passo nos testes; se ficar Abalado novamente, torna-se Apavorado." },
  { key: "Enlouquecendo", tone: "purple", desc: "0 PD: mente colapsando perante o Paranormal." },
  { key: "Caído", tone: "info", desc: "No chão: deslocamento reduzido, desvantagem em ataques corpo a corpo e vulnerável." },
  { key: "Desprevenido", tone: "warning", desc: "Alvo de ataque furtivo ou sem reação preparada." },
  { key: "Atordoado", tone: "warning", desc: "Desorientado e incapaz de agir normalmente no turno." },
  { key: "Agarrado", tone: "info", desc: "Imobilizado por um oponente ou obstáculo." },
  { key: "Envenenado", tone: "danger", desc: "Sofre efeitos contínuos de toxina ou substância nociva." },
  { key: "Inconsciente", tone: "danger", desc: "Indefeso e incapaz de perceber o ambiente ou agir." }
];
