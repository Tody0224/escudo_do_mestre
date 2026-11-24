// =========================================================================
// RENDERIZAÇÃO PRINCIPAL E NAVEGAÇÃO ENTRE ABAS
// =========================================================================
function setMainView(mode) {
  state.viewMode = mode;
  renderAll();
}

function renderAll() {
  if (state.viewMode === "flowchart") {
    state.viewMode = "scene";
  }
  renderSidebar();
  updateTopBreadcrumb();
  updateTopNavButtons();

  if (state.viewMode === "combat") {
    renderCombatWorkspace();
  } else if (state.viewMode === "rules") {
    renderRulesReferenceWorkspace();
  } else if (state.viewMode === "mechanics") {
    renderCampaignMechanicsWorkspace();
  } else if (state.viewMode === "sheets") {
    renderSheetsWorkspace();
  } else {
    renderWorkspace();
  }
  renderDicePanel();
}

function updateTopNavButtons() {
  $("navSceneBtn").classList.toggle("primary", state.viewMode === "scene");
  if ($("navCombatBtn")) {
    $("navCombatBtn").classList.toggle("primary", state.viewMode === "combat");
  }
  if ($("navRulesBtn")) {
    $("navRulesBtn").classList.toggle("primary", state.viewMode === "rules");
  }
  if ($("navMechanicsBtn")) {
    $("navMechanicsBtn").classList.toggle("primary", state.viewMode === "mechanics");
  }
  $("navSheetsBtn").classList.toggle("primary", state.viewMode === "sheets");
}

function updateTopBreadcrumb() {
  const el = $("topBreadcrumb");
  const camp = state.campaigns.find((c) => c.id === state.activeCampaignId);
  const scene = getActiveScene();
  if (!camp) {
    el.textContent = "Escudo do Mestre • Ordem Paranormal II";
    return;
  }
  if (state.viewMode === "combat") {
    const cs = getCombatState();
    el.textContent = `${camp.name} / Rastreador de Combate • Rodada ${cs.round || 1} (${cs.participants.length} combatentes)`;
    return;
  }
  if (state.viewMode === "rules") {
    el.textContent = `Compêndio de Regras • Ordem Paranormal II (Playtest Beta 1.2)`;
    return;
  }
  if (state.viewMode === "mechanics") {
    el.textContent = `${camp.name} / Mecânicas da Temporada & Anotações Gerais`;
    return;
  }
  if (state.viewMode === "sheets") {
    const count = getCampaignAgents().length;
    el.textContent = `${camp.name} / Fichas de Agentes (${count})`;
    return;
  }
  el.textContent = scene ? `${camp.name} / ${scene.title}` : camp.name;
}

function toggleSidebarDrawer(drawerId, btnEl) {
  const target = $(drawerId);
  if (!target) return;
  const allDrawers = ["campaignFilterDrawer", "campaignJsonDrawer"];
  const willOpen = target.classList.contains("hidden");

  allDrawers.forEach((id) => {
    const d = $(id);
    if (d) d.classList.add("hidden");
  });
  if ($("toggleCampaignFilterBtn")) $("toggleCampaignFilterBtn").classList.remove("active");
  if ($("toggleCampaignJsonBtn")) $("toggleCampaignJsonBtn").classList.remove("active");

  if (willOpen) {
    target.classList.remove("hidden");
    if (btnEl) btnEl.classList.add("active");
    const firstInput = target.querySelector("input");
    if (firstInput) firstInput.focus();
  }
}

function clearSceneFilter() {
  state.sceneFilter = "";
  const input = $("sceneFilterInput");
  if (input) input.value = "";
  renderSidebar();
}

function renderSidebar() {
  preserveScrollAround(() => {
    const select = $("campaignSelect");
    select.innerHTML = "";
    const filteredCamps = getFilteredCampaigns();

    const filterBtn = $("toggleCampaignFilterBtn");
    if (filterBtn) {
      const hasFilter = Boolean(state.campaignFilter.trim()) || state.campaignSort !== "default";
      filterBtn.classList.toggle("active", hasFilter || !($("campaignFilterDrawer")?.classList.contains("hidden")));
    }

    if (!filteredCamps.length) {
      select.innerHTML = `<option value="">${state.campaigns.length ? "Nenhuma no filtro" : "Nenhuma campanha"}</option>`;
      $("renameCampaignBtn").disabled = true;
      $("deleteCampaignBtn").disabled = true;
      $("newSceneBtn").disabled = !state.activeCampaignId;
    } else {
      $("renameCampaignBtn").disabled = false;
      $("deleteCampaignBtn").disabled = false;
      $("newSceneBtn").disabled = false;

      if (!filteredCamps.some((c) => c.id === state.activeCampaignId)) {
        state.activeCampaignId = filteredCamps[0].id;
      }

      filteredCamps.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        if (c.id === state.activeCampaignId) opt.selected = true;
        select.appendChild(opt);
      });
    }

    const clearSceneBtn = $("clearSceneFilterBtn");
    if (clearSceneBtn) {
      clearSceneBtn.classList.toggle("hidden", !state.sceneFilter.trim());
    }

    const list = $("sceneList");
    list.innerHTML = "";
    const scenes = getFilteredCampaignScenes();
    const totalCampScenes = state.scenes.filter((s) => s.campaign_id === state.activeCampaignId).length;
    const countBadge = $("sceneCountBadge");
    if (countBadge) {
      countBadge.textContent = state.sceneFilter.trim()
        ? `${scenes.length}/${totalCampScenes}`
        : `${totalCampScenes}`;
    }

    const canReorder = state.sceneSort === "position" && !state.sceneFilter.trim();

    if (!scenes.length) {
      list.innerHTML = `<div style="padding:14px 8px; font-size:13.5px; color:var(--text-muted); text-align:center;">
        ${state.activeCampaignId ? "Nenhuma cena encontrada." : "Crie uma campanha acima para começar."}
      </div>`;
      return;
    }

    scenes.forEach((s, index) => {
      const div = document.createElement("div");
      div.className = `scene-item ${s.id === state.activeSceneId ? "active" : ""}`;
      const numLabel = String(index + 1).padStart(2, "0");
      div.innerHTML = `
        <span class="scene-index-badge mono">${numLabel}</span>
        <span class="scene-item-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <div class="scene-actions" onclick="event.stopPropagation()">
          ${canReorder ? `
            <button class="icon-btn" title="Subir cena" ${index === 0 ? "disabled" : ""} onclick="moveScene(${s.id}, -1)">↑</button>
            <button class="icon-btn" title="Descer cena" ${index === scenes.length - 1 ? "disabled" : ""} onclick="moveScene(${s.id}, 1)">↓</button>
          ` : ""}
          <button class="icon-btn danger" title="Excluir cena" onclick="deleteScene(${s.id})">✕</button>
        </div>
      `;
      div.onclick = () => {
        state.activeSceneId = s.id;
        state.activeStepId = null;
        state.viewMode = "scene";
        cancelAllInlineForms(true);
        renderAll();
      };
      list.appendChild(div);
    });
  }, { keepSidebarScroll: true, keepSceneScroll: false, keepSheetsScroll: false, keepDiceScroll: false });
}

function toggleLeftSidebar() {
  const sb = $("leftSidebar");
  if (!sb) return;
  const isCollapsed = sb.classList.toggle("collapsed");
  const btn = $("toggleLeftSidebarBtn");
  if (btn) {
    btn.innerHTML = isCollapsed ? "&raquo; Campanhas / Cenas" : "&laquo; Cenas";
  }
}
