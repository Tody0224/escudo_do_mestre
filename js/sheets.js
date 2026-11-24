// =========================================================================
// ABA: FICHAS DE AGENTES (GENÉRICAS, CRIADAS E EDITADAS NO SITE)
// =========================================================================
function renderSheetsWorkspace() {
  const main = $("mainWorkspace");

  if (!state.activeCampaignId) {
    _lastRenderContext = {
      viewMode: "sheets",
      campaignId: null,
      sceneId: null,
      stepId: null,
      sectionFilter: null,
      sheetFilter: null
    };
    main.innerHTML = `
      <div class="empty-state">
        <h2>NENHUMA CAMPANHA ATIVA</h2>
        <p>Crie ou selecione uma campanha na barra lateral para criar e gerenciar as fichas de agentes.</p>
        <button class="primary" onclick="createCampaign()">+ Criar Primeira Campanha</button>
      </div>
    `;
    return;
  }

  const campAgents = getCampaignAgents();
  if (
    state.selectedSheetFilter !== "all" &&
    !campAgents.some((a) => String(a.id) === String(state.selectedSheetFilter))
  ) {
    state.selectedSheetFilter = "all";
  }

  const visibleAgents =
    state.selectedSheetFilter === "all"
      ? campAgents
      : campAgents.filter((a) => String(a.id) === String(state.selectedSheetFilter));

  const isSameSheetsView =
    _lastRenderContext.viewMode === "sheets" &&
    _lastRenderContext.campaignId === state.activeCampaignId &&
    _lastRenderContext.sheetFilter === state.selectedSheetFilter;

  _lastRenderContext = {
    viewMode: "sheets",
    campaignId: state.activeCampaignId,
    sceneId: null,
    stepId: null,
    sectionFilter: null,
    sheetFilter: state.selectedSheetFilter
  };

  preserveScrollAround(() => {
    main.innerHTML = `
    <div class="fichas-view">
      <div class="fichas-toolbar">
        <div class="fichas-toolbar-group">
          <button class="primary" onclick="createGenericSheet()">+ Nova Ficha Genérica</button>

          <div class="control-group">
            <label for="sheetFilterSelect">Exibir:</label>
            <select id="sheetFilterSelect" onchange="state.selectedSheetFilter = this.value; renderSheetsWorkspace();">
              <option value="all" ${state.selectedSheetFilter === "all" ? "selected" : ""}>Todas as Fichas (${campAgents.length})</option>
              ${campAgents.map((a) => `
                <option value="${a.id}" ${String(state.selectedSheetFilter) === String(a.id) ? "selected" : ""}>
                  ${esc(a.name)}
                </option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="fichas-toolbar-group">
          <div class="control-group">
            <label for="cardOpacity">Fundo dos quadros:</label>
            <input id="cardOpacity" type="range" min="15" max="100" value="${state.sheetCardOpacity}" oninput="updateSheetOpacity(this.value)" onchange="updateSheetOpacity(this.value)">
            <span id="opacityVal">${state.sheetCardOpacity}%</span>
          </div>
          <button class="print-btn" onclick="window.print()">Imprimir / salvar em PDF</button>
        </div>
      </div>

      <div class="fichas-scroll-area">
        ${campAgents.length === 0 ? `
          <div class="empty-state" style="color:#cbd5e1; min-height: 420px;">
            <h2 style="color:#ffffff;">NENHUMA FICHA CRIADA NESTA CAMPANHA</h2>
            <p>Clique no botão abaixo para gerar uma ficha genérica com todos os atributos e perícias em <strong>d4</strong> e preencha diretamente na página.</p>
            <button class="primary" style="padding:10px 18px; font-size:13.5px;" onclick="createGenericSheet()">+ Criar Primeira Ficha Genérica</button>
          </div>
        ` : visibleAgents.map((agent, idx) => renderSingleAgentSheet(agent, idx)).join("")}
      </div>
    </div>
  `;
  }, { keepSceneScroll: false, keepSheetsScroll: isSameSheetsView, keepSidebarScroll: false, keepDiceScroll: false });
  updateSheetOpacity(state.sheetCardOpacity);
}

function renderSingleAgentSheet(agent, idx) {
  const d = parseAgentData(agent.data_json);
  const accent = agent.accent_color || "#db2777";
  const soft = agent.soft_color || "#fdf2f8";
  const hasImage = Boolean(agent.portrait_data);

  return `
    <div class="sheet-wrapper" data-agent-id="${agent.id}">
      <div class="sheet-page-controls">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <strong class="mono">FICHA #${idx + 1}</strong>
          <div class="color-swatches" title="Cor da ficha">
            ${SHEET_COLOR_PRESETS.map((c) => `
              <button
                type="button"
                class="swatch-btn ${c.accent.toLowerCase() === accent.toLowerCase() ? "active" : ""}"
                style="background:${c.accent};"
                title="${c.name}"
                onclick="updateAgentColor(${agent.id}, '${c.accent}', '${c.soft}')"
              ></button>
            `).join("")}
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:6px;">
          <button class="icon-btn" onclick="addAgentAbility(${agent.id})">+ Habilidade</button>
          <button class="icon-btn" onclick="addAgentBlankLine(${agent.id})">+ Linha Item</button>
          <button class="icon-btn" onclick="duplicateAgentSheet(${agent.id})">Duplicar</button>
          <button class="icon-btn danger" onclick="deleteAgentSheet(${agent.id})">Excluir Ficha</button>
        </div>
      </div>

      <section class="page front" style="--accent:${esc(accent)};--soft:${esc(soft)}">
        <div class="page-head">
          <div>
            <div class="eyebrow" contenteditable="true" onblur="saveSheetField(${agent.id}, 'eyebrow', this.innerText)">${esc(d.eyebrow)}</div>
            <h1 contenteditable="true" onblur="saveSheetName(${agent.id}, this.innerText)">${esc(agent.name)}</h1>
            <div class="meta" contenteditable="true" onblur="saveSheetHtmlField(${agent.id}, 'meta', this.innerHTML)">${d.meta}</div>
          </div>
          <div class="side-mark" contenteditable="true" onblur="saveSheetHtmlField(${agent.id}, 'sideMark', this.innerHTML)">${d.sideMark}</div>
        </div>

        <div class="top-grid">
          <div
            class="portrait-slot ${hasImage ? "has-image" : ""}"
            onclick="triggerSheetUpload(${agent.id})"
            ondragover="event.preventDefault()"
            ondrop="handleSheetDrop(event, ${agent.id})"
            title="Clique ou arraste uma imagem para inserir a foto"
          >
            <input id="portraitInput_${agent.id}" type="file" accept="image/*" onchange="loadSheetPortrait(event, ${agent.id})" hidden>
            <img src="${esc(agent.portrait_data || "")}" alt="Retrato de ${esc(agent.name)}">
            <div class="portrait-placeholder">
              <span>+ FOTO</span>
              <small>Clique para<br>inserir</small>
            </div>
            <button type="button" class="remove-img" onclick="removeSheetPortrait(event, ${agent.id})" title="Remover imagem">×</button>
          </div>

          <div class="vitals">
            <div class="vital">
              <label>PV · ATUAL</label>
              <div class="blank" contenteditable="true" onblur="saveSheetField(${agent.id}, 'pvAtual', this.innerText)">${esc(d.pvAtual)}</div>
              <label>MÁX.</label>
              <b class="max" contenteditable="true" onblur="saveSheetField(${agent.id}, 'pvMax', this.innerText)">${esc(d.pvMax)}</b>
            </div>
            <div class="vital">
              <label>PD · ATUAL</label>
              <div class="blank" contenteditable="true" onblur="saveSheetField(${agent.id}, 'pdAtual', this.innerText)">${esc(d.pdAtual)}</div>
              <label>MÁX.</label>
              <b class="max" contenteditable="true" onblur="saveSheetField(${agent.id}, 'pdMax', this.innerText)">${esc(d.pdMax)}</b>
            </div>
            <div class="attributes">
              <div class="attr"><b>Físico</b><strong contenteditable="true" onblur="saveSheetField(${agent.id}, 'attrFisico', this.innerText)">${esc(d.attrFisico)}</strong></div>
              <div class="attr"><b>Mente</b><strong contenteditable="true" onblur="saveSheetField(${agent.id}, 'attrMente', this.innerText)">${esc(d.attrMente)}</strong></div>
              <div class="attr"><b>Emoção</b><strong contenteditable="true" onblur="saveSheetField(${agent.id}, 'attrEmocao', this.innerText)">${esc(d.attrEmocao)}</strong></div>
            </div>
          </div>

          <div class="profile-box">
            <div class="section-title">DADOS DO AGENTE</div>
            <div class="fieldrow"><span>Perfil</span><b contenteditable="true" onblur="saveSheetField(${agent.id}, 'perfil', this.innerText)">${esc(d.perfil)}</b></div>
            <div class="fieldrow"><span>Ocupação</span><b contenteditable="true" onblur="saveSheetField(${agent.id}, 'ocupacao', this.innerText)">${esc(d.ocupacao)}</b></div>
            <div class="fieldrow"><span>Nível / NEX</span><b contenteditable="true" onblur="saveSheetField(${agent.id}, 'nivelNex', this.innerText)">${esc(d.nivelNex)}</b></div>
          </div>
        </div>

        <div class="main-grid">
          <div class="left-col">
            <div class="skills-box">
              <div class="section-title">PERÍCIAS <small>· padrão = d4</small></div>
              <div class="skills-grid">
                ${SHEET_SKILLS_LIST.map((skillName) => `
                  <div class="skill">
                    <span>${esc(skillName)}</span>
                    <b contenteditable="true" onblur="saveSheetSkill(${agent.id}, '${skillName}', this.innerText)">${esc(d.skills[skillName] || "d4")}</b>
                  </div>
                `).join("")}
              </div>
              <div class="apt">
                <span>APTIDÃO ESPECIALIZADA</span>
                <b contenteditable="true" onblur="saveSheetField(${agent.id}, 'aptidao', this.innerText)">${esc(d.aptidao)}</b>
              </div>
            </div>

            <div class="personality-box">
              <div class="section-title">PERSONALIDADE / CONCEITO</div>
              <p contenteditable="true" onblur="saveSheetField(${agent.id}, 'personalidade', this.innerText)">${esc(d.personalidade)}</p>
            </div>

            <div class="dejavu-box">
              <div>
                <div class="section-title" contenteditable="true" onblur="saveSheetField(${agent.id}, 'dejavuTitle', this.innerText)">${esc(d.dejavuTitle || "MECÂNICA")}</div>
                <p contenteditable="true" onblur="saveSheetHtmlField(${agent.id}, 'dejavuDesc', this.innerHTML)">${d.dejavuDesc}</p>
              </div>
              <div class="points">
                <span>PONTOS RESTANTES</span>
                ${d.dejavuPoints.map((pt, pIdx) => `
                  <b onclick="toggleSheetDejaVuPoint(${agent.id}, ${pIdx})" title="Clique para marcar/desmarcar">${esc(pt)}</b>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="right-col">
            <div class="abilities-box ${d.abilities.length >= 6 ? "compact-abilities" : ""}">
              <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
                <span>HABILIDADES ESPECIAIS (${d.abilities.length})</span>
                <button type="button" class="sheet-mini-btn" onclick="addAgentAbility(${agent.id})" title="Adicionar Habilidade">+ Habilidade</button>
              </div>
              ${d.abilities.length === 0 ? `
                <div class="ability-empty">Nenhuma habilidade adicionada. Clique em <b>+ Habilidade</b> para inserir.</div>
              ` : d.abilities.map((ab, aIdx) => `
                <div class="ability">
                  <div class="ability-head-row">
                    <b contenteditable="true" onblur="saveSheetAbility(${agent.id}, ${aIdx}, 'title', this.innerText)">${esc(ab.title)}</b>
                    <button type="button" class="sheet-del-mini" onclick="removeAgentAbility(${agent.id}, ${aIdx})" title="Remover habilidade">×</button>
                  </div>
                  <span contenteditable="true" onblur="saveSheetAbility(${agent.id}, ${aIdx}, 'desc', this.innerText)">${esc(ab.desc)}</span>
                </div>
              `).join("")}
            </div>

            <div class="front-inventory-box">
              <div class="section-title">INVENTÁRIO &amp; EQUIPAMENTO</div>
              <div class="write-lines">
                ${d.inventoryLines.map((line, lIdx) => `
                  <div class="write-line" contenteditable="true" onblur="saveSheetInvLine(${agent.id}, ${lIdx}, this.innerText)">${esc(line)}</div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="front-footer">
          <span>ORDEM PARANORMAL · FICHA DE AGENTE</span>
          <span>${esc(agent.name)}</span>
        </div>
      </section>
    </div>
  `;
}

function updateSheetOpacity(val) {
  const numVal = Math.max(15, Math.min(100, Number(val) || 78));
  state.sheetCardOpacity = numVal;
  const alpha = (numVal / 100).toFixed(2);
  const bgValue = `rgba(255, 255, 255, ${alpha})`;

  document.documentElement.style.setProperty("--card-alpha", alpha);
  document.documentElement.style.setProperty("--card-bg", bgValue);
  if (document.body) {
    document.body.style.setProperty("--card-alpha", alpha);
    document.body.style.setProperty("--card-bg", bgValue);
  }
  const fichasView = document.querySelector(".fichas-view");
  if (fichasView) {
    fichasView.style.setProperty("--card-alpha", alpha);
    fichasView.style.setProperty("--card-bg", bgValue);
  }
  const label = $("opacityVal");
  if (label) label.textContent = numVal + "%";
}

async function createGenericSheet() {
  if (!state.activeCampaignId) return;
  const count = getCampaignAgents().length;
  const preset = SHEET_COLOR_PRESETS[count % SHEET_COLOR_PRESETS.length];
  const defaultData = createDefaultAgentData();

  const res = await api("/api/agents", "POST", {
    campaign_id: state.activeCampaignId,
    name: `Agente ${count + 1}`,
    accent_color: preset.accent,
    soft_color: preset.soft,
    portrait_data: "",
    data_json: defaultData
  });
  if (res && res.id && state.selectedSheetFilter !== "all") {
    state.selectedSheetFilter = String(res.id);
  }
  await loadAllData();
}

async function duplicateAgentSheet(agentId) {
  const orig = state.agents.find((a) => a.id === agentId);
  if (!orig) return;
  await api("/api/agents", "POST", {
    campaign_id: orig.campaign_id,
    name: `${orig.name} (Cópia)`,
    accent_color: orig.accent_color,
    soft_color: orig.soft_color,
    portrait_data: orig.portrait_data || "",
    data_json: parseAgentData(orig.data_json)
  });
  await loadAllData();
}

async function deleteAgentSheet(agentId) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag || !confirm(`Excluir a ficha de "${ag.name}"?`)) return;
  await api(`/api/agents/${agentId}`, "DELETE");
  await loadAllData();
}

async function updateAgentColor(agentId, accent, soft) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  ag.accent_color = accent;
  ag.soft_color = soft;
  await api(`/api/agents/${agentId}`, "PUT", {
    accent_color: accent,
    soft_color: soft
  });
  renderSheetsWorkspace();
}

async function saveSheetName(agentId, rawText) {
  const ag = state.agents.find((a) => a.id === agentId);
  const nextName = rawText.trim() || "Nome do Agente";
  if (!ag || ag.name === nextName) return;
  ag.name = nextName;
  await api(`/api/agents/${agentId}`, "PUT", { name: nextName });
  const footerSpan = document.querySelector(`.sheet-wrapper[data-agent-id="${agentId}"] .front-footer span:last-child`);
  if (footerSpan) footerSpan.textContent = nextName;
}

async function saveSheetField(agentId, key, rawText) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  const val = rawText.trim();
  if (d[key] === val) return;
  d[key] = val;
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
}

async function saveSheetHtmlField(agentId, key, rawHtml) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  if (d[key] === rawHtml) return;
  d[key] = rawHtml;
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
}

async function saveSheetSkill(agentId, skillName, rawText) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  const val = rawText.trim() || "d4";
  if (d.skills[skillName] === val) return;
  d.skills[skillName] = val;
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
}

async function toggleSheetDejaVuPoint(agentId, idx) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  d.dejavuPoints[idx] = d.dejavuPoints[idx] === "○" ? "●" : "○";
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
  renderSheetsWorkspace();
}

async function saveSheetAbility(agentId, idx, subKey, rawText) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  if (!d.abilities[idx]) return;
  const val = rawText.trim();
  if (d.abilities[idx][subKey] === val) return;
  d.abilities[idx][subKey] = val;
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
}

async function addAgentAbility(agentId) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  d.abilities.push({
    title: `Habilidade ${d.abilities.length + 1}`,
    desc: "Descreva o efeito mecânico da habilidade."
  });
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
  renderSheetsWorkspace();
}

async function removeAgentAbility(agentId, idx) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  d.abilities.splice(idx, 1);
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
  renderSheetsWorkspace();
}

async function addAgentBlankLine(agentId) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  d.inventoryLines.push("");
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
  renderSheetsWorkspace();
}

async function saveSheetInvNote(agentId, idx, rawHtml) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  if (d.inventoryNotes[idx] === rawHtml) return;
  d.inventoryNotes[idx] = rawHtml;
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
}

async function addAgentInvItem(agentId) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  d.inventoryNotes.push(`<b>Item ${d.inventoryNotes.length + 1}:</b> Descrição do item.`);
  if (d.inventoryLines.length > 4) d.inventoryLines.pop();
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
  renderSheetsWorkspace();
}

async function saveSheetInvLine(agentId, idx, rawText) {
  const ag = state.agents.find((a) => a.id === agentId);
  if (!ag) return;
  const d = parseAgentData(ag.data_json);
  if (d.inventoryLines[idx] === rawText) return;
  d.inventoryLines[idx] = rawText;
  ag.data_json = JSON.stringify(d);
  await api(`/api/agents/${agentId}`, "PUT", { data_json: d });
}

function triggerSheetUpload(agentId) {
  const input = $(`portraitInput_${agentId}`);
  if (input) input.click();
}

function applySheetImageFile(file, agentId) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    const ag = state.agents.find((a) => a.id === agentId);
    if (ag) ag.portrait_data = dataUrl;
    await api(`/api/agents/${agentId}`, "PUT", { portrait_data: dataUrl });
    renderSheetsWorkspace();
  };
  reader.readAsDataURL(file);
}

function loadSheetPortrait(event, agentId) {
  applySheetImageFile(event.target.files[0], agentId);
}

function handleSheetDrop(event, agentId) {
  event.preventDefault();
  if (event.dataTransfer.files && event.dataTransfer.files[0]) {
    applySheetImageFile(event.dataTransfer.files[0], agentId);
  }
}

async function removeSheetPortrait(event, agentId) {
  event.stopPropagation();
  const ag = state.agents.find((a) => a.id === agentId);
  if (ag) ag.portrait_data = "";
  await api(`/api/agents/${agentId}`, "PUT", { portrait_data: "" });
  renderSheetsWorkspace();
}
