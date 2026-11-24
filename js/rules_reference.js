// =========================================================================
// ABA: COMPÊNDIO DE REGRAS DO SISTEMA (ORDEM PARANORMAL II — PLAYTEST BETA 1.2)
// =========================================================================
function normalizeRuleText(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getRuleSearchTokens(query) {
  const norm = normalizeRuleText(query).trim();
  if (!norm) return [];
  return norm.split(/\s+/).filter(Boolean);
}

function matchesRuleTokens(text, tokens) {
  if (!tokens || tokens.length === 0) return true;
  const hay = normalizeRuleText(text);
  return tokens.every((t) => hay.includes(t));
}

function highlightRuleText(rawText, tokens) {
  const str = String(rawText ?? "");
  if (!tokens || tokens.length === 0 || !str) return esc(str);

  const normChars = [];
  const origStarts = [];
  const origEnds = [];

  let idx = 0;
  for (const ch of str) {
    const chLen = ch.length;
    const stripped = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (let j = 0; j < stripped.length; j++) {
      normChars.push(stripped[j]);
      origStarts.push(idx);
      origEnds.push(idx + chLen);
    }
    idx += chLen;
  }

  const normStr = normChars.join("");
  const ranges = [];

  for (const tok of tokens) {
    if (!tok) continue;
    let pos = 0;
    while (pos <= normStr.length - tok.length) {
      const found = normStr.indexOf(tok, pos);
      if (found === -1) break;
      const s = origStarts[found];
      const e = origEnds[found + tok.length - 1];
      ranges.push([s, e]);
      pos = found + tok.length;
    }
  }

  if (ranges.length === 0) return esc(str);

  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  let out = "";
  let cursor = 0;
  for (const [s, e] of merged) {
    if (s > cursor) out += esc(str.slice(cursor, s));
    out += `<mark style="background: var(--primary-soft); color: var(--primary); border: 1px solid var(--border-accent); border-radius: 3px; padding: 0 3px; font-weight: 700;">${esc(str.slice(s, e))}</mark>`;
    cursor = e;
  }
  if (cursor < str.length) out += esc(str.slice(cursor));
  return out;
}

function getFilteredRuleEntries() {
  const tokens = getRuleSearchTokens(state.rulesSearchQuery);
  const expandedMap = state.rulesExpandedSections || {};

  return ORDEM_RULES_COMPENDIUM.map((sec) => {
    const matchCat = state.rulesCategoryFilter === "Todas" || sec.category === state.rulesCategoryFilter;
    if (!matchCat) return null;

    if (tokens.length === 0) {
      return {
        sec,
        blocks: sec.blocks,
        table: sec.table,
        hiddenCount: 0,
        isExpanded: false
      };
    }

    const headerText = `${sec.category} ${sec.title} ${sec.summary}`;
    const headerMatches = matchesRuleTokens(headerText, tokens);

    const totalItems =
      sec.blocks.reduce((acc, b) => acc + b.items.length, 0) +
      (sec.table ? sec.table.rows.length : 0);

    const filteredBlocks = [];
    for (const blk of sec.blocks) {
      const subMatches = matchesRuleTokens(`${sec.title} ${blk.subtitle}`, tokens);
      if (subMatches) {
        filteredBlocks.push(blk);
      } else {
        const matchedItems = blk.items.filter((it) =>
          matchesRuleTokens(`${sec.category} ${sec.title} ${blk.subtitle} ${it}`, tokens)
        );
        if (matchedItems.length > 0) {
          filteredBlocks.push({
            subtitle: blk.subtitle,
            items: matchedItems
          });
        }
      }
    }

    let filteredTable = null;
    if (sec.table) {
      const tableHeaderMatches = matchesRuleTokens(`${sec.title} ${sec.table.headers.join(" ")}`, tokens);
      if (tableHeaderMatches) {
        filteredTable = sec.table;
      } else {
        const matchedRows = sec.table.rows.filter((row) =>
          matchesRuleTokens(`${sec.category} ${sec.title} ${row.join(" ")}`, tokens)
        );
        if (matchedRows.length > 0) {
          filteredTable = {
            headers: sec.table.headers,
            rows: matchedRows
          };
        }
      }
    }

    const hasSpecificMatches = filteredBlocks.length > 0 || filteredTable !== null;
    if (!headerMatches && !hasSpecificMatches) {
      return null;
    }

    const isExpanded = Boolean(expandedMap[sec.id]);
    if (isExpanded || !hasSpecificMatches) {
      return {
        sec,
        blocks: sec.blocks,
        table: sec.table,
        hiddenCount: 0,
        isExpanded
      };
    }

    const shownItems =
      filteredBlocks.reduce((acc, b) => acc + b.items.length, 0) +
      (filteredTable ? filteredTable.rows.length : 0);
    const hiddenCount = Math.max(0, totalItems - shownItems);

    return {
      sec,
      blocks: filteredBlocks,
      table: filteredTable,
      hiddenCount,
      isExpanded: false
    };
  }).filter(Boolean);
}

function renderRulesCardsHtml() {
  const entries = getFilteredRuleEntries();
  const tokens = getRuleSearchTokens(state.rulesSearchQuery);

  if (entries.length === 0) {
    const isCatFiltered = state.rulesCategoryFilter !== "Todas";
    return `
      <div class="empty-state" style="min-height: 260px;">
        <h2>NENHUMA REGRA ENCONTRADA</h2>
        <p>
          Nenhum tópico corresponde ao termo <strong>"${esc(state.rulesSearchQuery)}"</strong>
          ${isCatFiltered ? `na categoria <strong>"${esc(state.rulesCategoryFilter)}"</strong>` : ""}.
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
          ${isCatFiltered ? `
            <button class="primary" onclick="setRulesCategory('Todas')">Buscar em Todas as Categorias</button>
          ` : ""}
          <button class="${isCatFiltered ? "" : "primary"}" onclick="clearRulesSearch()">Limpar Busca</button>
        </div>
      </div>
    `;
  }

  return entries.map((entry) => renderRuleSectionCard(entry, tokens)).join("");
}

function renderRulesReferenceWorkspace() {
  const main = $("mainWorkspace");
  const categories = ["Todas", ...new Set(ORDEM_RULES_COMPENDIUM.map((sec) => sec.category))];
  const entries = getFilteredRuleEntries();

  main.innerHTML = `
    <div class="scene-topbar" style="flex-shrink: 0;">
      <div class="scene-title-row" style="flex-wrap: wrap;">
        <span class="dossier-tag mono">SISTEMA</span>
        <strong style="font-size: 20px; font-weight: 800;">Regras de Ordem Paranormal II (Playtest Beta 1.2)</strong>
        <div style="margin-left: auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span id="rulesMatchCounter" class="badge mono">${entries.length} ${entries.length === 1 ? "tópico" : "tópicos"}</span>
          <input
            id="rulesSearchInput"
            style="width: 270px;"
            placeholder="Buscar regra, perícia, lesão, pavor..."
            value="${esc(state.rulesSearchQuery)}"
            oninput="updateRulesSearch(this.value)"
          />
          <button
            id="rulesClearSearchBtn"
            class="icon-btn"
            style="${state.rulesSearchQuery ? "" : "display:none;"}"
            onclick="clearRulesSearch()"
          >Limpar</button>
        </div>
      </div>

      <div class="step-tabs-bar" style="margin-top: 12px; margin-bottom: 0; padding-bottom: 0; border-bottom: none;">
        ${categories.map((cat) => `
          <button
            class="step-tab-btn ${state.rulesCategoryFilter === cat ? "active" : ""}"
            onclick="setRulesCategory('${esc(cat)}')"
          >
            <span class="step-tab-label">${esc(cat)}</span>
          </button>
        `).join("")}
      </div>
    </div>

    <div
      class="scene-scroll-body"
      id="rulesScrollBody"
      style="flex: 1 1 0%; min-height: 0; overflow-y: auto; display: block;"
    >
      ${renderRulesCardsHtml()}
    </div>
  `;
}

function setRulesCategory(cat) {
  state.rulesCategoryFilter = cat;
  renderRulesReferenceWorkspace();
}

function toggleRuleSectionExpand(secId) {
  if (!state.rulesExpandedSections) state.rulesExpandedSections = {};
  state.rulesExpandedSections[secId] = !state.rulesExpandedSections[secId];
  const scrollBody = $("rulesScrollBody");
  if (scrollBody) {
    scrollBody.innerHTML = renderRulesCardsHtml();
  } else {
    renderRulesReferenceWorkspace();
  }
}

function updateRulesSearch(val) {
  state.rulesSearchQuery = val;
  state.rulesExpandedSections = {};
  const scrollBody = $("rulesScrollBody");
  const clearBtn = $("rulesClearSearchBtn");
  const counterEl = $("rulesMatchCounter");

  if (clearBtn) {
    clearBtn.style.display = val ? "" : "none";
  }
  const entries = getFilteredRuleEntries();
  if (counterEl) {
    counterEl.textContent = `${entries.length} ${entries.length === 1 ? "tópico" : "tópicos"}`;
  }
  if (scrollBody) {
    scrollBody.innerHTML = renderRulesCardsHtml();
    scrollBody.scrollTop = 0;
  } else {
    renderRulesReferenceWorkspace();
  }
}

function clearRulesSearch() {
  state.rulesSearchQuery = "";
  state.rulesExpandedSections = {};
  const input = $("rulesSearchInput");
  if (input) input.value = "";
  updateRulesSearch("");
}

function renderRuleSectionCard(entry, tokens) {
  const { sec, blocks, table, hiddenCount, isExpanded } = entry;
  const hl = (txt) => highlightRuleText(txt, tokens);

  return `
    <div class="step-card" id="rule_${esc(sec.id)}" style="overflow: visible; margin-bottom: 20px;">
      <div class="step-card-header">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="badge primary mono">${hl(sec.category)}</span>
          <strong class="step-card-title">${hl(sec.title)}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 13px; color: var(--text-muted);">${hl(sec.summary)}</span>
          ${hiddenCount > 0 ? `
            <button class="icon-btn" style="font-size: 12px;" onclick="toggleRuleSectionExpand('${esc(sec.id)}')">
              Mostrar seção completa (+${hiddenCount})
            </button>
          ` : (isExpanded && tokens.length > 0 ? `
            <button class="icon-btn" style="font-size: 12px;" onclick="toggleRuleSectionExpand('${esc(sec.id)}')">
              Mostrar apenas correspondências
            </button>
          ` : "")}
        </div>
      </div>

      <div class="step-card-body">
        ${blocks.length > 0 ? `
          <div class="${blocks.length > 1 ? "grid-2" : ""}" style="gap: 14px;">
            ${blocks.map((blk) => `
              <div class="mechanic-book-box" style="margin-bottom: 0; background: var(--surface-alt); border-color: var(--border-accent); border-left-color: var(--primary);">
                <span class="mechanic-book-title" style="color: var(--primary);">${hl(blk.subtitle)}</span>
                <ul style="margin: 6px 0 0 18px; padding: 0; display: flex; flex-direction: column; gap: 6px; line-height: 1.55;">
                  ${blk.items.map((it) => `<li>${hl(it)}</li>`).join("")}
                </ul>
              </div>
            `).join("")}
          </div>
        ` : ""}

        ${table ? `
          <div style="${blocks.length > 0 ? "margin-top: 14px;" : ""} overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius);">
            <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left;">
              <thead>
                <tr style="background: var(--surface-alt); border-bottom: 1.5px solid var(--border);">
                  ${table.headers.map((h) => `<th style="padding: 9px 12px; font-weight: 800; color: var(--primary);">${hl(h)}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${table.rows.map((row, rIdx) => `
                  <tr style="border-bottom: 1px solid var(--border); background: ${rIdx % 2 === 0 ? "transparent" : "var(--surface-alt)"};">
                    ${row.map((cell, cIdx) => `
                      <td style="padding: 8px 12px; ${cIdx === 0 ? "font-weight: 700; white-space: nowrap;" : ""}">${hl(cell)}</td>
                    `).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}
