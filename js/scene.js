// =========================================================================
// WORKSPACE DA CENA: ETAPAS EM ABAS | NPCS & AMEAÇAS
// =========================================================================
function renderWorkspace() {
  const main = $("mainWorkspace");

  if (!state.activeCampaignId) {
    _lastRenderContext = {
      viewMode: "scene",
      campaignId: null,
      sceneId: null,
      stepId: null,
      sectionFilter: null,
      sheetFilter: null
    };
    main.innerHTML = `
      <div class="empty-state">
        <h2>NENHUMA CAMPANHA ATIVA</h2>
        <p>Crie uma campanha na barra lateral para estruturar suas cenas, etapas, pontos de interesse, testes e itens.</p>
        <button class="primary" onclick="createCampaign()">+ Criar Primeira Campanha</button>
      </div>
    `;
    return;
  }

  const scene = getActiveScene();
  if (!scene) {
    _lastRenderContext = {
      viewMode: "scene",
      campaignId: state.activeCampaignId,
      sceneId: null,
      stepId: null,
      sectionFilter: null,
      sheetFilter: null
    };
    main.innerHTML = `
      <div class="empty-state">
        <h2>CAMPANHA SEM CENAS SELECIONADAS</h2>
        <p>Adicione uma cena para organizar as etapas, pontos de interesse, testes e itens da sessão.</p>
        <button class="primary" onclick="createScene()">+ Criar Nova Cena</button>
      </div>
    `;
    return;
  }

  const sceneSteps = getSceneSteps(scene.id);
  const sceneNpcs = state.npcs.filter((n) => n.scene_id === scene.id);

  if (sceneSteps.length > 0) {
    if (!sceneSteps.some((st) => st.id === state.activeStepId)) {
      state.activeStepId = sceneSteps[0].id;
    }
  } else {
    state.activeStepId = null;
  }

  const activeStepIdx = sceneSteps.findIndex((st) => st.id === state.activeStepId);
  const activeStep = activeStepIdx >= 0 ? sceneSteps[activeStepIdx] : null;

  const f = state.sceneSectionFilter === "npcs" ? "npcs" : "etapas";
  const showEtapas = f === "etapas";
  const showNpcs = f === "npcs";

  const isSameSceneView =
    _lastRenderContext.viewMode === "scene" &&
    _lastRenderContext.campaignId === state.activeCampaignId &&
    _lastRenderContext.sceneId === scene.id &&
    _lastRenderContext.stepId === state.activeStepId &&
    _lastRenderContext.sectionFilter === f;

  _lastRenderContext = {
    viewMode: "scene",
    campaignId: state.activeCampaignId,
    sceneId: scene.id,
    stepId: state.activeStepId,
    sectionFilter: f,
    sheetFilter: null
  };

  preserveScrollAround(() => {
    main.innerHTML = `
    <div class="scene-topbar">
      <div class="scene-title-row">
        <span class="dossier-tag mono">CENA</span>
        <input id="sceneTitleInput" class="scene-title-input" value="${esc(scene.title)}" onchange="updateSceneTitle(this.value)" />
      </div>

      <div class="scene-view-pills">
        <button class="pill-btn ${f === "etapas" ? "active" : ""}" onclick="setSceneFilter('etapas')">
          Etapas & Pontos de Interesse (${sceneSteps.length})
        </button>
        <button class="pill-btn ${f === "npcs" ? "active" : ""}" onclick="setSceneFilter('npcs')">
          NPCs & Ameaças (${sceneNpcs.length})
        </button>
        <button class="pill-btn" style="margin-left:auto; border-color:var(--border-accent); color:var(--primary);" onclick="loadSceneEncounterIntoCombat(false); setMainView('combat');" title="Levar os Agentes e NPCs desta cena para o Rastreador de Combate">
          ⚔ Abrir no Rastreador de Combate
        </button>
      </div>
    </div>

    <div class="scene-scroll-body">
      ${showEtapas ? `
        <section>
          <div class="step-tabs-bar">
            ${sceneSteps.map((st, idx) => {
              const isActive = st.id === state.activeStepId;
              return `
                <button
                  class="step-tab-btn ${isActive ? "active" : ""} ${st.completed ? "completed" : ""}"
                  onclick="selectStepTab(${st.id})"
                  title="${esc(st.title)}"
                >
                  <span class="mono" style="opacity:0.75;">#${idx + 1}</span>
                  <span class="step-tab-label">${esc(st.title)}</span>
                  ${st.completed ? `<span style="color:var(--success); font-weight:800;">✓</span>` : ""}
                </button>
              `;
            }).join("")}

            <button class="primary icon-btn" onclick="state.showNewStepForm = !state.showNewStepForm; renderWorkspace();">
              ${state.showNewStepForm ? "Fechar Formulário" : "+ Nova Etapa"}
            </button>
          </div>

          ${state.showNewStepForm ? `
            <div class="inline-drawer-form">
              <strong style="display:block; font-size:15px; margin-bottom:10px;">Adicionar Nova Aba de Etapa</strong>
              <div style="margin-bottom:10px;">
                <label>Título da Etapa</label>
                <input id="newStepTitle" placeholder="Ex: Etapa ${sceneSteps.length + 1} — Pane na Estrada" />
              </div>
              <div style="margin-bottom:12px;">
                <label>Narração da Etapa (Descrição do Ambiente e Acontecimento)</label>
                <textarea id="newStepNarration" rows="4" placeholder="Descreva o ambiente, o clima e o que acontece nesta etapa..."></textarea>
              </div>
              <div style="display:flex; gap:8px; justify-content:flex-end;">
                <button onclick="state.showNewStepForm = false; renderWorkspace();">Cancelar</button>
                <button class="primary" onclick="addSceneStep()">Salvar Etapa</button>
              </div>
            </div>
          ` : ""}

          ${sceneSteps.length === 0 && !state.showNewStepForm ? `
            <div class="step-card" style="text-align:center; color:var(--text-muted); padding:28px; font-size:15px;">
              Nenhuma etapa cadastrada nesta cena. Clique em <strong>+ Nova Etapa</strong> acima para criar a primeira aba:
              <div class="mono" style="font-size:13px; margin-top:8px;">Etapa (Narração) → Pontos de Interesse (Locais/Objetos) → Testes & Itens</div>
            </div>
          ` : ""}

          ${activeStep ? renderStepBlock(activeStep, activeStepIdx, sceneSteps.length) : ""}
        </section>
      ` : ""}

      ${showNpcs ? `
        <section>
          <div class="section-header-bar">
            <div class="section-title">
              <span>NPCs & Ameaças da Cena</span>
              <span class="badge danger mono">${sceneNpcs.length}</span>
            </div>
            <button class="primary icon-btn" onclick="state.showNewNpcForm = !state.showNewNpcForm; renderWorkspace();">
              ${state.showNewNpcForm ? "Fechar Formulário" : "+ Novo NPC / Criatura"}
            </button>
          </div>

          ${state.showNewNpcForm ? renderNewNpcFormHtml() : ""}

          ${sceneNpcs.length === 0 && !state.showNewNpcForm ? `
            <div style="font-size:14.5px; color:var(--text-muted); padding:8px 4px;">
              Nenhum NPC ou criatura vinculado a esta cena.
            </div>
          ` : ""}

          ${sceneNpcs.map(n => renderNpcCardHtml(n)).join("")}
        </section>
      ` : ""}
    </div>
  `;
  }, { keepSceneScroll: isSameSceneView, keepSheetsScroll: false, keepSidebarScroll: false, keepDiceScroll: false });
}

function selectStepTab(stepId) {
  state.activeStepId = stepId;
  cancelAllInlineForms();
  renderWorkspace();
}

function setSceneFilter(filterKey) {
  state.sceneSectionFilter = filterKey;
  renderWorkspace();
}

// =========================================================================
// NÍVEL 2: ETAPA (NARRAÇÃO + PONTOS DE INTERESSE [LOCAIS / OBJETOS])
// =========================================================================
function renderStepBlock(st, idx, totalSteps) {
  const isEditing = state.editingStepId === st.id;
  const stepPois = state.pois.filter((p) => p.step_id === st.id);
  const isAddingPoi = state.openAddPoiStepId === st.id;

  return `
    <div class="step-card ${st.completed ? "completed" : ""}">
      <div class="step-card-header">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="badge primary mono">ETAPA ${idx + 1} / ${totalSteps}</span>
          <strong class="step-card-title">${esc(st.title)}</strong>
          ${st.completed ? `<span class="badge success">✓ Concluída</span>` : ""}
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="icon-btn" title="Mover Aba para Esquerda" ${idx === 0 ? "disabled" : ""} onclick="moveSceneStep(${st.id}, -1)">←</button>
          <button class="icon-btn" title="Mover Aba para Direita" ${idx === totalSteps - 1 ? "disabled" : ""} onclick="moveSceneStep(${st.id}, 1)">→</button>
          <button class="icon-btn" onclick="toggleStepCompleted(${st.id}, ${st.completed ? 0 : 1})">
            ${st.completed ? "Reabrir" : "Concluir"}
          </button>
          <button class="icon-btn" onclick="toggleEditStep(${st.id})">${isEditing ? "Cancelar" : "Editar"}</button>
          <button class="icon-btn danger" onclick="deleteEntity('scene_steps', ${st.id})">✕</button>
        </div>
      </div>

      <div class="step-card-body">
        ${isEditing ? `
          <div class="inline-drawer-form">
            <div style="margin-bottom:10px;">
              <label>Título da Etapa</label>
              <input id="editStepTitle_${st.id}" value="${esc(st.title)}" />
            </div>
            <div style="margin-bottom:10px;">
              <label>Narração da Etapa</label>
              <textarea id="editStepNarr_${st.id}" rows="5">${esc(st.narration)}</textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
              <button onclick="toggleEditStep(${st.id})">Cancelar</button>
              <button class="primary" onclick="saveSceneStep(${st.id})">Salvar Alterações</button>
            </div>
          </div>
        ` : `
          ${st.narration ? `
            <div class="narration-script-card">
              <div class="narration-script-label">Narração para os Jogadores</div>
              <div class="narration-box">${esc(st.narration)}</div>
            </div>
          ` : `
            <div style="font-size:14px; color:var(--text-muted); margin-bottom:12px;">
              Sem texto de narração cadastrado nesta etapa.
            </div>
          `}

          <div class="step-pois-wrapper">
            <div class="step-sub-header">
              <span class="step-sub-title">Pontos de Interesse — Locais & Objetos (${stepPois.length})</span>
              <button class="primary icon-btn" onclick="toggleAddPoiInStep(${st.id})">
                ${isAddingPoi ? "Cancelar" : "+ Ponto de Interesse (Local / Objeto)"}
              </button>
            </div>

            ${isAddingPoi ? renderPoiFormHtml(st.id, null) : ""}

            ${stepPois.length === 0 && !isAddingPoi ? `
              <div style="font-size:14px; color:var(--text-muted); padding:6px 0;">
                Nenhum local ou objeto cadastrado nesta etapa. Adicione um Ponto de Interesse para concentrar seus testes e itens.
              </div>
            ` : ""}

            ${stepPois.map(p => renderPoiBlock(p)).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderPoiFormHtml(stepId, existingPoi) {
  const formKey = existingPoi ? `edit_${existingPoi.id}` : `new_${stepId}`;
  const pType = existingPoi ? (existingPoi.poi_type || "Objeto") : "Objeto";
  const pTitle = existingPoi ? existingPoi.title : "";
  const pInfo = existingPoi ? existingPoi.info : "";

  return `
    <div class="inline-drawer-form">
      <strong style="display:block; font-size:14.5px; margin-bottom:10px;">
        ${existingPoi ? "Editar Ponto de Interesse" : "Novo Ponto de Interesse (Local ou Objeto)"}
      </strong>
      <div class="grid-poi-form" style="margin-bottom:10px;">
        <div>
          <label>Tipo</label>
          <select id="poiType_${formKey}">
            <option value="Objeto" ${pType === "Objeto" ? "selected" : ""}>Objeto</option>
            <option value="Local" ${pType === "Local" ? "selected" : ""}>Local</option>
          </select>
        </div>
        <div>
          <label>Nome do Local ou Objeto</label>
          <input id="poiTitle_${formKey}" value="${esc(pTitle)}" placeholder="Ex: O Carro da Equipe / O Milharal / O Descampado" />
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <label>Descrição do Local ou Objeto (O que os jogadores veem ao se aproximar)</label>
        <textarea id="poiInfo_${formKey}" rows="2" placeholder="Descreva o estado visual do objeto ou local...">${esc(pInfo)}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button onclick="cancelAllInlineForms()">Cancelar</button>
        ${existingPoi
          ? `<button class="primary" onclick="savePoi(${existingPoi.id})">Salvar Alterações</button>`
          : `<button class="primary" onclick="addPoi(${stepId})">Salvar Ponto de Interesse</button>`}
      </div>
    </div>
  `;
}
