// =========================================================================
// CRUD E CONTROLE DE FORMULÁRIOS NA HIERARQUIA
// =========================================================================
function onInlineMechanicChange(formKey, key) {
  const mech = ORDEM_MECHANICS.find((m) => m.key === key);
  if (!mech) return;
  $(`testMechName_${formKey}`).value = mech.name;
  $(`testMechRules_${formKey}`).value = mech.rules;
  $(`testAttr_${formKey}`).value = mech.defaultAttr;
  $(`testSkill_${formKey}`).value = mech.defaultSkill;
  $(`testDt_${formKey}`).value = mech.defaultDt;
}

function cancelAllInlineForms(skipRender = false) {
  state.showNewStepForm = false;
  state.editingStepId = null;
  state.openAddPoiStepId = null;
  state.editingPoiId = null;
  state.openAddTestPoiId = null;
  state.editingTestId = null;
  state.openAddItemPoiId = null;
  state.editingItemId = null;
  if (!skipRender) {
    renderWorkspace();
  }
}

function toggleAddPoiInStep(stepId) {
  const next = state.openAddPoiStepId === stepId ? null : stepId;
  cancelAllInlineForms(true);
  state.openAddPoiStepId = next;
  renderWorkspace();
}

function toggleEditPoi(poiId) {
  const next = state.editingPoiId === poiId ? null : poiId;
  cancelAllInlineForms(true);
  state.editingPoiId = next;
  renderWorkspace();
}

function toggleAddTestInPoi(poiId) {
  const next = state.openAddTestPoiId === poiId ? null : poiId;
  cancelAllInlineForms(true);
  state.openAddTestPoiId = next;
  renderWorkspace();
}

function toggleEditTest(testId) {
  const next = state.editingTestId === testId ? null : testId;
  cancelAllInlineForms(true);
  state.editingTestId = next;
  renderWorkspace();
}

function toggleAddItemInPoi(poiId) {
  const next = state.openAddItemPoiId === poiId ? null : poiId;
  cancelAllInlineForms(true);
  state.openAddItemPoiId = next;
  renderWorkspace();
}

function toggleEditItem(itemId) {
  const next = state.editingItemId === itemId ? null : itemId;
  cancelAllInlineForms(true);
  state.editingItemId = next;
  renderWorkspace();
}

async function createCampaign() {
  const name = prompt("Nome da nova campanha:");
  if (!name || !name.trim()) return;
  const res = await api("/api/campaigns", "POST", { name: name.trim() });
  state.activeCampaignId = res.id;
  await loadAllData();
}

async function renameCampaign() {
  const camp = state.campaigns.find((c) => c.id === state.activeCampaignId);
  if (!camp) return;
  const name = prompt("Novo nome da campanha:", camp.name);
  if (!name || !name.trim()) return;
  await api(`/api/campaigns/${camp.id}`, "PUT", { name: name.trim() });
  await loadAllData();
}

async function deleteCampaign() {
  const camp = state.campaigns.find((c) => c.id === state.activeCampaignId);
  if (!camp || !confirm(`Excluir a campanha "${camp.name}" e todas as suas cenas?`)) return;
  await api(`/api/campaigns/${camp.id}`, "DELETE");
  await loadAllData();
}

async function createScene() {
  if (!state.activeCampaignId) return;
  const count = state.scenes.filter((s) => s.campaign_id === state.activeCampaignId).length;
  const title = prompt("Título da nova cena:", `Cena ${count + 1}`);
  if (!title || !title.trim()) return;
  const res = await api("/api/scenes", "POST", {
    campaign_id: state.activeCampaignId,
    title: title.trim()
  });
  state.activeSceneId = res.id;
  state.activeStepId = null;
  await loadAllData();
}

async function updateSceneTitle(val) {
  const scene = getActiveScene();
  if (!scene || !val.trim()) return;
  await api(`/api/scenes/${scene.id}`, "PUT", { title: val.trim() });
  await loadAllData();
}

async function moveScene(sceneId, dir) {
  const list = getFilteredCampaignScenes();
  const idx = list.findIndex((s) => s.id === sceneId);
  const target = idx + dir;
  if (target < 0 || target >= list.length) return;
  [list[idx], list[target]] = [list[target], list[idx]];
  await api("/api/scenes/reorder", "POST", { scene_ids: list.map((s) => s.id) });
  await loadAllData();
}

async function deleteScene(sceneId) {
  if (!confirm("Excluir esta cena e todo o seu conteúdo?")) return;
  await api(`/api/scenes/${sceneId}`, "DELETE");
  await loadAllData();
}

async function addSceneStep() {
  const scene = getActiveScene();
  const title = $("newStepTitle").value.trim();
  if (!scene || !title) return;
  const res = await api("/api/scene_steps", "POST", {
    scene_id: scene.id,
    title,
    narration: $("newStepNarration").value.trim()
  });
  state.showNewStepForm = false;
  if (res && res.id) state.activeStepId = res.id;
  await loadAllData();
}

function toggleEditStep(stepId) {
  state.editingStepId = state.editingStepId === stepId ? null : stepId;
  renderWorkspace();
}

async function saveSceneStep(stepId) {
  const title = $(`editStepTitle_${stepId}`).value.trim();
  if (!title) return;
  await api(`/api/scene_steps/${stepId}`, "PUT", {
    title,
    narration: $(`editStepNarr_${stepId}`).value
  });
  state.editingStepId = null;
  await loadAllData();
}

async function toggleStepCompleted(stepId, completed) {
  await api(`/api/scene_steps/${stepId}`, "PUT", { completed });
  await loadAllData();
}

async function moveSceneStep(stepId, dir) {
  const scene = getActiveScene();
  if (!scene) return;
  const list = getSceneSteps(scene.id);
  const idx = list.findIndex((s) => s.id === stepId);
  const target = idx + dir;
  if (target < 0 || target >= list.length) return;
  [list[idx], list[target]] = [list[target], list[idx]];
  await api("/api/scene_steps/reorder", "POST", { step_ids: list.map((s) => s.id) });
  await loadAllData();
}

async function addPoi(stepId) {
  const scene = getActiveScene();
  const formKey = `new_${stepId}`;
  const title = $(`poiTitle_${formKey}`).value.trim();
  if (!scene || !title) return;

  await api("/api/pois", "POST", {
    scene_id: scene.id,
    step_id: stepId,
    poi_type: $(`poiType_${formKey}`).value,
    title,
    info: $(`poiInfo_${formKey}`).value.trim()
  });
  state.openAddPoiStepId = null;
  await loadAllData();
}

async function savePoi(poiId) {
  const formKey = `edit_${poiId}`;
  const title = $(`poiTitle_${formKey}`).value.trim();
  if (!title) return;

  await api(`/api/pois/${poiId}`, "PUT", {
    poi_type: $(`poiType_${formKey}`).value,
    title,
    info: $(`poiInfo_${formKey}`).value.trim()
  });
  state.editingPoiId = null;
  await loadAllData();
}

async function togglePoi(id, discovered) {
  await api(`/api/pois/${id}`, "PUT", { discovered });
  await loadAllData();
}

async function addTestToPoi(poiId, stepId) {
  const scene = getActiveScene();
  const formKey = `new_${poiId}`;
  const situation = $(`testSit_${formKey}`).value.trim();
  if (!scene || !situation) return;

  const mechKey = $(`testMechKey_${formKey}`).value;
  const mechName = $(`testMechName_${formKey}`).value.trim() || "Teste Padrão";
  const mechRules = $(`testMechRules_${formKey}`).value.trim();

  await api("/api/tests", "POST", {
    scene_id: scene.id,
    step_id: stepId,
    poi_id: poiId,
    situation,
    action_description: $(`testActionDesc_${formKey}`).value.trim(),
    mechanic_key: mechKey,
    mechanic_name: mechName,
    attribute: $(`testAttr_${formKey}`).value,
    skill: $(`testSkill_${formKey}`).value,
    dt: Number($(`testDt_${formKey}`).value),
    mechanic_rules: mechRules,
    success_outcome: $(`testSucc_${formKey}`).value.trim(),
    failure_outcome: $(`testFail_${formKey}`).value.trim()
  });
  state.openAddTestPoiId = null;
  await loadAllData();
}

async function saveTest(testId) {
  const formKey = `edit_${testId}`;
  const situation = $(`testSit_${formKey}`).value.trim();
  if (!situation) return;

  await api(`/api/tests/${testId}`, "PUT", {
    situation,
    action_description: $(`testActionDesc_${formKey}`).value.trim(),
    mechanic_key: $(`testMechKey_${formKey}`).value,
    mechanic_name: $(`testMechName_${formKey}`).value.trim() || "Teste Padrão",
    mechanic_rules: $(`testMechRules_${formKey}`).value.trim(),
    attribute: $(`testAttr_${formKey}`).value,
    skill: $(`testSkill_${formKey}`).value,
    dt: Number($(`testDt_${formKey}`).value),
    success_outcome: $(`testSucc_${formKey}`).value.trim(),
    failure_outcome: $(`testFail_${formKey}`).value.trim()
  });
  state.editingTestId = null;
  await loadAllData();
}

async function addItemToPoi(poiId) {
  const scene = getActiveScene();
  const formKey = `new_${poiId}`;
  const name = $(`poiItemName_${formKey}`).value.trim();
  if (!scene || !name) return;

  await api("/api/items", "POST", {
    scene_id: scene.id,
    poi_id: poiId,
    name,
    category: $(`poiItemCat_${formKey}`).value,
    description: $(`poiItemDesc_${formKey}`).value.trim(),
    collected: 0
  });
  state.openAddItemPoiId = null;
  await loadAllData();
}

async function saveItem(itemId) {
  const formKey = `edit_${itemId}`;
  const name = $(`poiItemName_${formKey}`).value.trim();
  if (!name) return;

  await api(`/api/items/${itemId}`, "PUT", {
    name,
    category: $(`poiItemCat_${formKey}`).value,
    description: $(`poiItemDesc_${formKey}`).value.trim()
  });
  state.editingItemId = null;
  await loadAllData();
}

async function toggleItem(id, collected) {
  await api(`/api/items/${id}`, "PUT", { collected });
  await loadAllData();
}

async function addNpc() {
  const scene = getActiveScene();
  const name = $("npcName").value.trim();
  if (!scene || !name) return;

  const hp = Number($("npcHp").value) || 10;
  const pd = Number($("npcPd").value) || 10;
  const skillsObj = {};
  ORDEM_SKILLS_META.forEach((s) => {
    skillsObj[s.key] = Number($(`newNpcSkill_${s.key}`).value) || 4;
  });

  await api("/api/npcs", "POST", {
    scene_id: scene.id,
    name,
    role: $("npcRole").value,
    element: $("npcElement").value,
    location: $("npcLocation").value.trim(),
    description: $("npcDescription").value.trim(),
    hp_current: hp,
    hp_max: hp,
    pd_current: pd,
    pd_max: pd,
    rd: Number($("npcRd").value) || 0,
    attr_fisico: Number($("npcAttrFisico").value) || 4,
    attr_mente: Number($("npcAttrMente").value) || 4,
    attr_emocao: Number($("npcAttrEmocao").value) || 4,
    skills_json: skillsObj,
    actions: $("npcActions").value.trim()
  });
  state.showNewNpcForm = false;
  await loadAllData();
}

async function applyNpcDelta(id, field, sign, maxVal) {
  const npc = state.npcs.find((n) => n.id === id);
  if (!npc) return;
  const inputId = field === "hp_current" ? `hpDelta_${id}` : `pdDelta_${id}`;
  const amount = Math.abs(Number($(inputId).value) || 0);
  if (amount === 0) return;
  const next = Math.max(0, Math.min(maxVal, npc[field] + sign * amount));
  await api(`/api/npcs/${id}`, "PUT", { [field]: next });
  await loadAllData();
}

function toggleEditNpc(id) {
  state.editingNpcId = state.editingNpcId === id ? null : id;
  renderWorkspace();
}

async function saveNpcSkills(id) {
  const skillsObj = {};
  ORDEM_SKILLS_META.forEach((s) => {
    skillsObj[s.key] = Number($(`editNpcSkill_${id}_${s.key}`).value) || 4;
  });
  const nextName = $(`editNpcName_${id}`).value.trim();
  await api(`/api/npcs/${id}`, "PUT", {
    ...(nextName ? { name: nextName } : {}),
    role: $(`editNpcRole_${id}`).value,
    element: $(`editNpcElement_${id}`).value,
    location: $(`editNpcLocation_${id}`).value.trim(),
    description: $(`editNpcDescription_${id}`).value.trim(),
    rd: Number($(`editNpcRd_${id}`).value) || 0,
    attr_fisico: Number($(`editAttrFis_${id}`).value) || 4,
    attr_mente: Number($(`editAttrMen_${id}`).value) || 4,
    attr_emocao: Number($(`editAttrEmo_${id}`).value) || 4,
    skills_json: skillsObj
  });
  state.editingNpcId = null;
  await loadAllData();
}

async function deleteEntity(table, id) {
  await api(`/api/${table}/${id}`, "DELETE");
  await loadAllData();
}


// =========================================================================
// EXPORTAR & IMPORTAR CAMPANHA EM JSON (INTEGRAÇÃO COM IA / BACKUP)
// =========================================================================
function buildCampaignJsonObject(campaignId) {
  const camp = state.campaigns.find((c) => c.id === campaignId);
  if (!camp) return null;

  const campScenes = state.scenes
    .filter((s) => s.campaign_id === campaignId)
    .sort((a, b) => (a.position - b.position) || (a.id - b.id));

  const scenesPayload = campScenes.map((sc) => {
    const scSteps = state.scene_steps
      .filter((st) => st.scene_id === sc.id)
      .sort((a, b) => (a.position - b.position) || (a.id - b.id));

    const scPois = state.pois.filter((p) => p.scene_id === sc.id);
    const scTests = state.tests.filter((t) => t.scene_id === sc.id);
    const scItems = state.items.filter((i) => i.scene_id === sc.id);
    const scNpcs = state.npcs
      .filter((n) => n.scene_id === sc.id)
      .map((n) => ({
        ...n,
        skills_json: parseSkills(n.skills_json)
      }));

    return {
      ...sc,
      steps: scSteps,
      pois: scPois,
      tests: scTests,
      items: scItems,
      npcs: scNpcs
    };
  });

  const campLinks = state.scene_links.filter((l) => l.campaign_id === campaignId);
  const campAgents = state.agents
    .filter((a) => a.campaign_id === campaignId)
    .map((a) => ({
      ...a,
      data_json: parseAgentData(a.data_json)
    }));

  return {
    schema_version: "ordem_paranormal_2_escudo_v1",
    exported_at: new Date().toISOString(),
    campaign: {
      name: camp.name,
      season_mechanics: camp.season_mechanics || "",
      general_notes: camp.general_notes || "",
      scenes: scenesPayload,
      scene_links: campLinks,
      agents: campAgents
    }
  };
}

function exportCampaignJson() {
  if (!state.activeCampaignId) {
    alert("Selecione uma campanha ativa para exportar.");
    return;
  }
  const exportObj = buildCampaignJsonObject(state.activeCampaignId);
  if (!exportObj) return;

  const jsonText = JSON.stringify(exportObj, null, 2);
  const slug = exportObj.campaign.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "campanha";

  // Download .json file
  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Also show modal with copyable JSON so user can paste directly into an AI chat
  showCampaignJsonModal("export", jsonText);
}

function openImportCampaignModal() {
  showCampaignJsonModal("import", "");
}

function showCampaignJsonModal(mode, initialText) {
  const existing = $("campaignJsonModal");
  if (existing) existing.remove();

  const isExport = mode === "export";
  const modal = document.createElement("div");
  modal.id = "campaignJsonModal";
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0, 0, 0, 0.72);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--surface); border: 1.5px solid var(--border-accent);
      border-radius: 12px; width: 100%; max-width: 780px; max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    ">
      <div style="
        padding: 14px 18px; background: var(--surface-elevated);
        border-bottom: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center; gap: 10px;
      ">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="badge primary mono">JSON</span>
          <strong style="font-size: 16.5px;">
            ${isExport ? "Campanha Exportada (Arquivo baixado + Texto para IA)" : "Importar Campanha de JSON"}
          </strong>
        </div>
        <button class="icon-btn" onclick="$('campaignJsonModal').remove()">✕</button>
      </div>

      <div style="padding: 16px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
        <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.5;">
          ${isExport
            ? "O arquivo .json já foi baixado no seu computador. Você também pode copiar o JSON abaixo para colar na sua IA e pedir novas cenas, revisões ou continuidade."
            : "Selecione um arquivo .json do seu computador ou cole diretamente o JSON gerado pela IA na caixa abaixo para criar a campanha completa no sistema."}
        </p>

        ${!isExport ? `
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <input type="file" id="campaignJsonFileInput" accept=".json,application/json" style="width:auto; flex:1;" onchange="handleCampaignJsonFileSelect(event)" />
          </div>
        ` : ""}

        <textarea
          id="campaignJsonTextarea"
          rows="16"
          class="mono"
          style="font-size: 12.5px; line-height: 1.45; resize: vertical;"
          placeholder='Cole aqui o JSON da campanha (ex: { "campaign": { "name": "Minha Campanha", "scenes": [...] } })'
        >${esc(initialText)}</textarea>
      </div>

      <div style="
        padding: 12px 18px; background: var(--surface-elevated);
        border-top: 1px solid var(--border);
        display: flex; justify-content: flex-end; gap: 8px;
      ">
        ${isExport ? `
          <button class="primary" onclick="copyExportedCampaignJson()">Copiar JSON para IA</button>
          <button onclick="$('campaignJsonModal').remove()">Fechar</button>
        ` : `
          <button onclick="$('campaignJsonModal').remove()">Cancelar</button>
          <button class="primary" onclick="submitImportCampaignJson()">Importar Campanha</button>
        `}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function copyExportedCampaignJson() {
  const ta = $("campaignJsonTextarea");
  if (!ta) return;
  ta.select();
  navigator.clipboard.writeText(ta.value).then(() => {
    alert("JSON da campanha copiado para a área de transferência!");
  });
}

function handleCampaignJsonFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const ta = $("campaignJsonTextarea");
    if (ta) ta.value = e.target.result || "";
  };
  reader.readAsText(file, "utf-8");
}

async function submitImportCampaignJson() {
  const ta = $("campaignJsonTextarea");
  if (!ta || !ta.value.trim()) {
    alert("Cole um JSON válido ou selecione um arquivo .json antes de importar.");
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(ta.value.trim());
  } catch (err) {
    alert("Erro de sintaxe no JSON: " + err.message);
    return;
  }

  const res = await api("/api/campaigns/import", "POST", parsed);
  if (res && res.error) {
    alert("Erro ao importar: " + res.error);
    return;
  }

  const modal = $("campaignJsonModal");
  if (modal) modal.remove();

  if (res && res.id) {
    state.activeCampaignId = res.id;
    state.activeSceneId = null;
    state.activeStepId = null;
  }
  await loadAllData();
  alert("Campanha importada com sucesso!");
}

// =========================================================================
// LISTENERS INICIAIS
// =========================================================================
$("themeSelect").onchange = (e) => {
  document.body.className = e.target.value;
};

$("campaignFilterInput").oninput = (e) => {
  state.campaignFilter = e.target.value;
  renderAll();
};
$("campaignSortSelect").onchange = (e) => {
  state.campaignSort = e.target.value;
  renderAll();
};
$("campaignSelect").onchange = (e) => {
  state.activeCampaignId = Number(e.target.value) || null;
  const scenes = getFilteredCampaignScenes();
  state.activeSceneId = scenes.length ? scenes[0].id : null;
  state.activeStepId = null;
  state.selectedSheetFilter = "all";
  renderAll();
};

$("sceneFilterInput").oninput = (e) => {
  state.sceneFilter = e.target.value;
  renderSidebar();
};
$("sceneSortSelect").onchange = (e) => {
  state.sceneSort = e.target.value;
  renderSidebar();
};

$("newCampaignBtn").onclick = createCampaign;
$("renameCampaignBtn").onclick = renameCampaign;
$("deleteCampaignBtn").onclick = deleteCampaign;
$("newSceneBtn").onclick = createScene;
$("toggleDiceBtn").onclick = toggleDiceSidebar;

loadAllData();
