// ============================================================
// SECTION: RENDERER — DOM 渲染组件
// ============================================================

// --- Hexagram Line Drawing ---

/**
 * Render 6 hexagram lines as HTML.
 * lines: array of 6 values (6/7/8/9), index 0 = bottom.
 * changingIndices: array of indices that are changing lines.
 */
function renderHexagramLines(lines, changingIndices) {
  let html = '<div class="hexagram-container">';
  // Render top to bottom (上爻 first visually)
  for (let i = 5; i >= 0; i--) {
    const value = lines[i];
    const isYang = isYangLine(value);
    const isChanging = changingIndices.includes(i);
    const lineName = getLineName(i, value);

    let lineClass = "hex-line";
    if (isYang) {
      lineClass += " hex-line-yang";
    } else {
      lineClass += " hex-line-yin";
    }
    if (isChanging) {
      lineClass += " hex-line-changing";
    }

    html += '<div class="hex-line-row">';
    html += `<span class="hex-line-label">${lineName}</span>`;
    html += `<div class="${lineClass}">`;
    if (!isYang) {
      // Yin line: two segments with gap
      html += '<span class="yin-segment"></span>';
      html += '<span class="yin-segment"></span>';
    }
    html += '</div>';
    if (isChanging) {
      html += '<span class="changing-dot">●</span>';
    }
    html += '</div>';
  }
  // Label below: 初 (bottom) at bottom, 上 (top) at top
  html += '</div>';
  return html;
}

/**
 * Render a small hexagram icon for cards/lists.
 */
function renderHexagramIcon(kingWen) {
  const code = 0x4DC0 + kingWen - 1;
  return String.fromCodePoint(code);
}

/**
 * Render a small hexagram with CSS lines (compact version for cards).
 */
function renderCompactHexagram(lines, changingIndices) {
  let html = '<div class="hex-compact">';
  for (let i = 5; i >= 0; i--) {
    const isYang = isYangLine(lines[i]);
    const isChanging = changingIndices.includes(i);
    let cls = "hc-line";
    cls += isYang ? " hc-yang" : " hc-yin";
    if (isChanging) cls += " hc-changing";
    html += `<div class="${cls}"></div>`;
  }
  html += '</div>';
  return html;
}

// --- Card Rendering ---

/**
 * Render a hexagram card for the browse grid.
 */
function renderHexagramCard(hex) {
  const symbol = renderHexagramIcon(hex.kingWen);
  return `
    <div class="hex-card" data-kingwen="${hex.kingWen}" onclick="showHexagramDetail(${hex.kingWen})">
      <div class="hex-card-number">${hex.kingWen}</div>
      <div class="hex-card-symbol">${symbol}</div>
      <div class="hex-card-name">${hex.nameZh}</div>
      <div class="hex-card-pinyin">${hex.namePinyin}</div>
    </div>
  `;
}

// --- Result Rendering ---

/**
 * Render the full result view.
 */
function renderResultView(result) {
  const p = result.primaryHex;
  const lines = result.lines;
  const changingIndices = result.changingLines;

  if (!p) {
    return '<div class="error">未能找到对应卦象，请重试。</div>';
  }

  let html = "";

  // Question
  if (result.question) {
    html += `<div class="result-question">问：${escapeHtml(result.question)}</div>`;
  }

  // Hexagram visual
  html += '<div class="result-hex-visual">';
  html += renderHexagramLines(lines, changingIndices);
  html += '</div>';

  // Primary hexagram info
  html += '<div class="result-primary">';
  html += `<div class="result-hex-title">本卦：${p.nameZh} (${p.namePinyin})</div>`;
  html += `<div class="result-hex-symbol">${renderHexagramIcon(p.kingWen)}</div>`;
  html += `<div class="result-trigrams">${p.upperTrigram.symbol}${p.upperTrigram.name}上 · ${p.lowerTrigram.symbol}${p.lowerTrigram.name}下</div>`;
  html += '</div>';

  // Judgment
  html += '<div class="result-section">';
  html += '<div class="section-title">卦辞</div>';
  html += `<div class="classical-text">${p.judgment}</div>`;
  html += `<div class="modern-text">${p.judgmentModern}</div>`;
  html += '</div>';

  // Interpretation
  html += '<div class="result-section">';
  html += '<div class="section-title">解读</div>';
  html += `<div class="interpretation-text">${p.interpretation}</div>`;
  html += '</div>';

  // Changing lines
  if (changingIndices.length > 0) {
    html += '<div class="result-section changing-section">';
    html += `<div class="section-title">变爻 (${changingIndices.length}个)</div>`;

    for (const idx of changingIndices) {
      const ln = p.lines[idx];
      const lineName = getLineName(idx, lines[idx]);
      html += '<div class="line-detail">';
      html += `<div class="line-name">${lineName} <span class="changing-tag">变爻</span></div>`;
      html += `<div class="classical-text">${ln.text}</div>`;
      html += `<div class="modern-text">${ln.textModern}</div>`;
      html += '</div>';
    }
    html += '</div>';

    // Transformed hexagram
    if (result.transformedHex) {
      const t = result.transformedHex;
      html += '<div class="result-section transformed-section">';
      html += '<div class="section-title">变卦（之卦）</div>';
      html += `<div class="result-hex-title">${t.nameZh} (${t.namePinyin}) ${renderHexagramIcon(t.kingWen)}</div>`;
      html += `<div class="classical-text">${t.judgment}</div>`;
      html += `<div class="modern-text">${t.judgmentModern}</div>`;
      html += '</div>';
    }
  } else {
    html += '<div class="result-section">';
    html += '<div class="section-title">变爻</div>';
    html += '<div class="modern-text">本卦无变爻，以本卦卦辞为主参考。</div>';
    html += '</div>';
  }

  return html;
}

// --- History Rendering ---

function renderHistoryList(history) {
  if (history.length === 0) {
    return '<div class="empty-state"><div class="empty-icon">📜</div><div>暂无记录</div><div class="empty-hint">去起一卦吧</div></div>';
  }

  let html = "";
  for (const entry of history) {
    const pSymbol = renderHexagramIcon(entry.primaryKingWen);
    const hasChange = entry.transformedKingWen !== null;
    const tSymbol = hasChange ? renderHexagramIcon(entry.transformedKingWen) : "";

    html += '<div class="history-card" data-id="' + entry.id + '">';
    html += `<div class="history-date">${entry.dateStr}</div>`;
    html += `<div class="history-question">${escapeHtml(entry.question) || "(无问题)"}</div>`;
    html += '<div class="history-hex-row">';
    html += `<span>${pSymbol} ${entry.primaryName}</span>`;
    if (hasChange) {
      html += `<span class="history-arrow">→</span>`;
      html += `<span>${tSymbol} ${entry.transformedName}</span>`;
      html += `<span class="history-change-count">${entry.changingLineCount}变爻</span>`;
    } else {
      html += '<span class="history-no-change">无变爻</span>';
    }
    html += '</div>';
    html += '<div class="history-actions">';
    html += `<button class="btn-small" onclick="viewHistoryEntry('${entry.id}')">查看</button>`;
    html += `<button class="btn-small btn-danger" onclick="deleteHistoryEntry('${entry.id}')">删除</button>`;
    html += '</div>';
    html += '</div>';
  }
  return html;
}

// --- Utility ---

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showHexagramDetail(kingWen) {
  const hex = HEXAGRAM_DATA[kingWen];
  if (!hex) return;

  let detailHtml = '<div class="detail-modal-content">';
  detailHtml += `<button class="detail-close" onclick="closeDetailModal()">✕</button>`;
  detailHtml += `<h2>${hex.kingWen}. ${hex.nameZh} (${hex.namePinyin})</h2>`;
  detailHtml += `<div class="detail-symbol">${renderHexagramIcon(hex.kingWen)}</div>`;
  detailHtml += `<div class="detail-trigrams">${hex.upperTrigram.symbol}${hex.upperTrigram.name}上 · ${hex.lowerTrigram.symbol}${hex.lowerTrigram.name}下</div>`;

  detailHtml += '<div class="detail-section"><h3>卦辞</h3>';
  detailHtml += `<div class="classical-text">${hex.judgment}</div>`;
  detailHtml += `<div class="modern-text">${hex.judgmentModern}</div></div>`;

  detailHtml += '<div class="detail-section"><h3>解读</h3>';
  detailHtml += `<div class="interpretation-text">${hex.interpretation}</div></div>`;

  detailHtml += '<div class="detail-section"><h3>六爻爻辞</h3>';
  for (const ln of hex.lines) {
    detailHtml += '<div class="line-detail">';
    detailHtml += `<div class="line-name">${ln.name}</div>`;
    detailHtml += `<div class="classical-text">${ln.text}</div>`;
    detailHtml += `<div class="modern-text">${ln.textModern}</div>`;
    detailHtml += '</div>';
  }
  detailHtml += '</div>';
  detailHtml += '</div>';

  const modal = document.getElementById("detail-modal");
  const body = document.getElementById("detail-modal-body");
  body.innerHTML = detailHtml;
  modal.classList.add("active");
}

function closeDetailModal() {
  document.getElementById("detail-modal").classList.remove("active");
}

function viewHistoryEntry(id) {
  const history = loadHistory();
  const entry = history.find(e => e.id === id);
  if (!entry) return;

  // Reconstruct result and show it
  const result = interpretResult(entry.question, entry.lines);
  switchToView("result");
  document.getElementById("result-content").innerHTML = renderResultView(result);
  document.getElementById("result-actions").style.display = "flex";
  // Store current result for save
  window._currentResult = result;
}

function deleteHistoryEntry(id) {
  if (confirm("确定要删除这条记录吗？")) {
    deleteReading(id);
    switchToView("history");
    document.getElementById("history-list").innerHTML = renderHistoryList(loadHistory());
  }
}
