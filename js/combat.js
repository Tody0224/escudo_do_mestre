// =========================================================================
// ABA: RASTREADOR DE INICIATIVA & COMBATE INTEGRADO
// =========================================================================
function parseDieSides(raw, fallback = 4) {
  if (typeof raw === "number" && raw > 0) return raw;
  const str = String(raw ?? "").trim().toLowerCase();
  const match = str.match(/d(\d+)/);
  if (match) return Number(match[1]) || fallback;
  const num = Number(str);
  return num > 0 ? num : fallback;
}

function getCombatState() {
  const campId = state.activeCampaignId || "default";
  if (!state.combatByCampaign[campId]) {
    let saved = null;
    try {
      const raw = localStorage.getItem(`em_combat_${campId}`);
      if (raw) saved = JSON.parse(raw);
    } catch {}
    state.combatByCampaign[campId] = saved || {
      round: 1,
      activeUid: null,
      started: false,
      participants: []
    };
  }
  return state.combatByCampaign[campId];
}

function persistCombatState() {
  const campId = state.activeCampaignId || "default";
  const cs = getCombatState();
  try {
    localStorage.setItem(`em_combat_${campId}`, JSON.stringify(cs));
  } catch {}
}

function buildAgentCombatant(agent) {
  const d = parseAgentData(agent.data_json);
  const pvMax = Math.max(1, parseInt(d.pvMax, 10) || 12);
  const pvCur = d.pvAtual === "" || d.pvAtual === null || d.pvAtual === undefined
    ? pvMax
    : Math.max(0, parseInt(d.pvAtual, 10) || 0);
  const pdMax = Math.max(1, parseInt(d.pdMax, 10) || 10);
  const pdCur = d.pdAtual === "" || d.pdAtual === null || d.pdAtual === undefined
    ? pdMax
    : Math.max(0, parseInt(d.pdAtual, 10) || 0);

  const attrFis = parseDieSides(d.attrFisico, 4);
  const skillInit = parseDieSides((d.skills && (d.skills["Acrobacia"] || d.skills["Percepção"])) || "d4", 4);

  return {
    uid: `agent_${agent.id}`,
    sourceType: "agent",
    sourceId: agent.id,
    name: agent.name || "Agente",
    role: "Agente",
    element: "Ordem",
    accent: agent.accent_color || "#2563eb",
    initiative: 0,
    initDetail: "",
    attrDie: attrFis,
    skillDie: skillInit,
    hpCurrent: pvCur,
    hpMax: pvMax,
    pdCurrent: pdCur,
    pdMax: pdMax,
    rd: 0,
    conditions: [],
    note: d.meta || ""
  };
}

function buildNpcCombatant(npc) {
  const skills = parseSkills(npc.skills_json);
  const attrFis = parseDieSides(npc.attr_fisico, 6);
  const skillInit = parseDieSides(skills["Acrobacia"] || skills["Percepção"] || 6, 6);

  return {
    uid: `npc_${npc.id}`,
    sourceType: "npc",
    sourceId: npc.id,
    name: npc.name || "Ameaça",
    role: npc.role || "Inimigo",
    element: npc.element || "Nenhum",
    accent: npc.role === "Aliado" ? "#16a34a" : npc.role === "Neutro" ? "#d97706" : "#dc2626",
    initiative: 0,
    initDetail: "",
    attrDie: attrFis,
    skillDie: skillInit,
    hpCurrent: Number(npc.hp_current ?? npc.hp_max ?? 10),
    hpMax: Math.max(1, Number(npc.hp_max ?? 10)),
    pdCurrent: Number(npc.pd_current ?? npc.pd_max ?? 10),
    pdMax: Math.max(1, Number(npc.pd_max ?? 10)),
    rd: Number(npc.rd ?? 0),
    conditions: [],
    note: npc.location || ""
  };
}

function syncCombatantsFromLiveSources(cs) {
  cs.participants.forEach((p) => {
    if (p.sourceType === "agent") {
      const ag = state.agents.find((a) => a.id === p.sourceId);
      if (ag) {
        const fresh = buildAgentCombatant(ag);
        p.name = fresh.name;
        p.accent = fresh.accent;
        p.hpCurrent = fresh.hpCurrent;
        p.hpMax = fresh.hpMax;
        p.pdCurrent = fresh.pdCurrent;
        p.pdMax = fresh.pdMax;
        p.attrDie = fresh.attrDie;
        p.skillDie = fresh.skillDie;
      }
    } else if (p.sourceType === "npc") {
      const npc = state.npcs.find((n) => n.id === p.sourceId);
      if (npc) {
        p.name = npc.name;
        p.role = npc.role || p.role;
        p.element = npc.element || p.element;
        p.hpCurrent = Number(npc.hp_current ?? p.hpCurrent);
        p.hpMax = Math.max(1, Number(npc.hp_max ?? p.hpMax));
        p.pdCurrent = Number(npc.pd_current ?? p.pdCurrent);
        p.pdMax = Math.max(1, Number(npc.pd_max ?? p.pdMax));
        p.rd = Number(npc.rd ?? p.rd);
      }
    }
  });
}

function sortCombatParticipants(cs) {
  const orderWeight = { agent: 0, npc: 1, custom: 2 };
  cs.participants.sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    const wa = orderWeight[a.sourceType] ?? 2;
    const wb = orderWeight[b.sourceType] ?? 2;
    if (wa !== wb) return wa - wb;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

function loadSceneEncounterIntoCombat(resetExisting = false) {
  const cs = getCombatState();
  const campAgents = getCampaignAgents();
  const scene = getActiveScene();
  const sceneNpcs = scene ? state.npcs.filter((n) => n.scene_id === scene.id) : [];

  if (resetExisting) {
    cs.participants = [];
    cs.round = 1;
    cs.activeUid = null;
    cs.started = false;
  }

  let added = 0;
  campAgents.forEach((ag) => {
    const uid = `agent_${ag.id}`;
    if (!cs.participants.some((p) => p.uid === uid)) {
      cs.participants.push(buildAgentCombatant(ag));
      added++;
    }
  });

  sceneNpcs.forEach((npc) => {
    const uid = `npc_${npc.id}`;
    if (!cs.participants.some((p) => p.uid === uid)) {
      cs.participants.push(buildNpcCombatant(npc));
      added++;
    }
  });

  if (!cs.activeUid && cs.participants.length > 0) {
    cs.activeUid = cs.participants[0].uid;
  }

  persistCombatState();
  renderCombatWorkspace();
  return added;
}

function addSingleParticipantToCombat(type, id) {
  const cs = getCombatState();
  const uid = `${type}_${id}`;
  if (cs.participants.some((p) => p.uid === uid)) return;

  if (type === "agent") {
    const ag = state.agents.find((a) => a.id === id);
    if (ag) cs.participants.push(buildAgentCombatant(ag));
  } else if (type === "npc") {
    const npc = state.npcs.find((n) => n.id === id);
    if (npc) cs.participants.push(buildNpcCombatant(npc));
  }

  if (!cs.activeUid && cs.participants.length > 0) {
    cs.activeUid = cs.participants[0].uid;
  }

  persistCombatState();
  renderCombatWorkspace();
}

function addCustomCombatant() {
  const nameEl = $("customCombatantName");
  const roleEl = $("customCombatantRole");
  const hpEl = $("customCombatantHp");
  const pdEl = $("customCombatantPd");
  const initEl = $("customCombatantInit");

  const name = (nameEl?.value || "").trim();
  if (!name) return;

  const role = roleEl?.value || "Inimigo";
  const hp = Math.max(1, parseInt(hpEl?.value, 10) || 15);
  const pd = Math.max(0, parseInt(pdEl?.value, 10) || 10);
  const initVal = parseInt(initEl?.value, 10) || 0;

  const cs = getCombatState();
  const uid = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  cs.participants.push({
    uid,
    sourceType: "custom",
    sourceId: null,
    name,
    role,
    element: "Nenhum",
    accent: role === "Aliado" ? "#16a34a" : role === "Neutro" ? "#d97706" : "#dc2626",
    initiative: initVal,
    initDetail: initVal ? `Manual (${initVal})` : "",
    attrDie: 6,
    skillDie: 6,
    hpCurrent: hp,
    hpMax: hp,
    pdCurrent: pd,
    pdMax: pd,
    rd: 0,
    conditions: [],
    note: ""
  });

  if (initVal > 0) {
    sortCombatParticipants(cs);
  }
  if (!cs.activeUid && cs.participants.length > 0) {
    cs.activeUid = cs.participants[0].uid;
  }

  if (nameEl) nameEl.value = "";
  if (initEl) initEl.value = "";
  persistCombatState();
  renderCombatWorkspace();
}

function removeCombatParticipant(uid) {
  const cs = getCombatState();
  const idx = cs.participants.findIndex((p) => p.uid === uid);
  if (idx === -1) return;

  const wasActive = cs.activeUid === uid;
  cs.participants.splice(idx, 1);

  if (cs.participants.length === 0) {
    cs.activeUid = null;
    cs.started = false;
    cs.round = 1;
  } else if (wasActive) {
    const nextIdx = idx % cs.participants.length;
    cs.activeUid = cs.participants[nextIdx].uid;
  }

  persistCombatState();
  renderCombatWorkspace();
}

function rollParticipantInitiative(uid, silent = false) {
  const cs = getCombatState();
  const p = cs.participants.find((x) => x.uid === uid);
  if (!p) return;

  const attrDie = p.attrDie || 4;
  const skillDie = p.skillDie || 4;
  const outcome = computeDualRollOutcome(attrDie, skillDie, 0, 0, 0, `Iniciativa • ${p.name}`);

  p.initiative = outcome.total;
  const rollNums = outcome.rolls.map((r) => r.val).join(" + ");
  p.initDetail = `${rollNums}${outcome.isCrit ? " ★" : ""}`;

  state.lastRoll = outcome;
  state.rollHistory.unshift(outcome);
  if (state.rollHistory.length > 15) state.rollHistory.pop();

  if (!silent) {
    sortCombatParticipants(cs);
    if (!cs.started && cs.participants.length > 0) {
      cs.activeUid = cs.participants[0].uid;
    }
    persistCombatState();
    renderCombatWorkspace();
    renderDicePanel();
  }
}

function rollAllInitiatives(mode = "all") {
  const cs = getCombatState();
  if (cs.participants.length === 0) return;

  cs.participants.forEach((p) => {
    if (mode === "npcs" && p.sourceType === "agent") return;
    rollParticipantInitiative(p.uid, true);
  });

  sortCombatParticipants(cs);
  if (cs.participants.length > 0) {
    cs.activeUid = cs.participants[0].uid;
    cs.round = 1;
    cs.started = true;
  }

  persistCombatState();
  renderCombatWorkspace();
  renderDicePanel();
}

function setManualInitiative(uid, val) {
  const cs = getCombatState();
  const p = cs.participants.find((x) => x.uid === uid);
  if (!p) return;
  p.initiative = parseInt(val, 10) || 0;
  p.initDetail = "Manual";
  sortCombatParticipants(cs);
  if (!cs.started && cs.participants.length > 0) {
    cs.activeUid = cs.participants[0].uid;
  }
  persistCombatState();
  renderCombatWorkspace();
}

function startOrResetCombat() {
  const cs = getCombatState();
  if (cs.participants.length === 0) return;
  sortCombatParticipants(cs);
  cs.round = 1;
  cs.started = true;
  cs.activeUid = cs.participants[0].uid;
  persistCombatState();
  renderCombatWorkspace();
}

function nextCombatTurn() {
  const cs = getCombatState();
  if (cs.participants.length === 0) return;

  if (!cs.started) {
    startOrResetCombat();
    return;
  }

  const idx = cs.participants.findIndex((p) => p.uid === cs.activeUid);
  if (idx === -1) {
    cs.activeUid = cs.participants[0].uid;
  } else if (idx + 1 >= cs.participants.length) {
    cs.activeUid = cs.participants[0].uid;
    cs.round = (cs.round || 1) + 1;
  } else {
    cs.activeUid = cs.participants[idx + 1].uid;
  }

  persistCombatState();
  renderCombatWorkspace();
}

function prevCombatTurn() {
  const cs = getCombatState();
  if (cs.participants.length === 0) return;

  const idx = cs.participants.findIndex((p) => p.uid === cs.activeUid);
  if (idx <= 0) {
    cs.activeUid = cs.participants[cs.participants.length - 1].uid;
    if ((cs.round || 1) > 1) cs.round -= 1;
  } else {
    cs.activeUid = cs.participants[idx - 1].uid;
  }

  persistCombatState();
  renderCombatWorkspace();
}

function setActiveCombatant(uid) {
  const cs = getCombatState();
  cs.activeUid = uid;
  cs.started = true;
  persistCombatState();
  renderCombatWorkspace();
}

async function adjustCombatantStat(uid, field, delta) {
  const cs = getCombatState();
  const p = cs.participants.find((x) => x.uid === uid);
  if (!p) return;

  if (field === "hp") {
    p.hpCurrent = Math.max(0, Math.min(p.hpMax, (Number(p.hpCurrent) || 0) + delta));
    // Auto-manage Machucado / Morrendo hints
    if (p.hpCurrent === 0 && !p.conditions.includes("Morrendo")) {
      p.conditions.push("Morrendo");
    } else if (p.hpCurrent > 0) {
      p.conditions = p.conditions.filter((c) => c !== "Morrendo");
    }
    if (p.hpCurrent > 0 && p.hpCurrent <= Math.floor(p.hpMax / 2)) {
      if (!p.conditions.includes("Machucado")) p.conditions.push("Machucado");
    } else if (p.hpCurrent > Math.floor(p.hpMax / 2)) {
      p.conditions = p.conditions.filter((c) => c !== "Machucado");
    }
  } else if (field === "pd") {
    p.pdCurrent = Math.max(0, Math.min(p.pdMax, (Number(p.pdCurrent) || 0) + delta));
    if (p.pdCurrent === 0 && !p.conditions.includes("Enlouquecendo")) {
      p.conditions.push("Enlouquecendo");
    } else if (p.pdCurrent > 0) {
      p.conditions = p.conditions.filter((c) => c !== "Enlouquecendo");
    }
  }

  persistCombatState();
  renderCombatWorkspace();

  // Sync back to SQLite database so Fichas & NPCs stay updated
  if (p.sourceType === "npc") {
    const npc = state.npcs.find((n) => n.id === p.sourceId);
    if (npc) {
      npc.hp_current = p.hpCurrent;
      npc.pd_current = p.pdCurrent;
      await api(`/api/npcs/${npc.id}`, "PUT", {
        hp_current: p.hpCurrent,
        pd_current: p.pdCurrent
      });
    }
  } else if (p.sourceType === "agent") {
    const ag = state.agents.find((a) => a.id === p.sourceId);
    if (ag) {
      const d = parseAgentData(ag.data_json);
      d.pvAtual = String(p.hpCurrent);
      d.pdAtual = String(p.pdCurrent);
      ag.data_json = JSON.stringify(d);
      await api(`/api/agents/${ag.id}`, "PUT", { data_json: d });
    }
  }
}

function toggleCombatCondition(uid, condKey) {
  const cs = getCombatState();
  const p = cs.participants.find((x) => x.uid === uid);
  if (!p) return;

  if (p.conditions.includes(condKey)) {
    p.conditions = p.conditions.filter((c) => c !== condKey);
  } else {
    p.conditions.push(condKey);
  }

  persistCombatState();
  renderCombatWorkspace();
}

function addCustomConditionPrompt(uid) {
  const name = prompt("Nome da condição personalizada (ex: Sangrando 2d6, Furtivo, Alvo Marcado):");
  if (!name || !name.trim()) return;
  toggleCombatCondition(uid, name.trim());
}

function clearCombatEncounter() {
  if (!confirm("Limpar todos os participantes do rastreador de combate atual?")) return;
  const campId = state.activeCampaignId || "default";
  state.combatByCampaign[campId] = {
    round: 1,
    activeUid: null,
    started: false,
    participants: []
  };
  persistCombatState();
  renderCombatWorkspace();
}

function renderCombatWorkspace() {
  const main = $("mainWorkspace");

  if (!state.activeCampaignId) {
    main.innerHTML = `
      <div class="empty-state">
        <h2>NENHUMA CAMPANHA ATIVA</h2>
        <p>Crie ou selecione uma campanha na barra lateral para usar o Rastreador de Combate e Iniciativa.</p>
        <button class="primary" onclick="createCampaign()">+ Criar Primeira Campanha</button>
      </div>
    `;
    return;
  }

  const cs = getCombatState();
  syncCombatantsFromLiveSources(cs);

  const campAgents = getCampaignAgents();
  const scene = getActiveScene();
  const sceneNpcs = scene ? state.npcs.filter((n) => n.scene_id === scene.id) : [];

  const availableAgents = campAgents.filter((a) => !cs.participants.some((p) => p.uid === `agent_${a.id}`));
  const availableNpcs = sceneNpcs.filter((n) => !cs.participants.some((p) => p.uid === `npc_${n.id}`));

  const activeCombatant = cs.participants.find((p) => p.uid === cs.activeUid) || null;

  _lastRenderContext = {
    viewMode: "combat",
    campaignId: state.activeCampaignId,
    sceneId: scene ? scene.id : null,
    stepId: null,
    sectionFilter: null,
    sheetFilter: null
  };

  preserveScrollAround(() => {
    main.innerHTML = `
      <div class="scene-topbar" style="flex-shrink:0;">
        <div class="scene-title-row" style="flex-wrap:wrap; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span class="dossier-tag mono">COMBATE</span>
            <strong style="font-size:20px; font-weight:800;">Rastreador de Iniciativa &amp; Turnos</strong>
            ${scene ? `<span class="badge mono">Cena: ${esc(scene.title)}</span>` : ""}
          </div>

          <div class="combat-round-controls">
            <div class="combat-round-pill mono">
              <span>RODADA</span>
              <strong>${cs.round || 1}</strong>
            </div>
            <button class="icon-btn" onclick="prevCombatTurn()" ${cs.participants.length === 0 ? "disabled" : ""} title="Turno anterior">&laquo; Anterior</button>
            <button class="primary" onclick="nextCombatTurn()" ${cs.participants.length === 0 ? "disabled" : ""}>
              ${cs.started ? "Próximo Turno &raquo;" : "▶ Iniciar Combate"}
            </button>
          </div>
        </div>

        <div class="combat-action-bar">
          <div style="display:flex; gap:7px; flex-wrap:wrap; align-items:center;">
            <button class="primary icon-btn" onclick="loadSceneEncounterIntoCombat(false)" title="Importar Agentes da campanha e NPCs da cena atual">
              + Importar Agentes &amp; NPCs da Cena
            </button>
            <button class="icon-btn" onclick="rollAllInitiatives('all')" ${cs.participants.length === 0 ? "disabled" : ""} title="Rolar iniciativa para todos e ordenar">
              🎲 Rolar Iniciativa (Todos)
            </button>
            <button class="icon-btn" onclick="rollAllInitiatives('npcs')" ${cs.participants.length === 0 ? "disabled" : ""} title="Rolar iniciativa apenas para NPCs e criaturas">
              🎲 Rolar Só NPCs
            </button>
          </div>

          <div style="display:flex; gap:7px; flex-wrap:wrap; align-items:center;">
            ${activeCombatant ? `
              <span class="combat-turn-banner">
                Turno Atual: <strong>${esc(activeCombatant.name)}</strong>
              </span>
            ` : ""}
            <button class="icon-btn danger" onclick="clearCombatEncounter()" ${cs.participants.length === 0 ? "disabled" : ""}>
              Limpar Encontro
            </button>
          </div>
        </div>
      </div>

      <div class="scene-scroll-body">
        <!-- Barra rápida para adicionar combatentes avulsos ou pendentes -->
        <div class="combat-quick-add-bar">
          <div class="combat-quick-group">
            <span class="combat-quick-label">Adicionar Rápido:</span>
            <input id="customCombatantName" style="width:190px;" placeholder="Nome (ex: Cultista #2)" />
            <select id="customCombatantRole" style="width:125px;">
              <option value="Inimigo">Inimigo</option>
              <option value="Criatura">Criatura</option>
              <option value="Aliado">Aliado</option>
              <option value="Neutro">Neutro</option>
            </select>
            <input id="customCombatantHp" type="number" style="width:74px;" value="15" title="PV Máximo" placeholder="PV" />
            <input id="customCombatantPd" type="number" style="width:74px;" value="10" title="PD Máximo" placeholder="PD" />
            <input id="customCombatantInit" type="number" style="width:82px;" title="Iniciativa inicial (opcional)" placeholder="Inic." />
            <button class="icon-btn primary" onclick="addCustomCombatant()">+ Adicionar</button>
          </div>

          ${(availableAgents.length > 0 || availableNpcs.length > 0) ? `
            <div class="combat-pending-chips">
              <span class="combat-quick-label">Disponíveis na cena/campanha:</span>
              ${availableAgents.map((a) => `
                <button class="combat-chip-btn agent" onclick="addSingleParticipantToCombat('agent', ${a.id})">
                  + ${esc(a.name)} (Agente)
                </button>
              `).join("")}
              ${availableNpcs.map((n) => `
                <button class="combat-chip-btn npc" onclick="addSingleParticipantToCombat('npc', ${n.id})">
                  + ${esc(n.name)} (${esc(n.role)})
                </button>
              `).join("")}
            </div>
          ` : ""}
        </div>

        ${cs.participants.length === 0 ? `
          <div class="empty-state" style="min-height: 300px;">
            <h2>NENHUM COMBATENTE NA ORDEM DE INICIATIVA</h2>
            <p>Clique em <strong>"+ Importar Agentes &amp; NPCs da Cena"</strong> para puxar automaticamente os agentes da campanha e as ameaças da cena atual, ou adicione combatentes avulsos acima.</p>
            <button class="primary" style="padding:10px 18px;" onclick="loadSceneEncounterIntoCombat(false)">
              + Importar Agentes (${campAgents.length}) &amp; NPCs da Cena (${sceneNpcs.length})
            </button>
          </div>
        ` : `
          <div class="combat-tracker-list">
            ${cs.participants.map((p, idx) => renderCombatantRowHtml(p, idx, cs.activeUid === p.uid)).join("")}
          </div>
        `}
      </div>
    `;
  }, { keepSceneScroll: true, keepSheetsScroll: false, keepSidebarScroll: false, keepDiceScroll: false });
}

function renderCombatantRowHtml(p, idx, isTurnActive) {
  const hpPct = p.hpMax > 0 ? Math.max(0, Math.min(100, Math.round((p.hpCurrent / p.hpMax) * 100))) : 0;
  const pdPct = p.pdMax > 0 ? Math.max(0, Math.min(100, Math.round((p.pdCurrent / p.pdMax) * 100))) : 0;
  const isDown = p.hpCurrent <= 0;

  const typeBadge = p.sourceType === "agent"
    ? `<span class="badge info mono">AGENTE</span>`
    : p.role === "Aliado"
      ? `<span class="badge success mono">ALIADO</span>`
      : `<span class="badge danger mono">${esc(p.role.toUpperCase())}</span>`;

  return `
    <div class="combat-row ${isTurnActive ? "active-turn" : ""} ${isDown ? "downed" : ""}" style="border-left-color: ${esc(p.accent)};">
      <!-- Coluna 1: Iniciativa & Ordem -->
      <div class="combat-init-box">
        <span class="combat-order-num mono">#${idx + 1}</span>
        <input
          type="number"
          class="combat-init-input mono"
          value="${p.initiative}"
          title="Valor de Iniciativa (editável)"
          onchange="setManualInitiative('${esc(p.uid)}', this.value)"
        />
        <button class="icon-btn" style="padding:3px 7px; font-size:11.5px;" onclick="rollParticipantInitiative('${esc(p.uid)}')" title="Rolar Iniciativa (d${p.attrDie} + d${p.skillDie})">
          🎲 d${p.attrDie}+d${p.skillDie}
        </button>
        ${p.initDetail ? `<span class="combat-init-sub mono">${esc(p.initDetail)}</span>` : ""}
      </div>

      <!-- Coluna 2: Identificação & Ações Rápidas -->
      <div class="combat-identity-col">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${isTurnActive ? `<span class="combat-active-tag mono">▶ TURNO ATUAL</span>` : ""}
          ${typeBadge}
          ${p.element && p.element !== "Nenhum" && p.element !== "Ordem" ? `<span class="badge purple mono">${esc(p.element)}</span>` : ""}
          ${p.rd > 0 ? `<span class="badge mono">RD ${p.rd}</span>` : ""}
          <strong class="combat-name">${esc(p.name)}</strong>
        </div>

        ${p.note ? `<div class="combat-note">${esc(p.note)}</div>` : ""}

        <!-- Condições -->
        <div class="combat-conditions-area">
          <div class="combat-active-conditions">
            ${p.conditions.length === 0 ? `<span class="combat-no-cond">Sem condições ativas</span>` : ""}
            ${p.conditions.map((c) => {
              const meta = COMBAT_CONDITIONS.find((x) => x.key === c);
              const tone = meta ? meta.tone : "warning";
              return `
                <button
                  class="combat-cond-pill ${tone}"
                  title="${meta ? esc(meta.desc) : "Clique para remover"}"
                  onclick="toggleCombatCondition('${esc(p.uid)}', '${esc(c)}')"
                >
                  ${esc(c)} ✕
                </button>
              `;
            }).join("")}
          </div>

          <details class="combat-cond-picker">
            <summary>+ Condição</summary>
            <div class="combat-cond-menu">
              ${COMBAT_CONDITIONS.map((c) => {
                const active = p.conditions.includes(c.key);
                return `
                  <button
                    type="button"
                    class="combat-cond-option ${active ? "selected" : ""}"
                    title="${esc(c.desc)}"
                    onclick="toggleCombatCondition('${esc(p.uid)}', '${esc(c.key)}')"
                  >
                    ${active ? "✓ " : ""}${esc(c.key)}
                  </button>
                `;
              }).join("")}
              <button type="button" class="combat-cond-option custom" onclick="addCustomConditionPrompt('${esc(p.uid)}')">
                + Personalizada...
              </button>
            </div>
          </details>
        </div>
      </div>

      <!-- Coluna 3: Barras de PV e PD -->
      <div class="combat-vitals-col">
        <div class="combat-vital-block">
          <div class="combat-vital-header">
            <span class="mono" style="font-weight:800; color:var(--danger);">PV</span>
            <span class="mono"><strong>${p.hpCurrent}</strong> / ${p.hpMax}</span>
          </div>
          <div class="npc-bar-track">
            <div class="npc-bar-fill hp" style="width:${hpPct}%;"></div>
          </div>
          <div class="combat-vital-btns">
            <button class="icon-btn danger" onclick="adjustCombatantStat('${esc(p.uid)}', 'hp', -5)">-5</button>
            <button class="icon-btn danger" onclick="adjustCombatantStat('${esc(p.uid)}', 'hp', -1)">-1</button>
            <button class="icon-btn" onclick="adjustCombatantStat('${esc(p.uid)}', 'hp', 1)">+1</button>
            <button class="icon-btn" onclick="adjustCombatantStat('${esc(p.uid)}', 'hp', 5)">+5</button>
          </div>
        </div>

        <div class="combat-vital-block">
          <div class="combat-vital-header">
            <span class="mono" style="font-weight:800; color:var(--info);">PD</span>
            <span class="mono"><strong>${p.pdCurrent}</strong> / ${p.pdMax}</span>
          </div>
          <div class="npc-bar-track">
            <div class="npc-bar-fill pd" style="width:${pdPct}%;"></div>
          </div>
          <div class="combat-vital-btns">
            <button class="icon-btn danger" onclick="adjustCombatantStat('${esc(p.uid)}', 'pd', -5)">-5</button>
            <button class="icon-btn danger" onclick="adjustCombatantStat('${esc(p.uid)}', 'pd', -1)">-1</button>
            <button class="icon-btn" onclick="adjustCombatantStat('${esc(p.uid)}', 'pd', 1)">+1</button>
            <button class="icon-btn" onclick="adjustCombatantStat('${esc(p.uid)}', 'pd', 5)">+5</button>
          </div>
        </div>
      </div>

      <!-- Coluna 4: Controles do Participante -->
      <div class="combat-row-actions">
        ${!isTurnActive ? `
          <button class="icon-btn" onclick="setActiveCombatant('${esc(p.uid)}')" title="Definir como turno atual">▶ Turno</button>
        ` : ""}
        <button class="icon-btn danger" onclick="removeCombatParticipant('${esc(p.uid)}')" title="Remover do combate">✕</button>
      </div>
    </div>
  `;
}
