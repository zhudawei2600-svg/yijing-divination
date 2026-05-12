// ============================================================
// SECTION: VIEW CONTROLLERS — 视图控制器
// ============================================================

let currentView = "cast";
let castState = "idle"; // idle | casting | waiting | complete
let castLines = [];
let castCurrentIndex = 0;
let coinAnimationTimeout = null;

// --- View Navigation ---

function switchToView(viewName) {
  currentView = viewName;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  const tabBtn = document.querySelector(`.tab-btn[data-view="${viewName}"]`);
  if (tabBtn) tabBtn.classList.add("active");

  // Refresh dynamic views
  if (viewName === "history") {
    document.getElementById("history-list").innerHTML = renderHistoryList(loadHistory());
  }
  if (viewName === "browse") {
    document.getElementById("browse-grid").innerHTML = HEXAGRAM_DATA.filter(Boolean).map(renderHexagramCard).join("");
  }
  if (viewName === "fengshui") {
    // Stop compass if running
    if (compassWatchId) stopCompass();
    // Initialize default tool
    switchFSTool("compass");
  }
}

// --- Cast View ---

function startCasting() {
  castLines = [];
  castCurrentIndex = 0;
  castState = "casting";
  document.getElementById("cast-progress").textContent = "已掷: 0/6";
  document.getElementById("cast-hex-preview").innerHTML = '<div class="hex-placeholder">默想问题，开始掷爻...</div>';
  document.getElementById("cast-question").disabled = true;
  document.getElementById("btn-manual").style.display = "none";
  document.getElementById("btn-auto").style.display = "none";
  document.getElementById("btn-manual-cast").style.display = "block";
  document.getElementById("btn-reset-cast").style.display = "inline-block";

  castNextLine();
}

function castNextLine() {
  if (castCurrentIndex >= 6) {
    finishCasting();
    return;
  }

  castState = "casting";
  document.getElementById("btn-manual-cast").disabled = true;

  // Animate coins
  animateCoins(() => {
    const value = castSingleLine();
    castLines.push(value);
    castCurrentIndex++;

    // Update progress
    document.getElementById("cast-progress").textContent = `已掷: ${castCurrentIndex}/6`;

    // Update hexagram preview
    updateCastPreview();

    if (castCurrentIndex >= 6) {
      finishCasting();
    } else {
      castState = "waiting";
      document.getElementById("btn-manual-cast").disabled = false;
    }
  });
}

function render3DCoin(coinIdx, result) {
  // result: 'heads' = 正面(阳=3), 'tails' = 反面(阴=2)
  const isHeads = result === 'heads';
  return `
    <div class="coin-3d">
      <div class="coin-inner spinning">
        <div class="coin-face coin-front">
          <div class="coin-face-text">
            <span class="ct-corner ct-tl">正</span>
            <span class="ct-corner ct-tr">面</span>
            <span class="ct-corner ct-bl">阳</span>
            <span class="ct-corner ct-br">☰</span>
          </div>
        </div>
        <div class="coin-face coin-back">
          <span class="coin-back-mark">⚋</span>
        </div>
      </div>
    </div>
  `;
}

function animateCoins(callback) {
  const container = document.getElementById("coin-animation");

  // Pre-determine all 3 coin results
  const results = [];
  for (let i = 0; i < 3; i++) {
    results.push(Math.random() < 0.5 ? 'heads' : 'tails');
  }

  // Render spinning coins
  container.innerHTML = '<div class="coins-anim">' +
    results.map((r, i) => render3DCoin(i, r)).join('') +
    '</div>';

  // After 1.5s of spinning, settle each coin
  coinAnimationTimeout = setTimeout(() => {
    const coins = container.querySelectorAll('.coin-inner');
    coins.forEach((coin, i) => {
      coin.classList.remove('spinning');
      coin.classList.add(results[i] === 'heads' ? 'heads' : 'tails');
    });

    // Show result labels below coins
    const labels = results.map(r => {
      const cls = r === 'heads' ? 'yang' : 'yin';
      const label = r === 'heads' ? '正面·阳(3)' : '反面·阴(2)';
      return '<div class="coin-result-label ' + cls + '">' + label + '</div>';
    }).join('');

    // Calculate sum
    const sum = results.reduce((s, r) => s + (r === 'heads' ? 3 : 2), 0);
    const lineNames = {6:'老阴 ⚋ (变爻)', 7:'少阳 ⚊', 8:'少阴 ⚋', 9:'老阳 ⚊ (变爻)'};
    const isCh = sum === 6 || sum === 9;

    container.innerHTML += '<div class="coin-results">' + labels + '</div>';
    container.innerHTML += '<div class="coin-summary">' +
      '<span>三枚之和 = ' + sum + '</span>' +
      '<span class="line-type">' + lineNames[sum] + '</span>' +
      '</div>';

    setTimeout(callback, 600);
  }, 1500);
}

function updateCastPreview() {
  const preview = document.getElementById("cast-hex-preview");
  let html = '<div class="hex-container">';
  // Show lines built so far, plus placeholder for remaining
  for (let i = 5; i >= 0; i--) {
    html += '<div class="hex-line-row preview-row">';
    if (i < castLines.length) {
      const v = castLines[i];
      const isYang = isYangLine(v);
      const isCh = isChangingLine(v);
      let cls = "hex-line " + (isYang ? "hex-line-yang" : "hex-line-yin");
      if (isCh) cls += " hex-line-changing";
      html += `<span class="hex-line-label">${getLineName(i, v)}</span>`;
      html += `<div class="${cls}">`;
      if (!isYang) {
        html += '<span class="yin-segment"></span><span class="yin-segment"></span>';
      }
      html += '</div>';
      if (isCh) html += '<span class="changing-dot">●</span>';
    } else {
      html += '<span class="hex-line-label" style="color:#ccc">' + getLineName(i, 7) + '</span>';
      html += '<div class="hex-line hex-line-placeholder"></div>';
    }
    html += '</div>';
  }
  html += '</div>';
  preview.innerHTML = html;
}

function finishCasting() {
  castState = "complete";
  document.getElementById("btn-manual-cast").style.display = "none";
  document.getElementById("btn-manual").style.display = "none";
  document.getElementById("btn-auto").style.display = "none";

  const question = document.getElementById("cast-question").value.trim();
  const result = interpretResult(question, castLines);
  window._currentResult = result;

  // Show result
  document.getElementById("result-content").innerHTML = renderResultView(result);
  document.getElementById("result-actions").style.display = "flex";
  switchToView("result");
}

function autoCast() {
  castLines = [];
  for (let i = 0; i < 6; i++) {
    castLines.push(castSingleLine());
  }
  castCurrentIndex = 6;
  castState = "complete";

  const question = document.getElementById("cast-question").value.trim();
  const result = interpretResult(question, castLines);
  window._currentResult = result;

  document.getElementById("cast-progress").textContent = "已掷: 6/6";
  updateCastPreviewAuto();
  document.getElementById("result-content").innerHTML = renderResultView(result);
  document.getElementById("result-actions").style.display = "flex";
  switchToView("result");
}

function updateCastPreviewAuto() {
  const preview = document.getElementById("cast-hex-preview");
  const changing = findChangingLines(castLines);
  preview.innerHTML = renderHexagramLines(castLines, changing);
}

function resetCast() {
  castLines = [];
  castCurrentIndex = 0;
  castState = "idle";
  document.getElementById("cast-progress").textContent = "";
  document.getElementById("cast-hex-preview").innerHTML = '<div class="hex-placeholder">默想问题，开始掷爻...</div>';
  document.getElementById("cast-question").disabled = false;
  document.getElementById("btn-manual").style.display = "";
  document.getElementById("btn-auto").style.display = "";
  document.getElementById("btn-manual-cast").style.display = "none";
  document.getElementById("btn-reset-cast").style.display = "none";
  document.getElementById("coin-animation").innerHTML = "";
  if (coinAnimationTimeout) clearTimeout(coinAnimationTimeout);
}

function saveResult() {
  if (window._currentResult) {
    saveReading(window._currentResult);
    alert("已保存记录");
  }
}

function castAgain() {
  resetCast();
  switchToView("cast");
}

// --- Browse View ---

function filterHexagrams(query) {
  const q = query.toLowerCase().trim();
  const cards = document.querySelectorAll(".hex-card");
  cards.forEach(card => {
    const kingWen = parseInt(card.dataset.kingwen);
    const hex = HEXAGRAM_DATA[kingWen];
    if (!hex) { card.style.display = "none"; return; }
    const searchText = [hex.kingWen, hex.nameZh, hex.namePinyin, hex.upperTrigram.name, hex.lowerTrigram.name, hex.judgment, hex.judgmentModern].join(" ").toLowerCase();
    card.style.display = searchText.includes(q) ? "" : "none";
  });
}

// --- Init ---

function initApp() {
  // Set up tab navigation
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      switchToView(btn.dataset.view);
    });
  });

  // Set up cast buttons
  document.getElementById("btn-manual").addEventListener("click", startCasting);
  document.getElementById("btn-manual-cast").addEventListener("click", castNextLine);
  document.getElementById("btn-auto").addEventListener("click", autoCast);
  document.getElementById("btn-reset-cast").addEventListener("click", resetCast);

  // Result buttons
  document.getElementById("btn-save").addEventListener("click", saveResult);
  document.getElementById("btn-cast-again").addEventListener("click", castAgain);

  // History
  document.getElementById("btn-clear-history").addEventListener("click", () => {
    if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      clearAllHistory();
      switchToView("history");
    }
  });

  // Detail modal
  document.getElementById("detail-modal").addEventListener("click", function(e) {
    if (e.target === this) closeDetailModal();
  });

  // Search
  document.getElementById("browse-search").addEventListener("input", function() {
    filterHexagrams(this.value);
  });

  // Initialize browse grid
  document.getElementById("browse-grid").innerHTML = HEXAGRAM_DATA.filter(Boolean).map(renderHexagramCard).join("");

  // Show initial view
  switchToView("cast");
}

// --- Service Worker Registration ---
if ("serviceWorker" in navigator) {
  // Inline SW registration handled in the combined HTML
}
