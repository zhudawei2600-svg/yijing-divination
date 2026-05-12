// ============================================================
// SECTION: FENG SHUI VIEWS — 风水模块视图控制器
// ============================================================

let fsCurrentTool = "compass"; // compass | stars | calendar | elements
let compassWatchId = null;

// --- Feng Shui Tool Navigation ---

function switchFSTool(toolName) {
  fsCurrentTool = toolName;

  // Update sub-tab buttons
  document.querySelectorAll(".fs-subtab").forEach(b => b.classList.remove("active"));
  const subBtn = document.querySelector(`.fs-subtab[data-tool="${toolName}"]`);
  if (subBtn) subBtn.classList.add("active");

  // Hide all tool panels
  document.querySelectorAll(".fs-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById("fs-panel-" + toolName);
  if (panel) panel.classList.add("active");

  // Initialize tool
  if (toolName === "compass") initCompass();
  else if (toolName === "stars") renderStarsPanel();
  else if (toolName === "calendar") renderCalendarPanel();
  else if (toolName === "elements") renderElementsPanel();
}

// --- 1. VIRTUAL COMPASS (虚拟罗盘) ---

function initCompass() {
  if (compassWatchId) {
    window.removeEventListener("deviceorientation", handleOrientation);
    compassWatchId = null;
  }

  const container = document.getElementById("fs-compass-display");
  container.innerHTML = `
    <div class="compass-container">
      <canvas id="compass-canvas" width="280" height="280"></canvas>
      <div class="compass-center">
        <div class="compass-degrees" id="compass-deg">--°</div>
        <div class="compass-mountain" id="compass-mountain">--</div>
        <div class="compass-element" id="compass-elem">--</div>
        <div class="compass-trigram" id="compass-trigram">--</div>
      </div>
    </div>
    <div class="compass-info">
      <div class="compass-row"><span>坐向</span><span id="compass-sitting">--</span></div>
      <div class="compass-row"><span>朝向</span><span id="compass-facing">--</span></div>
      <div class="compass-row"><span>宅卦</span><span id="compass-house">--</span></div>
      <div class="compass-row"><span>五行</span><span id="compass-element-detail">--</span></div>
    </div>
    <p class="compass-hint" id="compass-hint">点击下方按钮启动罗盘（需授权方向传感器）</p>
    <button class="btn-primary" id="btn-start-compass" onclick="startCompass()" style="width:100%;">启动罗盘</button>
    <button class="btn-secondary" id="btn-stop-compass" onclick="stopCompass()" style="width:100%; margin-top:8px; display:none;">停止罗盘</button>
    <p class="compass-note">将手机平放，顶部指向房屋朝向方向</p>
  `;
}

function startCompass() {
  // Request DeviceOrientation permission (iOS 13+)
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then(state => {
        if (state === "granted") {
          beginOrientationWatch();
        } else {
          document.getElementById("compass-hint").textContent = "需要授权方向传感器才能使用罗盘。请在设置中允许。";
        }
      })
      .catch(() => {
        // Fallback: try directly
        beginOrientationWatch();
      });
  } else {
    beginOrientationWatch();
  }
}

function beginOrientationWatch() {
  document.getElementById("btn-start-compass").style.display = "none";
  document.getElementById("btn-stop-compass").style.display = "block";
  document.getElementById("compass-hint").textContent = "罗盘已启动，将手机顶部对准房屋朝向...";

  window.addEventListener("deviceorientation", handleOrientation);
  compassWatchId = 1;

  // Also listen for absolute orientation (compass heading) on some devices
  if ("ondeviceorientationabsolute" in window) {
    window.addEventListener("deviceorientationabsolute", handleOrientation);
  }
}

function stopCompass() {
  window.removeEventListener("deviceorientation", handleOrientation);
  window.removeEventListener("deviceorientationabsolute", handleOrientation);
  compassWatchId = null;
  document.getElementById("btn-start-compass").style.display = "block";
  document.getElementById("btn-stop-compass").style.display = "none";
  document.getElementById("compass-hint").textContent = "罗盘已停止。";
  document.getElementById("compass-deg").textContent = "--°";
  document.getElementById("compass-mountain").textContent = "--";
  document.getElementById("compass-elem").textContent = "--";
  drawCompassCanvas(0);
}

let lastHeading = 0;

function handleOrientation(e) {
  // webkitCompassHeading gives the compass direction (0-360)
  // alpha: rotation around z-axis (0-360), 0 = north
  let heading;
  if (e.webkitCompassHeading !== undefined) {
    heading = e.webkitCompassHeading;
  } else if (e.alpha !== null) {
    // alpha is relative to initial orientation; on most devices,
    // 0 = north when the device is first oriented
    heading = (360 - e.alpha) % 360; // Convert to clockwise from north
  } else {
    return;
  }

  heading = Math.round(heading);
  lastHeading = heading;
  const mountain = headingToMountain(heading);

  document.getElementById("compass-deg").textContent = heading + "°";
  document.getElementById("compass-mountain").textContent = mountain.name + "山";
  document.getElementById("compass-elem").textContent = mountain.element;
  document.getElementById("compass-trigram").textContent = mountain.trigram;

  // Sitting = opposite of facing (the back of the phone is facing the house)
  const sitting = getOppositeMountain(mountain);
  document.getElementById("compass-sitting").textContent = mountain.name + "山" + mountain.element;
  document.getElementById("compass-facing").textContent = sitting.name + "山" + sitting.element;

  const house = getEightHouse(mountain);
  document.getElementById("compass-house").textContent = house.name + " (" + house.group + ")";
  document.getElementById("compass-element-detail").textContent = mountain.element + " (" + FIVE_ELEMENTS[mountain.element].color + ")";

  drawCompassCanvas(heading);
}

function drawCompassCanvas(heading) {
  const canvas = document.getElementById("compass-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = 140, cy = 140, r = 120;

  ctx.clearRect(0, 0, 280, 280);

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#2C1810";
  ctx.fill();

  // Inner face
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.fillStyle = "#F5F0E8";
  ctx.fill();

  // 24 Mountain marks
  for (let i = 0; i < 24; i++) {
    const m = MOUNTAINS_24[i];
    const angle = (m.angle - 90) * Math.PI / 180; // Rotate so 0°=top
    const isCardinal = i % 3 === 0; // Every 3rd is a cardinal direction

    // Tick mark
    const innerR = isCardinal ? r - 18 : r - 12;
    const x1 = cx + innerR * Math.cos(angle);
    const y1 = cy + innerR * Math.sin(angle);
    const x2 = cx + (r - 8) * Math.cos(angle);
    const y2 = cy + (r - 8) * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isCardinal ? "#C41E3A" : "#6B5B4F";
    ctx.lineWidth = isCardinal ? 2 : 1;
    ctx.stroke();

    // Label for cardinal directions (every 3rd)
    if (isCardinal) {
      const labelR = r - 30;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);
      ctx.font = "bold 12px SimSun, serif";
      ctx.fillStyle = "#2C1810";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(m.name, lx, ly);
    }
  }

  // N/S/E/W markers
  const cardinalLabels = [
    { name:"N", angle:-90 }, { name:"E", angle:0 },
    { name:"S", angle:90 }, { name:"W", angle:180 }
  ];
  for (const cl of cardinalLabels) {
    const angle = cl.angle * Math.PI / 180;
    const lx = cx + (r - 48) * Math.cos(angle);
    const ly = cy + (r - 48) * Math.sin(angle);
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#C41E3A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cl.name, lx, ly);
  }

  // Pointer/needle
  const pointerAngle = (heading - 90) * Math.PI / 180;
  const px = cx + (r - 50) * Math.cos(pointerAngle);
  const py = cy + (r - 50) * Math.sin(pointerAngle);

  // Pointer line
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.strokeStyle = "#C41E3A";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Pointer tip (triangle)
  const tipAngle = pointerAngle;
  const tipSize = 14;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(
    px - tipSize * Math.cos(tipAngle - 0.6),
    py - tipSize * Math.sin(tipAngle - 0.6)
  );
  ctx.lineTo(
    px - tipSize * Math.cos(tipAngle + 0.6),
    py - tipSize * Math.sin(tipAngle + 0.6)
  );
  ctx.closePath();
  ctx.fillStyle = "#C41E3A";
  ctx.fill();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#C41E3A";
  ctx.fill();

  // Outer border ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#8B6914";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// --- 2. NINE PALACES STARS (九宫飞星) ---

function renderStarsPanel() {
  const analysis = analyzeNinePalaces(CURRENT_YEAR);
  const star = analysis.centralStarInfo;
  const yearName = calcYearStemBranch(CURRENT_YEAR).full;

  let html = `<div class="fs-section">`;
  html += `<h3>${CURRENT_YEAR}年 (${yearName}年) 九宫飞星盘</h3>`;
  html += `<p class="fs-desc">中宫: <strong>${star.shortName}</strong> (${star.name}) — ${star.meaning}</p>`;

  // 3x3 grid
  html += '<div class="palace-grid">';
  const gridOrder = ["SE","S","SW","E","C","W","NE","N","NW"];

  for (const key of gridOrder) {
    const p = analysis.palaces.find(pp => pp.key === key);
    if (!p) continue;

    const qClass = p.quality === "大吉" ? "palace-auspicious" :
                   p.quality === "大凶" ? "palace-danger" :
                   p.quality === "凶" ? "palace-bad" :
                   p.quality === "吉" ? "palace-good" : "palace-neutral";

    html += `<div class="palace-cell ${qClass}">`;
    html += `<div class="palace-name">${p.palace.name}</div>`;
    html += `<div class="palace-direction">${p.palace.direction}</div>`;
    html += `<div class="palace-star">${p.starInfo.shortName} ${p.starInfo.color}</div>`;
    html += `<div class="palace-quality">${p.quality}</div>`;
    html += `<div class="palace-suggestion">${p.suggestion}</div>`;
    html += '</div>';
  }
  html += '</div>';

  // Legend
  html += '<div class="star-legend">';
  for (let i = 1; i <= 9; i++) {
    const s = FLYING_STARS[i];
    const dotClass = s.auspicious ? "dot-auspicious" : "dot-inauspicious";
    html += `<div class="legend-item"><span class="legend-dot ${dotClass}">●</span>${s.shortName}: ${s.name} (${s.meaning})</div>`;
  }
  html += '</div>';

  // Month selector
  html += '<div class="fs-subsection">';
  html += '<h4>查看月飞星</h4>';
  html += '<select id="month-select" onchange="renderMonthStars()" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); font-size:15px; background:var(--bg-card);">';
  const monthNames = ["一月(寅)","二月(卯)","三月(辰)","四月(巳)","五月(午)","六月(未)","七月(申)","八月(酉)","九月(戌)","十月(亥)","十一月(子)","十二月(丑)"];
  const now = new Date();
  const currentM = now.getMonth() + 1;
  for (let m = 1; m <= 12; m++) {
    const sel = m === currentM ? " selected" : "";
    html += `<option value="${m}"${sel}>${monthNames[m-1]}</option>`;
  }
  html += '</select>';
  html += '<div id="month-stars-result" style="margin-top:12px;"></div>';
  html += '</div>';

  html += '</div>'; // fs-section

  document.getElementById("fs-panel-stars").innerHTML = html;
  renderMonthStars(); // Show current month
}

function renderMonthStars() {
  const month = parseInt(document.getElementById("month-select").value);
  const centralStar = getMonthCentralStar(CURRENT_YEAR, month);
  const chart = buildFullStarChart(centralStar);
  const star = FLYING_STARS[centralStar];

  let html = `<p style="font-size:14px; margin-bottom:8px;">月飞星中宫: <strong>${star.shortName}</strong> (${star.name})</p>`;
  html += '<div class="palace-grid" style="grid-template-columns: repeat(3, 1fr); font-size:12px;">';
  const gridOrder = ["SE","S","SW","E","C","W","NE","N","NW"];

  for (const key of gridOrder) {
    const fs = chart[key];
    const s = FLYING_STARS[fs];
    const c = s.auspicious ? "palace-good" : "palace-bad";
    html += `<div class="palace-cell ${c}" style="padding:6px;">`;
    html += `<div style="font-size:12px;">${PALACES[key].name}</div>`;
    html += `<div style="font-weight:bold;">${s.shortName}</div>`;
    html += '</div>';
  }
  html += '</div>';

  document.getElementById("month-stars-result").innerHTML = html;
}

// --- 3. AUSPICIOUS DATE FINDER (择日历) ---

function renderCalendarPanel() {
  const now = new Date();
  let html = `<div class="fs-section">`;
  html += '<h3>个性化择日历</h3>';
  html += '<p class="fs-desc">输入出生日期，查找属于您的贵人日和文昌日。</p>';

  html += '<div class="form-group">';
  html += '<label>出生日期</label>';
  html += `<input type="date" id="cal-birthdate" class="fs-input" value="1990-01-01">`;
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>查看月份</label>';
  html += `<select id="cal-month" class="fs-input">`;
  for (let m = 1; m <= 12; m++) {
    const sel = m === now.getMonth() + 1 ? " selected" : "";
    html += `<option value="${m}"${sel}>${m}月</option>`;
  }
  html += '</select>';
  html += '</div>';

  html += `<button class="btn-primary" onclick="calculateCalendar()" style="width:100%;">查找吉日</button>`;
  html += '<div id="calendar-results" style="margin-top:16px;"></div>';
  html += '</div>';

  document.getElementById("fs-panel-calendar").innerHTML = html;
}

function calculateCalendar() {
  const birthVal = document.getElementById("cal-birthdate").value;
  if (!birthVal) { alert("请输入出生日期"); return; }
  const parts = birthVal.split("-");
  const birth = { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
  const targetMonth = parseInt(document.getElementById("cal-month").value);
  const targetYear = CURRENT_YEAR;

  const result = findAuspiciousDates(birth, targetYear, targetMonth);

  let html = '<div class="calendar-info">';
  html += `<p>出生日柱: <strong>${result.birthInfo.full}</strong> (日干: ${result.birthInfo.stem})</p>`;
  html += `<p>贵人生肖地支: ${TIANYI_GUIREN[result.userDayStem].join("、")}</p>`;
  html += `<p>贵人日(${result.nobleDays.length}天): `;
  html += result.nobleDays.map(d => d.day + "日").join(" ") || "本月无";
  html += '</p>';
  html += `<p>文昌日(${result.wenchangDays.length}天): `;
  html += result.wenchangDays.map(d => d.day + "日").join(" ") || "本月无";
  html += '</p>';
  html += '</div>';

  // Date list
  html += '<div class="calendar-grid">';
  html += '<div class="cal-header">日</div><div class="cal-header">干支</div><div class="cal-header">评级</div><div class="cal-header">宜</div>';

  for (const date of result.dates) {
    let recClass = "cal-normal";
    if (date.recommendation.includes("上吉")) recClass = "cal-best";
    else if (date.recommendation.includes("吉")) recClass = "cal-good";
    else if (date.recommendation.includes("凶")) recClass = "cal-bad";

    const ausp = date.monthAuspicious.slice(0, 2).join(" ") || "—";

    html += `<div class="cal-cell">${date.day}</div>`;
    html += `<div class="cal-cell">${date.stemBranch}</div>`;
    html += `<div class="cal-cell ${recClass}">${date.recommendation}</div>`;
    html += `<div class="cal-cell" style="font-size:11px;">${ausp}</div>`;
  }
  html += '</div>';

  html += '<p class="compass-note">注：上吉日 = 贵人日+文昌日重叠，宜安排重要事务。冲煞日应避免重大决策。</p>';

  document.getElementById("calendar-results").innerHTML = html;
}

// --- 4. FIVE ELEMENTS COLORS & PLANTS (五行配色与绿植) ---

function renderElementsPanel() {
  let html = '<div class="fs-section">';
  html += '<h3>五行方位配色与绿植</h3>';
  html += '<p class="fs-desc">根据方位五行属性，推荐房间配色和植物。</p>';

  html += '<div class="elements-grid">';
  for (const [elem, data] of Object.entries(FIVE_ELEMENTS)) {
    const recs = getElementRecommendations(elem);
    const colorBar = recs.colors.map(c => `<span class="color-swatch" style="background:${c};"></span>`).join("");

    html += `<div class="element-card">`;
    html += `<div class="element-name">${elem} <span style="font-size:12px;color:var(--text-muted)">${data.direction} ${data.season}</span></div>`;
    html += `<div class="element-colors">${colorBar} ${data.color}</div>`;
    html += '<div class="element-plants">推荐植物:';
    for (const plant of recs.plants.slice(0, 2)) {
      html += `<div class="plant-item"><strong>${plant.name}</strong> — ${plant.meaning}<br><small>养护: ${plant.care}</small></div>`;
    }
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';
  html += '</div>';

  document.getElementById("fs-panel-elements").innerHTML = html;
}
