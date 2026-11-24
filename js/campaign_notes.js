// =========================================================================
// ABA: MECÂNICAS EXCLUSIVAS DA TEMPORADA & ANOTAÇÕES GERAIS DA CAMPANHA
// =========================================================================
function renderCampaignMechanicsWorkspace() {
  const main = $("mainWorkspace");

  if (!state.activeCampaignId) {
    main.innerHTML = `
      <div class="empty-state">
        <h2>NENHUMA CAMPANHA ATIVA</h2>
        <p>Crie ou selecione uma campanha na barra lateral para registrar as mecânicas exclusivas da temporada e suas anotações gerais.</p>
        <button class="primary" onclick="createCampaign()">+ Criar Primeira Campanha</button>
      </div>
    `;
    return;
  }

  const camp = state.campaigns.find((c) => c.id === state.activeCampaignId);
  if (!camp) return;

  const isSameNotesView =
    _lastRenderContext.viewMode === "mechanics" &&
    _lastRenderContext.campaignId === state.activeCampaignId;

  _lastRenderContext = {
    viewMode: "mechanics",
    campaignId: state.activeCampaignId,
    sceneId: null,
    stepId: null,
    sectionFilter: null,
    sheetFilter: null
  };

  preserveScrollAround(() => {
    main.innerHTML = `
    <div class="scene-topbar">
      <div class="scene-title-row">
        <span class="dossier-tag mono">CAMPANHA</span>
        <strong style="font-size: 20px; font-weight: 800;">${esc(camp.name)}</strong>
        <span class="badge primary" style="margin-left: auto;">Regras da Temporada &amp; Caderno do Mestre</span>
      </div>
    </div>

    <div class="scene-scroll-body">
      <div class="grid-2" style="align-items: stretch; gap: 18px;">
        <div class="step-card" style="margin-bottom: 0; display: flex; flex-direction: column;">
          <div class="step-card-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge warning mono">TEMPORADA</span>
              <strong class="step-card-title">Mecânicas Exclusivas da Temporada</strong>
            </div>
            <button class="primary icon-btn" onclick="saveCampaignNotes(${camp.id})">Salvar</button>
          </div>
          <div class="step-card-body" style="flex: 1; display: flex; flex-direction: column;">
            <label for="campSeasonMechanicsInput">Regras especiais, sistemas únicos, condições e efeitos da campanha</label>
            <textarea
              id="campSeasonMechanicsInput"
              rows="18"
              style="flex: 1; min-height: 360px; font-size: 15px; line-height: 1.65; resize: vertical;"
              placeholder="Descreva aqui as mecânicas exclusivas desta temporada (ex: Medidores de Exposição, Regras de Sanidade/Pavor específicas, Efeitos do Elemento dominante, Sistemas de Investigação ou Sobrevivência)..."
              onblur="saveCampaignNotes(${camp.id})"
            >${esc(camp.season_mechanics || "")}</textarea>
          </div>
        </div>

        <div class="step-card" style="margin-bottom: 0; display: flex; flex-direction: column; border-top-color: var(--info);">
          <div class="step-card-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge info mono">MESTRE</span>
              <strong class="step-card-title">Anotações Gerais da Campanha</strong>
            </div>
            <button class="primary icon-btn" onclick="saveCampaignNotes(${camp.id})">Salvar</button>
          </div>
          <div class="step-card-body" style="flex: 1; display: flex; flex-direction: column;">
            <label for="campGeneralNotesInput">Lembretes de sessão, ganchos de história, facções, pistas soltas e ideias</label>
            <textarea
              id="campGeneralNotesInput"
              rows="18"
              style="flex: 1; min-height: 360px; font-size: 15px; line-height: 1.65; resize: vertical;"
              placeholder="Anote aqui informações gerais da campanha, nomes de NPCs improvisados, resumo das sessões anteriores, segredos da trama e ganchos futuros..."
              onblur="saveCampaignNotes(${camp.id})"
            >${esc(camp.general_notes || "")}</textarea>
          </div>
        </div>
      </div>
    </div>
  `;
  }, { keepSceneScroll: isSameNotesView, keepSheetsScroll: false, keepSidebarScroll: false, keepDiceScroll: false });
}

async function saveCampaignNotes(campaignId) {
  const camp = state.campaigns.find((c) => c.id === campaignId);
  if (!camp) return;

  const mechEl = $("campSeasonMechanicsInput");
  const notesEl = $("campGeneralNotesInput");
  if (!mechEl || !notesEl) return;

  const nextMechanics = mechEl.value;
  const nextNotes = notesEl.value;

  if (
    (camp.season_mechanics || "") === nextMechanics &&
    (camp.general_notes || "") === nextNotes
  ) {
    return;
  }

  camp.season_mechanics = nextMechanics;
  camp.general_notes = nextNotes;

  await api(`/api/campaigns/${campaignId}`, "PUT", {
    season_mechanics: nextMechanics,
    general_notes: nextNotes
  });
}
