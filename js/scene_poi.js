// =========================================================================
// NÍVEL 3: PONTO DE INTERESSE (LOCAL / OBJETO -> TESTES & ITENS)
// =========================================================================
function renderPoiBlock(p) {
  const poiTests = state.tests.filter((t) => t.poi_id === p.id);
  const poiItems = state.items.filter((i) => i.poi_id === p.id);
  const isEditingPoi = state.editingPoiId === p.id;
  const isAddingTest = state.openAddTestPoiId === p.id;
  const isAddingItem = state.openAddItemPoiId === p.id;
  const poiType = p.poi_type || "Objeto";
  const isLocal = poiType === "Local";

  return `
    <div class="poi-card ${isLocal ? "poi-local" : "poi-objeto"} ${p.discovered ? "discovered" : ""}">
      ${isEditingPoi ? `<div class="poi-card-body">${renderPoiFormHtml(p.step_id, p)}</div>` : `
        <div class="poi-card-header">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="badge ${isLocal ? "info" : "warning"} mono">
              ${isLocal ? "LOCAL" : "OBJETO"}
            </span>
            <strong class="poi-card-title">${esc(p.title)}</strong>
            ${p.discovered ? `<span class="badge success">✓ Inspecionado</span>` : ""}
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="icon-btn" onclick="togglePoi(${p.id}, ${p.discovered ? 0 : 1})">
              ${p.discovered ? "Desmarcar" : "Marcar Inspecionado"}
            </button>
            <button class="icon-btn" onclick="toggleEditPoi(${p.id})">Editar</button>
            <button class="icon-btn danger" title="Excluir Ponto de Interesse" onclick="deleteEntity('pois', ${p.id})">✕</button>
          </div>
        </div>

        <div class="poi-card-body">
          ${p.info ? `<p class="poi-description">${esc(p.info)}</p>` : ""}

          <div class="poi-children-stack">
            <div class="poi-zone-block">
              <div class="poi-child-header">
                <span class="poi-child-title">Testes de Ação neste ${esc(poiType)} (${poiTests.length})</span>
                <button class="icon-btn primary" onclick="toggleAddTestInPoi(${p.id})">
                  ${isAddingTest ? "Cancelar" : "+ Adicionar Teste"}
                </button>
              </div>

              ${isAddingTest ? renderPoiTestFormHtml(p.id, p.step_id, null) : ""}

              ${poiTests.length === 0 && !isAddingTest ? `
                <div style="font-size:13.5px; color:var(--text-muted);">Nenhum teste cadastrado neste ${esc(poiType.toLowerCase())}.</div>
              ` : ""}

              ${poiTests.map(t => renderPoiTestCard(t)).join("")}
            </div>

            <div class="poi-zone-block">
              <div class="poi-child-header">
                <span class="poi-child-title">Itens, Pistas & Documentos neste ${esc(poiType)} (${poiItems.length})</span>
                <button class="icon-btn" onclick="toggleAddItemInPoi(${p.id})">
                  ${isAddingItem ? "Cancelar" : "+ Adicionar Item"}
                </button>
              </div>

              ${isAddingItem ? renderPoiItemFormHtml(p.id, null) : ""}

              ${poiItems.length === 0 && !isAddingItem ? `
                <div style="font-size:13.5px; color:var(--text-muted);">Nenhum item ou pista cadastrado neste ${esc(poiType.toLowerCase())}.</div>
              ` : ""}

              ${poiItems.map(i => renderPoiItemCard(i)).join("")}
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

function renderPoiTestFormHtml(poiId, stepId, existingTest) {
  const formKey = existingTest ? `edit_${existingTest.id}` : `new_${poiId}`;
  const defaultMech = existingTest
    ? (ORDEM_MECHANICS.find(m => m.key === existingTest.mechanic_key) || ORDEM_MECHANICS[0])
    : ORDEM_MECHANICS[0];

  const mechKey = existingTest ? existingTest.mechanic_key : defaultMech.key;
  const mechName = existingTest ? existingTest.mechanic_name : defaultMech.name;
  const mechRules = existingTest ? existingTest.mechanic_rules : defaultMech.rules;
  const situation = existingTest ? existingTest.situation : "";
  const actionDesc = existingTest ? existingTest.action_description : "";
  const attr = existingTest ? existingTest.attribute : defaultMech.defaultAttr;
  const skill = existingTest ? existingTest.skill : defaultMech.defaultSkill;
  const dt = existingTest ? existingTest.dt : defaultMech.defaultDt;
  const succ = existingTest ? existingTest.success_outcome : "";
  const fail = existingTest ? existingTest.failure_outcome : "";

  return `
    <div class="inline-drawer-form">
      <strong style="display:block; font-size:14.5px; margin-bottom:10px;">
        ${existingTest ? "Editar Teste" : "Novo Teste no Ponto de Interesse"}
      </strong>

      <div class="grid-2" style="margin-bottom:10px;">
        <div>
          <label>Nome do Teste / Alvo</label>
          <input id="testSit_${formKey}" value="${esc(situation)}" placeholder="Ex: Procurar o problema no motor / Rádio defeituoso" />
        </div>
        <div>
          <label>Mecânica do Livro</label>
          <select id="testMechKey_${formKey}" onchange="onInlineMechanicChange('${formKey}', this.value)">
            ${ORDEM_MECHANICS.map(m => `<option value="${m.key}" ${m.key === mechKey ? "selected" : ""}>${esc(m.name)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <label>Descrição da Ação Relacionada ao Teste</label>
        <textarea id="testActionDesc_${formKey}" rows="2" placeholder="Descreva a ação relacionada ao teste...">${esc(actionDesc)}</textarea>
      </div>

      <div class="grid-3" style="margin-bottom:10px;">
        <div>
          <label>Atributo Base</label>
          <select id="testAttr_${formKey}">
            ${ORDEM_ATTRIBUTES.map(a => `<option value="${a}" ${a === attr ? "selected" : ""}>${a}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Perícia Principal</label>
          <select id="testSkill_${formKey}">
            ${ORDEM_SKILLS_META.map(s => `<option value="${s.key}" ${s.key === skill ? "selected" : ""}>${s.key} (${s.attr})</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Dificuldade (DT)</label>
          <select id="testDt_${formKey}">
            ${ORDEM_DTS.map(d => `<option value="${d.value}" ${d.value === Number(dt) ? "selected" : ""}>${esc(d.label)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:10px;">
        <div>
          <label>Nome Exibido da Mecânica</label>
          <input id="testMechName_${formKey}" value="${esc(mechName)}" />
        </div>
        <div>
          <label>Resumo da Regra (Opcional)</label>
          <input id="testMechRules_${formKey}" value="${esc(mechRules)}" />
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:10px;">
        <div>
          <label>Resultado de Sucesso</label>
          <input id="testSucc_${formKey}" value="${esc(succ)}" placeholder="O que acontece se passar..." />
        </div>
        <div>
          <label>Resultado de Falha</label>
          <input id="testFail_${formKey}" value="${esc(fail)}" placeholder="O que acontece se falhar..." />
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button onclick="cancelAllInlineForms()">Cancelar</button>
        ${existingTest
          ? `<button class="primary" onclick="saveTest(${existingTest.id})">Salvar Alterações</button>`
          : `<button class="primary" onclick="addTestToPoi(${poiId}, ${stepId === null ? "null" : stepId})">Salvar Teste</button>`}
      </div>
    </div>
  `;
}

function isTermoMechanic(t) {
  if (t.mechanic_key === "destrancar") return true;
  const combined = `${t.mechanic_name} ${t.situation}`.toLowerCase();
  return combined.includes("termo") || combined.includes("destrancar") || combined.includes("sintonizar");
}

function renderPoiTestCard(t) {
  if (state.editingTestId === t.id) {
    return renderPoiTestFormHtml(t.poi_id, t.step_id, t);
  }

  const inlineRoll = state.testLastRolls[t.id];
  const showTermo = isTermoMechanic(t);
  const isSpecialMechanic = t.mechanic_key && t.mechanic_key !== "padrao";

  return `
    <div class="test-card">
      <div class="test-card-header">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="badge violet mono">TESTE</span>
          <strong class="test-card-title">${esc(t.situation)}</strong>
          <span class="badge primary">${esc(t.attribute)} + ${esc(t.skill)}</span>
          ${isSpecialMechanic ? `<span class="badge warning">${esc(t.mechanic_name)}</span>` : ""}
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="dt-shield mono">DT ${t.dt}</span>
          <button class="icon-btn" onclick="toggleEditTest(${t.id})">Editar</button>
          <button class="icon-btn danger" title="Excluir Teste" onclick="deleteEntity('tests', ${t.id})">✕</button>
        </div>
      </div>

      <div class="test-card-body">
        ${t.action_description ? `<div class="test-action-desc">${esc(t.action_description)}</div>` : ""}

        ${isSpecialMechanic && t.mechanic_rules ? `
          <div class="mechanic-book-box">
            <span class="mechanic-book-title">Regra: ${esc(t.mechanic_name)}</span>
            <div style="white-space:pre-wrap; line-height:1.5;">${esc(t.mechanic_rules)}</div>
          </div>
        ` : ""}

        ${(t.success_outcome || t.failure_outcome) ? `
          <div class="test-outcomes-grid">
            <div class="outcome-box success">
              <span class="outcome-label">✓ Sucesso</span>
              <div>${t.success_outcome ? esc(t.success_outcome) : "<span style='opacity:0.65;'>Sem descrição</span>"}</div>
            </div>
            <div class="outcome-box failure">
              <span class="outcome-label">✕ Falha</span>
              <div>${t.failure_outcome ? esc(t.failure_outcome) : "<span style='opacity:0.65;'>Sem descrição</span>"}</div>
            </div>
          </div>
        ` : ""}

        ${showTermo ? renderTermoWidget(t.id) : ""}
      </div>

      <div class="test-roll-strip">
        <span style="font-size:12.5px; font-weight:800; text-transform:uppercase; color:var(--text-muted);">Rolagem Rápida:</span>
        <select id="rollTestAttr_${t.id}" title="Dado de ${esc(t.attribute)}">
          ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === 4 ? "selected" : ""}>Atrib d${d.value}</option>`).join("")}
        </select>
        <select id="rollTestSkill_${t.id}" title="Dado de ${esc(t.skill)}">
          ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === 4 ? "selected" : ""}>Perícia d${d.value}</option>`).join("")}
        </select>
        <button class="primary icon-btn" onclick="rollEmbeddedTest(${t.id})">Rolar (DT ${t.dt})</button>

        ${inlineRoll ? `
          <span class="badge ${inlineRoll.dtStatus.startsWith("PASSOU") ? "success" : "danger"} mono">
            ${inlineRoll.total} [${inlineRoll.rolls.map(r => r.val).join(" + ")}] • ${inlineRoll.dtStatus}
          </span>
        ` : ""}
      </div>
    </div>
  `;
}

// =========================================================================
// SIMULADOR INTERATIVO: TERMO DE DADOS (DESTRANCAR / SINTONIZAR)
// =========================================================================
function getTermoGame(testId) {
  if (!state.termoGames[testId]) {
    state.termoGames[testId] = {
      count: 3,
      secret: [rollDie(6), rollDie(6), rollDie(6)],
      revealed: false,
      skillDie: 4,
      attempts: []
    };
  }
  return state.termoGames[testId];
}

function renderTermoWidget(testId) {
  const game = getTermoGame(testId);
  const maxAttemptsPerRound = Math.max(1, Math.floor(game.skillDie / 2) - 1);
  const solved = game.attempts.length > 0 && game.attempts[0].every((x) => x.status === "exact");

  return `
    <div class="termo-box">
      <div class="termo-header">
        <span style="font-size:13px; font-weight:800; color:var(--primary); text-transform:uppercase; letter-spacing:0.04em;">
          Painel do Mestre — Termo de Dados (${game.count}d6)
        </span>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <select style="width:auto; padding:4px 8px; font-size:13px;" onchange="resetTermoSecret(${testId}, Number(this.value))" title="Quantidade de d6 da senha">
            ${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${n === game.count ? "selected" : ""}>${n}d6</option>`).join("")}
          </select>
          <select style="width:auto; padding:4px 8px; font-size:13px;" onchange="setTermoSkillDie(${testId}, Number(this.value))" title="Nível da Perícia do Jogador">
            ${[4, 6, 8, 10, 12].map(d => `<option value="${d}" ${d === game.skillDie ? "selected" : ""}>Perícia d${d} (${Math.floor(d/2)-1} tent./rodada)</option>`).join("")}
          </select>
          <button class="icon-btn" onclick="resetTermoSecret(${testId}, ${game.count})">↻ Nova Sequência</button>
        </div>
      </div>

      <div class="termo-secret-strip">
        <span style="font-size:12.5px; color:var(--text-muted); font-weight:700;">SINAL SECRETO:</span>
        ${game.secret.map(v => `<span class="termo-die-slot mono">${game.revealed ? v : "?"}</span>`).join("")}
        <button class="icon-btn" onclick="toggleTermoReveal(${testId})">
          ${game.revealed ? "Ocultar" : "Ver Sinal"}
        </button>
        <span class="badge mono" style="margin-left:auto;">
          Tentativas: ${game.attempts.length} (Limite/rodada: ${maxAttemptsPerRound})
        </span>
      </div>

      <div class="termo-guess-row">
        <span style="font-size:13px; font-weight:700;">Palpite do Jogador:</span>
        ${game.secret.map((_, idx) => `
          <input id="termoInput_${testId}_${idx}" class="termo-guess-input mono" type="number" min="1" max="6" value="1" />
        `).join("")}
        <button class="primary icon-btn" onclick="submitTermoGuess(${testId})">Verificar Dados</button>
        ${solved ? `<span class="badge success">SINCRONIZADO / DESTRANCADO!</span>` : ""}
      </div>

      ${game.attempts.map((att, aIdx) => `
        <div class="termo-attempt-line mono">
          <span style="color:var(--text-muted); min-width:38px;">#${game.attempts.length - aIdx}:</span>
          ${att.map(item => {
            const arrow = item.status === "exact" ? "✓ EXATO" : item.status === "high" ? "↓ ALTO" : "↑ BAIXO";
            return `<span class="termo-pill ${item.status}">[${item.guess}] ${arrow}</span>`;
          }).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function resetTermoSecret(testId, count) {
  const prev = getTermoGame(testId);
  const secret = [];
  for (let i = 0; i < count; i++) secret.push(rollDie(6));
  state.termoGames[testId] = {
    count,
    secret,
    revealed: false,
    skillDie: prev.skillDie,
    attempts: []
  };
  renderWorkspace();
}

function setTermoSkillDie(testId, skillDie) {
  const game = getTermoGame(testId);
  game.skillDie = skillDie;
  renderWorkspace();
}

function toggleTermoReveal(testId) {
  const game = getTermoGame(testId);
  game.revealed = !game.revealed;
  renderWorkspace();
}

function submitTermoGuess(testId) {
  const game = getTermoGame(testId);
  const evaluation = game.secret.map((secretVal, idx) => {
    const raw = Number($(`termoInput_${testId}_${idx}`).value) || 1;
    const guess = Math.max(1, Math.min(6, raw));
    let status = "exact";
    if (guess > secretVal) status = "high";
    else if (guess < secretVal) status = "low";
    return { guess, status };
  });
  game.attempts.unshift(evaluation);
  if (evaluation.every((x) => x.status === "exact")) {
    game.revealed = true;
  }
  renderWorkspace();
}

// =========================================================================
// ITENS DENTRO DO PONTO DE INTERESSE
// =========================================================================
function renderPoiItemFormHtml(poiId, existingItem) {
  const formKey = existingItem ? `edit_${existingItem.id}` : `new_${poiId}`;
  const iName = existingItem ? existingItem.name : "";
  const iCat = existingItem ? existingItem.category : "Pista / Documento";
  const iDesc = existingItem ? existingItem.description : "";

  return `
    <div class="inline-drawer-form">
      <div class="grid-2" style="margin-bottom:9px;">
        <div>
          <label>Nome do Item / Pista</label>
          <input id="poiItemName_${formKey}" value="${esc(iName)}" placeholder="Ex: Áudio Interceptado no Rádio" />
        </div>
        <div>
          <label>Categoria</label>
          <select id="poiItemCat_${formKey}">
            <option value="Pista / Documento" ${iCat === "Pista / Documento" ? "selected" : ""}>Pista / Documento</option>
            <option value="Ferramenta / Equipamento" ${iCat === "Ferramenta / Equipamento" ? "selected" : ""}>Ferramenta / Equipamento</option>
            <option value="Consumível" ${iCat === "Consumível" ? "selected" : ""}>Consumível</option>
            <option value="Item Amaldiçoado" ${iCat === "Item Amaldiçoado" ? "selected" : ""}>Item Amaldiçoado</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom:9px;">
        <label>Descrição / Efeito</label>
        <textarea id="poiItemDesc_${formKey}" rows="2" placeholder="Conteúdo da pista ou efeito mecânico...">${esc(iDesc)}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button onclick="cancelAllInlineForms()">Cancelar</button>
        ${existingItem
          ? `<button class="primary" onclick="saveItem(${existingItem.id})">Salvar Alterações</button>`
          : `<button class="primary" onclick="addItemToPoi(${poiId})">Salvar Item</button>`}
      </div>
    </div>
  `;
}

function getItemVisualMeta(category) {
  if (category === "Ferramenta / Equipamento") {
    return { tag: "EQP", cls: "cat-equip", badgeCls: "info" };
  }
  if (category === "Consumível") {
    return { tag: "CON", cls: "cat-consumivel", badgeCls: "success" };
  }
  if (category === "Item Amaldiçoado") {
    return { tag: "AML", cls: "cat-amaldicoado", badgeCls: "violet" };
  }
  return { tag: "PST", cls: "cat-pista", badgeCls: "warning" };
}

function renderPoiItemCard(i) {
  if (state.editingItemId === i.id) {
    return renderPoiItemFormHtml(i.poi_id, i);
  }

  const meta = getItemVisualMeta(i.category);

  return `
    <div class="item-ticket-card ${meta.cls} ${i.collected ? "collected" : ""}">
      <div class="item-ticket-main">
        <div class="item-icon-badge mono" title="${esc(i.category)}">${meta.tag}</div>
        <div style="min-width:0; flex:1;">
          <div style="display:flex; align-items:center; gap:7px; flex-wrap:wrap;">
            <strong class="item-ticket-title">${esc(i.name)}</strong>
            <span class="badge ${meta.badgeCls}">${esc(i.category)}</span>
            ${i.collected ? `<span class="badge success">✓ Coletado</span>` : ""}
          </div>
          ${i.description ? `<p class="item-ticket-desc">${esc(i.description)}</p>` : ""}
        </div>
      </div>

      <div style="display:flex; gap:5px; flex-shrink:0;">
        <button class="icon-btn ${i.collected ? "" : "primary"}" onclick="toggleItem(${i.id}, ${i.collected ? 0 : 1})">
          ${i.collected ? "Devolver" : "Coletar"}
        </button>
        <button class="icon-btn" onclick="toggleEditItem(${i.id})">Editar</button>
        <button class="icon-btn danger" onclick="deleteEntity('items', ${i.id})">✕</button>
      </div>
    </div>
  `;
}
