// =========================================================================
// NPCS & AMEAÇAS
// =========================================================================
function renderNewNpcFormHtml() {
  return `
    <div class="inline-drawer-form">
      <strong style="display:block; font-size:15px; margin-bottom:10px;">Novo NPC / Criatura Paranormal</strong>
      <div class="grid-3" style="margin-bottom:10px;">
        <div>
          <label>Nome</label>
          <input id="npcName" placeholder="Ex: Agentes de Terno Preto / Aberração" />
        </div>
        <div>
          <label>Papel</label>
          <select id="npcRole">
            <option value="Inimigo">Inimigo</option>
            <option value="Criatura">Criatura Paranormal</option>
            <option value="Neutro">Neutro</option>
            <option value="Aliado">Aliado</option>
          </select>
        </div>
        <div>
          <label>Elemento</label>
          <select id="npcElement">
            ${ELEMENTOS.map(el => `<option value="${el}">${el}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:10px;">
        <div>
          <label>Localização / Onde Encontrar</label>
          <input id="npcLocation" placeholder="Ex: Porão da mansão, Sala 04, Rondando o pátio..." />
        </div>
        <div>
          <label>Descrição / Aparência &amp; Comportamento</label>
          <input id="npcDescription" placeholder="Ex: Homem pálido de sobretudo, fala baixo e evita contato visual..." />
        </div>
      </div>

      <div class="grid-3" style="margin-bottom:10px;">
        <div>
          <label>PV Máximo</label>
          <input id="npcHp" type="number" value="20" />
        </div>
        <div>
          <label>PD Máximo</label>
          <input id="npcPd" type="number" value="10" />
        </div>
        <div>
          <label>Redução de Dano (RD)</label>
          <input id="npcRd" type="number" value="0" />
        </div>
      </div>

      <div class="grid-3" style="margin-bottom:10px;">
        <div>
          <label>Atributo: Físico</label>
          <select id="npcAttrFisico">
            ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === 4 ? "selected" : ""}>${d.label}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Atributo: Mente</label>
          <select id="npcAttrMente">
            ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === 4 ? "selected" : ""}>${d.label}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Atributo: Emoção</label>
          <select id="npcAttrEmocao">
            ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === 4 ? "selected" : ""}>${d.label}</option>`).join("")}
          </select>
        </div>
      </div>

      <label>Perícias do NPC (20 perícias de Ordem II)</label>
      <div class="skills-grid" style="margin-bottom:10px;">
        ${ORDEM_SKILLS_META.map(s => `
          <div class="skill-field">
            <label>${s.key} <span style="opacity:0.7;">(${s.attr.slice(0,3)})</span></label>
            <select id="newNpcSkill_${s.key}">
              ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === 4 ? "selected" : ""}>${d.label}</option>`).join("")}
            </select>
          </div>
        `).join("")}
      </div>

      <div style="margin-bottom:10px;">
        <label>Ações / Habilidades / Enigma de Medo</label>
        <textarea id="npcActions" rows="2" placeholder="Descreva ataques, habilidades e comportamentos..."></textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button onclick="state.showNewNpcForm = false; renderWorkspace();">Cancelar</button>
        <button class="primary" onclick="addNpc()">Salvar NPC</button>
      </div>
    </div>
  `;
}

function renderNpcCardHtml(n) {
  const skills = parseSkills(n.skills_json);
  const trainedSkills = ORDEM_SKILLS_META.filter(s => (skills[s.key] || 4) > 4);
  const isEditing = state.editingNpcId === n.id;

  const roleCls = n.role === "Aliado" ? "role-aliado" : n.role === "Neutro" ? "role-neutro" : "role-inimigo";
  const roleBadgeCls = n.role === "Inimigo" || n.role === "Criatura" ? "danger" : n.role === "Aliado" ? "success" : "warning";
  const hpPct = n.hp_max > 0 ? Math.max(0, Math.min(100, Math.round((n.hp_current / n.hp_max) * 100))) : 0;
  const pdPct = n.pd_max > 0 ? Math.max(0, Math.min(100, Math.round((n.pd_current / n.pd_max) * 100))) : 0;

  return `
    <div class="npc-dossier-card ${roleCls}">
      <div class="npc-dossier-header">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <strong class="npc-dossier-name">${esc(n.name)}</strong>
          <span class="badge ${roleBadgeCls}">${esc(n.role)}</span>
          ${n.element && n.element !== "Nenhum" ? `<span class="badge violet">${esc(n.element)}</span>` : ""}
          <span class="badge mono">RD ${n.rd}</span>
          ${n.location ? `<span class="badge info">Local: ${esc(n.location)}</span>` : ""}
        </div>
        <div style="display:flex; gap:6px;">
          <button class="icon-btn" onclick="toggleEditNpc(${n.id})">${isEditing ? "Fechar Edição" : "Editar Ficha"}</button>
          <button class="icon-btn danger" onclick="deleteEntity('npcs', ${n.id})">✕</button>
        </div>
      </div>

      <div class="npc-dossier-body">
        ${n.description ? `
          <div class="poi-description" style="margin-bottom:10px; padding:8px 11px; background:var(--surface-alt); border-left:3px solid var(--border-accent); border-radius:6px;">
            <strong>Descrição:</strong> ${esc(n.description)}
          </div>
        ` : ""}

        <div class="npc-vitals-grid">
          <div class="npc-vital-meter">
            <div class="npc-vital-top">
              <span class="stat-label mono" style="color:var(--danger);">PV: ${n.hp_current} / ${n.hp_max}</span>
              <div style="display:flex; align-items:center; gap:5px;">
                <input id="hpDelta_${n.id}" class="stat-delta-input" type="number" min="1" value="1" />
                <button class="icon-btn danger" onclick="applyNpcDelta(${n.id}, 'hp_current', -1, ${n.hp_max})">-</button>
                <button class="icon-btn" onclick="applyNpcDelta(${n.id}, 'hp_current', 1, ${n.hp_max})">+</button>
              </div>
            </div>
            <div class="npc-vital-bar-track">
              <div class="npc-vital-bar-fill hp" style="width:${hpPct}%;"></div>
            </div>
          </div>

          <div class="npc-vital-meter">
            <div class="npc-vital-top">
              <span class="stat-label mono" style="color:var(--info);">PD: ${n.pd_current} / ${n.pd_max}</span>
              <div style="display:flex; align-items:center; gap:5px;">
                <input id="pdDelta_${n.id}" class="stat-delta-input" type="number" min="1" value="1" />
                <button class="icon-btn danger" onclick="applyNpcDelta(${n.id}, 'pd_current', -1, ${n.pd_max})">-</button>
                <button class="icon-btn" onclick="applyNpcDelta(${n.id}, 'pd_current', 1, ${n.pd_max})">+</button>
              </div>
            </div>
            <div class="npc-vital-bar-track">
              <div class="npc-vital-bar-fill pd" style="width:${pdPct}%;"></div>
            </div>
          </div>
        </div>

        <div style="font-size:14px; display:flex; flex-wrap:wrap; gap:7px; align-items:center;">
          <span class="badge mono">FÍS d${n.attr_fisico || 4}</span>
          <span class="badge mono">MEN d${n.attr_mente || 4}</span>
          <span class="badge mono">EMO d${n.attr_emocao || 4}</span>
          <span style="color:var(--text-muted); margin-left:4px;">| Perícias (&gt;d4):</span>
          ${trainedSkills.length ? trainedSkills.map(s => {
            const attrVal = s.attr === "Físico" ? (n.attr_fisico || 4) : s.attr === "Mente" ? (n.attr_mente || 4) : (n.attr_emocao || 4);
            const skillVal = skills[s.key];
            return `<span class="badge primary mono skill-badge-btn" title="Clique para rolar ${esc(n.name)}: ${s.key}" onclick="rollNpcSkillById(${n.id}, '${s.key}', ${attrVal}, ${skillVal})">${s.key} d${skillVal}</span>`;
          }).join("") : `<span style="font-size:13.5px; color:var(--text-muted);">Todas em d4</span>`}
        </div>

        ${isEditing ? `
          <div class="inline-drawer-form" style="margin-top:12px;">
            <div class="grid-3" style="margin-bottom:10px;">
              <div>
                <label>Nome</label>
                <input id="editNpcName_${n.id}" value="${esc(n.name)}" />
              </div>
              <div>
                <label>Papel</label>
                <select id="editNpcRole_${n.id}">
                  <option value="Inimigo" ${n.role === "Inimigo" ? "selected" : ""}>Inimigo</option>
                  <option value="Criatura" ${n.role === "Criatura" ? "selected" : ""}>Criatura Paranormal</option>
                  <option value="Neutro" ${n.role === "Neutro" ? "selected" : ""}>Neutro</option>
                  <option value="Aliado" ${n.role === "Aliado" ? "selected" : ""}>Aliado</option>
                </select>
              </div>
              <div>
                <label>Elemento</label>
                <select id="editNpcElement_${n.id}">
                  ${ELEMENTOS.map(el => `<option value="${el}" ${el === (n.element || "Nenhum") ? "selected" : ""}>${el}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="grid-2" style="margin-bottom:10px;">
              <div>
                <label>Localização / Onde Encontrar</label>
                <input id="editNpcLocation_${n.id}" value="${esc(n.location || "")}" placeholder="Ex: Porão, Sala 04..." />
              </div>
              <div>
                <label>Redução de Dano (RD)</label>
                <input id="editNpcRd_${n.id}" type="number" value="${n.rd || 0}" />
              </div>
            </div>

            <div style="margin-bottom:10px;">
              <label>Descrição / Aparência &amp; Comportamento</label>
              <textarea id="editNpcDescription_${n.id}" rows="2" placeholder="Aparência, trejeitos, motivação...">${esc(n.description || "")}</textarea>
            </div>

            <div class="grid-3" style="margin-bottom:10px;">
              <div>
                <label>Físico</label>
                <select id="editAttrFis_${n.id}">
                  ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === (n.attr_fisico || 4) ? "selected" : ""}>${d.label}</option>`).join("")}
                </select>
              </div>
              <div>
                <label>Mente</label>
                <select id="editAttrMen_${n.id}">
                  ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === (n.attr_mente || 4) ? "selected" : ""}>${d.label}</option>`).join("")}
                </select>
              </div>
              <div>
                <label>Emoção</label>
                <select id="editAttrEmo_${n.id}">
                  ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === (n.attr_emocao || 4) ? "selected" : ""}>${d.label}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="skills-grid" style="margin-bottom:10px;">
              ${ORDEM_SKILLS_META.map(s => `
                <div class="skill-field">
                  <label>${s.key} (${s.attr.slice(0,3)})</label>
                  <select id="editNpcSkill_${n.id}_${s.key}">
                    ${DIE_LEVELS.map(d => `<option value="${d.value}" ${d.value === (skills[s.key] || 4) ? "selected" : ""}>${d.label}</option>`).join("")}
                  </select>
                </div>
              `).join("")}
            </div>

            <div style="margin-bottom:10px;">
              <label>Ações &amp; Habilidades</label>
              <textarea id="editNpcActions_${n.id}" rows="2">${esc(n.actions || "")}</textarea>
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button class="primary" onclick="saveNpcSkills(${n.id})">Salvar Alterações do NPC</button>
            </div>
          </div>
        ` : ""}

        ${n.actions ? `<div class="npc-actions-box"><strong>Ações &amp; Habilidades:</strong>
${esc(n.actions)}</div>` : ""}
      </div>
    </div>
  `;
}
