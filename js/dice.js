// =========================================================================
// CENTRAL DE DADOS
// =========================================================================
function setDiceMode(mode) {
  state.diceMode = mode;
  $("modeDualBtn").classList.toggle("active", mode === "dual");
  $("modeSingleBtn").classList.toggle("active", mode === "single");
  renderDicePanel();
}

function toggleDiceSidebar() {
  $("diceSidebar").classList.toggle("collapsed");
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function computeDualRollOutcome(attrDie, skillDie, bonusDie, pavorDie, targetDt, label) {
  const rAttr = rollDie(attrDie);
  const rSkill = rollDie(skillDie);
  const rolls = [
    { label: `Atributo (d${attrDie})`, val: rAttr },
    { label: `Perícia (d${skillDie})`, val: rSkill }
  ];

  if (bonusDie > 0) {
    rolls.push({ label: `Bônus (d${bonusDie})`, val: rollDie(bonusDie) });
  }

  const pavorVal = pavorDie > 0 ? rollDie(pavorDie) : null;
  const rawValues = rolls.map((r) => r.val);
  const ra = Math.max(...rawValues);
  const rb = Math.min(...rawValues);

  const activeRolls = rolls.map((r) => ({
    ...r,
    cancelled: pavorVal !== null && r.val < pavorVal
  }));

  const validValues = activeRolls.filter((r) => !r.cancelled).map((r) => r.val);
  const total = validValues.reduce((acc, v) => acc + v, 0);

  const counts = {};
  rawValues.forEach((v) => {
    if (v >= 6) counts[v] = (counts[v] || 0) + 1;
  });
  const isCrit = Object.values(counts).some((c) => c >= 2);
  const allOnes = rawValues.every((v) => v === 1);
  const pavorCancelledAll = pavorVal !== null && validValues.length === 0;
  const isFumble = allOnes || pavorCancelledAll;
  const pavorEnded = pavorVal === 1;

  let dtStatus = "";
  if (targetDt > 0) {
    if (isCrit) dtStatus = `PASSOU (CRÍTICO vs DT ${targetDt})`;
    else if (isFumble) dtStatus = `FALHOU (CRÍTICA vs DT ${targetDt})`;
    else dtStatus = total >= targetDt ? `PASSOU (DT ${targetDt})` : `FALHOU (DT ${targetDt})`;
  }

  return {
    type: "dual",
    title: label,
    total,
    ra,
    rb,
    rolls: activeRolls,
    pavorDie,
    pavorVal,
    isCrit,
    isFumble,
    pavorEnded,
    dtStatus
  };
}

function executeDualRoll() {
  const attrDie = Number($("dualAttrDie").value);
  const skillDie = Number($("dualSkillDie").value);
  const bonusDie = Number($("dualBonusDie").value);
  const pavorDie = Number($("dualPavorDie").value);
  const targetDt = Number($("dualTargetDt").value);

  state.dualAttrDie = attrDie;
  state.dualSkillDie = skillDie;
  state.dualBonusDie = bonusDie;
  state.dualPavorDie = pavorDie;
  state.dualTargetDt = targetDt;

  const resultObj = computeDualRollOutcome(
    attrDie,
    skillDie,
    bonusDie,
    pavorDie,
    targetDt,
    state.dualLabel
  );

  state.dualLabel = "Teste Duplo";
  state.lastRoll = resultObj;
  state.rollHistory.unshift(resultObj);
  if (state.rollHistory.length > 15) state.rollHistory.pop();
  renderDicePanel();
}

function rollEmbeddedTest(testId) {
  const t = state.tests.find((x) => x.id === testId);
  if (!t) return;

  const attrDie = Number($(`rollTestAttr_${testId}`).value) || 4;
  const skillDie = Number($(`rollTestSkill_${testId}`).value) || 4;
  const label = `${t.situation} (${t.skill})`;

  const resultObj = computeDualRollOutcome(attrDie, skillDie, 0, 0, t.dt, label);
  state.testLastRolls[testId] = resultObj;
  state.lastRoll = resultObj;
  state.rollHistory.unshift(resultObj);
  if (state.rollHistory.length > 15) state.rollHistory.pop();

  renderWorkspace();
  renderDicePanel();
}

function rollNpcSkillById(npcId, skillName, attrVal, skillVal) {
  const npc = state.npcs.find((n) => n.id === npcId);
  const npcName = npc ? npc.name : "NPC";
  $("diceSidebar").classList.remove("collapsed");
  state.diceMode = "dual";
  state.dualAttrDie = attrVal;
  state.dualSkillDie = skillVal;
  state.dualBonusDie = 0;
  state.dualLabel = `${npcName} • ${skillName}`;
  setDiceMode("dual");
  executeDualRoll();
}

function executeSingleRoll(overrideSides = null) {
  const qty = overrideSides ? 1 : Math.max(1, Math.min(20, Number($("singleQty").value) || 1));
  const sides = overrideSides || Number($("singleDie").value);
  const mod = overrideSides ? 0 : (Number($("singleMod").value) || 0);

  if (!overrideSides) {
    state.singleQty = qty;
    state.singleDie = sides;
    state.singleMod = mod;
  }

  const results = [];
  for (let i = 0; i < qty; i++) results.push(rollDie(sides));
  const sum = results.reduce((a, b) => a + b, 0) + mod;
  const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : "";

  const resultObj = {
    type: "single",
    title: `${qty}d${sides}${modStr}`,
    total: sum,
    results,
    mod
  };

  state.lastRoll = resultObj;
  state.rollHistory.unshift(resultObj);
  if (state.rollHistory.length > 15) state.rollHistory.pop();
  renderDicePanel();
}

function renderDicePanel() {
  preserveScrollAround(() => {
  const body = $("diceBody");
  const r = state.lastRoll;

  let resultHtml = "";
  if (r) {
    if (r.type === "dual") {
      resultHtml = `
        <div class="roll-result-card">
          <div style="font-size:12.5px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">${esc(r.title)}</div>
          <div class="roll-total mono">${r.total}</div>
          <div class="dice-chips">
            ${r.rolls.map(d => `<span class="die-chip mono ${d.cancelled ? "cancelled" : ""}" title="${d.label}">${d.val}</span>`).join("")}
            ${r.pavorVal !== null ? `<span class="die-chip pavor mono" title="Dado de Pavor (d${r.pavorDie})">Pavor: ${r.pavorVal}</span>` : ""}
          </div>
          <div style="display:flex; justify-content:center; gap:8px; font-size:13px;" class="mono">
            <span class="badge">RA: ${r.ra}</span>
            <span class="badge">RB: ${r.rb}</span>
          </div>
          ${r.isCrit ? `<div style="margin-top:6px;"><span class="badge success">SUCESSO CRÍTICO!</span></div>` : ""}
          ${r.isFumble ? `<div style="margin-top:6px;"><span class="badge danger">FALHA CRÍTICA!</span></div>` : ""}
          ${r.pavorEnded ? `<div style="margin-top:6px;"><span class="badge primary">PAVOR ENCERRADO (1)!</span></div>` : ""}
          ${r.dtStatus ? `<div style="margin-top:6px;"><span class="badge ${r.dtStatus.startsWith("PASSOU") ? "success" : "danger"}">${r.dtStatus}</span></div>` : ""}
        </div>
      `;
    } else {
      resultHtml = `
        <div class="roll-result-card">
          <div style="font-size:12.5px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">${esc(r.title)}</div>
          <div class="roll-total mono">${r.total}</div>
          <div class="dice-chips">
            ${r.results.map(v => `<span class="die-chip mono">${v}</span>`).join("")}
            ${r.mod !== 0 ? `<span class="die-chip mono">Mod ${r.mod > 0 ? "+" + r.mod : r.mod}</span>` : ""}
          </div>
        </div>
      `;
    }
  }

  if (state.diceMode === "dual") {
    body.innerHTML = `
      <div class="grid-2">
        <div>
          <label>Dado Atributo</label>
          <select id="dualAttrDie">
            ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === state.dualAttrDie ? "selected" : ""}>d${d.value}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Dado Perícia</label>
          <select id="dualSkillDie">
            ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === state.dualSkillDie ? "selected" : ""}>d${d.value}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="grid-2">
        <div>
          <label>Dado Bônus</label>
          <select id="dualBonusDie">
            <option value="0" ${state.dualBonusDie === 0 ? "selected" : ""}>Nenhum</option>
            ${[4, 6, 8, 10, 12].map(v => `<option value="${v}" ${v === state.dualBonusDie ? "selected" : ""}>+d${v}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Dado de Pavor</label>
          <select id="dualPavorDie">
            <option value="0" ${state.dualPavorDie === 0 ? "selected" : ""}>Nenhum</option>
            ${[4, 6, 8, 10, 12].map(v => `<option value="${v}" ${v === state.dualPavorDie ? "selected" : ""}>d${v} Pavor</option>`).join("")}
          </select>
        </div>
      </div>

      <div>
        <label>Comparar com DT (Opcional)</label>
        <select id="dualTargetDt">
          <option value="0" ${state.dualTargetDt === 0 ? "selected" : ""}>Apenas somar resultado</option>
          ${ORDEM_DTS.map(d => `<option value="${d.value}" ${d.value === state.dualTargetDt ? "selected" : ""}>${esc(d.label)}</option>`).join("")}
        </select>
      </div>

      <button class="primary" style="width:100%; padding:9px;" onclick="executeDualRoll()">Rolar Teste Duplo</button>

      ${resultHtml}

      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label style="margin:0;">Histórico</label>
          ${state.rollHistory.length ? `<button class="icon-btn" style="padding:2px 6px; font-size:12px;" onclick="clearHistory()">Limpar</button>` : ""}
        </div>
        <div class="history-list">
          ${state.rollHistory.map(h => `
            <div class="history-item mono">
              <div style="display:flex; justify-content:space-between;">
                <strong>${esc(h.title)}</strong>
                <span style="color:var(--primary); font-weight:800;">= ${h.total}</span>
              </div>
              <div style="color:var(--text-muted); font-size:12px;">
                ${h.type === "dual" ? `Dados: [${h.rolls.map(x => x.val).join(", ")}] • RA:${h.ra} RB:${h.rb}` : `Dados: [${h.results.join(", ")}]`}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div>
        <label>Rolagem Rápida (1 Dado)</label>
        <div class="quick-dice-grid">
          ${[4, 6, 8, 10, 12, 20, 100].map(s => `
            <button class="mono" onclick="executeSingleRoll(${s})">d${s}</button>
          `).join("")}
        </div>
      </div>

      <div class="grid-3">
        <div>
          <label>Qtd</label>
          <input id="singleQty" type="number" min="1" max="20" value="${state.singleQty}" />
        </div>
        <div>
          <label>Dado</label>
          <select id="singleDie">
            ${[4, 6, 8, 10, 12, 20, 100].map(s => `<option value="${s}" ${s === state.singleDie ? "selected" : ""}>d${s}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Mod (+/-)</label>
          <input id="singleMod" type="number" value="${state.singleMod}" />
        </div>
      </div>

      <button class="primary" style="width:100%; padding:9px;" onclick="executeSingleRoll()">Rolar Individual</button>

      ${resultHtml}

      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label style="margin:0;">Histórico</label>
          ${state.rollHistory.length ? `<button class="icon-btn" style="padding:2px 6px; font-size:12px;" onclick="clearHistory()">Limpar</button>` : ""}
        </div>
        <div class="history-list">
          ${state.rollHistory.map(h => `
            <div class="history-item mono">
              <div style="display:flex; justify-content:space-between;">
                <strong>${esc(h.title)}</strong>
                <span style="color:var(--primary); font-weight:800;">= ${h.total}</span>
              </div>
              <div style="color:var(--text-muted); font-size:12px;">
                ${h.type === "dual" ? `Dados: [${h.rolls.map(x => x.val).join(", ")}] • RA:${h.ra} RB:${h.rb}` : `Dados: [${h.results.join(", ")}]`}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
  }, { keepSceneScroll: false, keepSheetsScroll: false, keepSidebarScroll: false, keepDiceScroll: true });
}

function clearHistory() {
  state.rollHistory = [];
  state.lastRoll = null;
  renderDicePanel();
}
