// =========================================================================
// ESTADO DA APLICAÇÃO
// =========================================================================
let state = {
  campaigns: [],
  scenes: [],
  scene_links: [],
  scene_steps: [],
  pois: [],
  tests: [],
  npcs: [],
  items: [],
  agents: [],
  activeCampaignId: null,
  activeSceneId: null,
  activeStepId: null,
  sceneSectionFilter: "etapas",
  viewMode: "scene", // "scene" | "combat" | "rules" | "mechanics" | "sheets"
  combatByCampaign: {},
  rulesSearchQuery: "",
  rulesCategoryFilter: "Todas",
  selectedSheetFilter: "all", // "all" | String(agentId)
  sheetCardOpacity: 78,
  showNewStepForm: false,
  editingStepId: null,
  openAddPoiStepId: null,
  editingPoiId: null,
  openAddTestPoiId: null,
  editingTestId: null,
  openAddItemPoiId: null,
  editingItemId: null,
  showNewNpcForm: false,
  editingNpcId: null,
  testLastRolls: {},
  termoGames: {},
  campaignFilter: "",
  campaignSort: "default",
  sceneFilter: "",
  sceneSort: "position",
  diceMode: "dual",
  dualAttrDie: 6,
  dualSkillDie: 6,
  dualBonusDie: 0,
  dualPavorDie: 0,
  dualTargetDt: 0,
  dualLabel: "Teste Duplo",
  singleQty: 1,
  singleDie: 20,
  singleMod: 0,
  lastRoll: null,
  rollHistory: []
};

const $ = (id) => document.getElementById(id);

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseSkills(raw) {
  const base = {};
  ORDEM_SKILLS_META.forEach((s) => (base[s.key] = 4));
  if (!raw) return base;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

// Cria o payload padrão de uma ficha 100% genérica (atributos e perícias em d4)
function createDefaultAgentData() {
  const skills = {};
  SHEET_SKILLS_LIST.forEach((sk) => {
    skills[sk] = "d4";
  });
  return {
    eyebrow: "ORDEM PARANORMAL · FICHA DE AGENTE",
    meta: "Perfil • Ocupação • Nível 1 • NEX 5%",
    sideMark: "FICHA<br>DE AGENTE",
    pvAtual: "",
    pvMax: "12",
    pdAtual: "",
    pdMax: "10",
    attrFisico: "d4",
    attrMente: "d4",
    attrEmocao: "d4",
    perfil: "Perfil",
    ocupacao: "Ocupação",
    nivelNex: "1 / 5%",
    skills,
    aptidao: "Aptidão (Especialidade) d4",
    personalidade: "Descreva aqui a personalidade, comportamento e motivações do agente...",
    dejavuTitle: "MECÂNICA",
    dejavuDesc: "Descreva aqui se possuir a mecânica exclusiva da sua campanha.",
    dejavuPoints: ["○", "○", "○"],
    abilities: [
      { title: "Habilidade 1", desc: "Descreva o efeito mecânico da habilidade." }
    ],
    inventoryNotes: [],
    inventoryLines: Array(18).fill("")
  };
}

function parseAgentData(raw) {
  const base = createDefaultAgentData();
  if (!raw) return base;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      ...base,
      ...parsed,
      skills: { ...base.skills, ...(parsed.skills || {}) },
      dejavuPoints: Array.isArray(parsed.dejavuPoints) && parsed.dejavuPoints.length === 3
        ? parsed.dejavuPoints
        : base.dejavuPoints,
      abilities: Array.isArray(parsed.abilities) ? parsed.abilities : base.abilities,
      inventoryNotes: Array.isArray(parsed.inventoryNotes) ? parsed.inventoryNotes : base.inventoryNotes,
      inventoryLines: Array.isArray(parsed.inventoryLines) ? parsed.inventoryLines : base.inventoryLines
    };
  } catch {
    return base;
  }
}

// =========================================================================
// COMUNICAÇÃO COM O SERVIDOR PYTHON + SQLITE
// =========================================================================
async function api(path, method = "GET", body = null) {
  $("saveStatus").textContent = "Salvando...";
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json();
  $("saveStatus").textContent = "Salvo";
  return data;
}

async function loadAllData() {
  const data = await api("/api/data");
  state.campaigns = data.campaigns;
  state.scenes = data.scenes;
  state.scene_links = data.scene_links || [];
  state.scene_steps = data.scene_steps || [];
  state.pois = data.pois;
  state.tests = data.tests;
  state.npcs = data.npcs;
  state.items = data.items;
  state.agents = data.agents || [];

  if (!state.campaigns.some((c) => c.id === state.activeCampaignId)) {
    state.activeCampaignId = state.campaigns.length ? state.campaigns[0].id : null;
  }

  const campScenes = getFilteredCampaignScenes();
  if (!campScenes.some((s) => s.id === state.activeSceneId)) {
    state.activeSceneId = campScenes.length ? campScenes[0].id : null;
  }

  renderAll();
}

function getFilteredCampaigns() {
  let list = [...state.campaigns];
  if (state.campaignFilter.trim()) {
    const q = state.campaignFilter.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(q));
  }
  if (state.campaignSort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
  if (state.campaignSort === "za") list.sort((a, b) => b.name.localeCompare(a.name));
  return list;
}

function getFilteredCampaignScenes() {
  let list = state.scenes.filter((s) => s.campaign_id === state.activeCampaignId);
  if (state.sceneFilter.trim()) {
    const q = state.sceneFilter.toLowerCase();
    list = list.filter((s) => s.title.toLowerCase().includes(q));
  }
  if (state.sceneSort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
  if (state.sceneSort === "za") list.sort((a, b) => b.title.localeCompare(a.title));
  return list;
}

function getActiveScene() {
  return state.scenes.find((s) => s.id === state.activeSceneId) || null;
}

function getSceneSteps(sceneId) {
  return state.scene_steps
    .filter((st) => st.scene_id === sceneId)
    .sort((a, b) => (a.position - b.position) || (a.id - b.id));
}

function getCampaignAgents() {
  return state.agents.filter((a) => a.campaign_id === state.activeCampaignId);
}

// =========================================================================
// PRESERVAÇÃO DE POSIÇÃO DE ROLAGEM (SCROLL) ENTRE RENDERIZAÇÕES
// =========================================================================
let _lastRenderContext = {
  viewMode: null,
  campaignId: null,
  sceneId: null,
  stepId: null,
  sectionFilter: null,
  sheetFilter: null
};

function preserveScrollAround(fn, options = {}) {
  const {
    keepSceneScroll = true,
    keepSheetsScroll = true,
    keepSidebarScroll = true,
    keepDiceScroll = true
  } = options;

  const sceneEl = document.querySelector(".scene-scroll-body");
  const sceneTop = sceneEl ? sceneEl.scrollTop : null;

  const sheetsEl = document.querySelector(".fichas-scroll-area");
  const sheetsTop = sheetsEl ? sheetsEl.scrollTop : null;
  const sheetsLeft = sheetsEl ? sheetsEl.scrollLeft : null;

  const sidebarEl = $("sceneList");
  const sidebarTop = sidebarEl ? sidebarEl.scrollTop : null;

  const diceBodyEl = $("diceBody");
  const diceBodyTop = diceBodyEl ? diceBodyEl.scrollTop : null;

  const historyEl = document.querySelector(".history-list");
  const historyTop = historyEl ? historyEl.scrollTop : null;

  const winX = window.scrollX;
  const winY = window.scrollY;

  fn();

  const restore = () => {
    if (keepSceneScroll && sceneTop !== null) {
      const nextSceneEl = document.querySelector(".scene-scroll-body");
      if (nextSceneEl) nextSceneEl.scrollTop = sceneTop;
    }
    if (keepSheetsScroll && sheetsTop !== null) {
      const nextSheetsEl = document.querySelector(".fichas-scroll-area");
      if (nextSheetsEl) {
        nextSheetsEl.scrollTop = sheetsTop;
        if (sheetsLeft !== null) nextSheetsEl.scrollLeft = sheetsLeft;
      }
    }
    if (keepSidebarScroll && sidebarTop !== null) {
      const nextSidebarEl = $("sceneList");
      if (nextSidebarEl) nextSidebarEl.scrollTop = sidebarTop;
    }
    if (keepDiceScroll) {
      if (diceBodyTop !== null) {
        const nextDiceBody = $("diceBody");
        if (nextDiceBody) nextDiceBody.scrollTop = diceBodyTop;
      }
      if (historyTop !== null) {
        const nextHistory = document.querySelector(".history-list");
        if (nextHistory) nextHistory.scrollTop = historyTop;
      }
    }
    if (window.scrollX !== winX || window.scrollY !== winY) {
      window.scrollTo(winX, winY);
    }
  };

  restore();
  requestAnimationFrame(restore);
}
