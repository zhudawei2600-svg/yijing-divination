// ============================================================
// SECTION: FENG SHUI DATA — 风水基础数据
// ============================================================

// --- 二十四山向 (24 Mountains) ---
// Each spans 15°, starting from 子 (0° = North)
const MOUNTAINS_24 = [
  { name:"子", angle:0,   element:"水", trigram:"坎", yinYang:"阳" },
  { name:"癸", angle:15,  element:"水", trigram:"坎", yinYang:"阴" },
  { name:"丑", angle:30,  element:"土", trigram:"艮", yinYang:"阴" },
  { name:"艮", angle:45,  element:"土", trigram:"艮", yinYang:"阳" },
  { name:"寅", angle:60,  element:"木", trigram:"艮", yinYang:"阳" },
  { name:"甲", angle:75,  element:"木", trigram:"震", yinYang:"阳" },
  { name:"卯", angle:90,  element:"木", trigram:"震", yinYang:"阴" },
  { name:"乙", angle:105, element:"木", trigram:"震", yinYang:"阴" },
  { name:"辰", angle:120, element:"土", trigram:"巽", yinYang:"阳" },
  { name:"巽", angle:135, element:"木", trigram:"巽", yinYang:"阴" },
  { name:"巳", angle:150, element:"火", trigram:"巽", yinYang:"阳" },
  { name:"丙", angle:165, element:"火", trigram:"离", yinYang:"阳" },
  { name:"午", angle:180, element:"火", trigram:"离", yinYang:"阴" },
  { name:"丁", angle:195, element:"火", trigram:"离", yinYang:"阴" },
  { name:"未", angle:210, element:"土", trigram:"坤", yinYang:"阴" },
  { name:"坤", angle:225, element:"土", trigram:"坤", yinYang:"阳" },
  { name:"申", angle:240, element:"金", trigram:"坤", yinYang:"阳" },
  { name:"庚", angle:255, element:"金", trigram:"兑", yinYang:"阳" },
  { name:"酉", angle:270, element:"金", trigram:"兑", yinYang:"阴" },
  { name:"辛", angle:285, element:"金", trigram:"兑", yinYang:"阴" },
  { name:"戌", angle:300, element:"土", trigram:"乾", yinYang:"阳" },
  { name:"乾", angle:315, element:"金", trigram:"乾", yinYang:"阳" },
  { name:"亥", angle:330, element:"水", trigram:"乾", yinYang:"阴" },
  { name:"壬", angle:345, element:"水", trigram:"坎", yinYang:"阳" }
];

// --- 九宫格 (Nine Palaces) ---
// Layout (standard): NW(6), N(1), NE(8), W(7), C(5), E(3), SW(2), S(9), SE(4)
const PALACES = {
  SE: { name:"东南", element:"木", trigram:"巽", baseStar:4, color:"#4A7C59", direction:"巽位" },
  S:  { name:"正南", element:"火", trigram:"离", baseStar:9, color:"#C41E3A", direction:"离位" },
  SW: { name:"西南", element:"土", trigram:"坤", baseStar:2, color:"#C4943A", direction:"坤位" },
  E:  { name:"正东", element:"木", trigram:"震", baseStar:3, color:"#2D6B30", direction:"震位" },
  C:  { name:"中宫", element:"土", trigram:"—",  baseStar:5, color:"#8B7355", direction:"中宫" },
  W:  { name:"正西", element:"金", trigram:"兑", baseStar:7, color:"#D4C5B2", direction:"兑位" },
  NE: { name:"东北", element:"土", trigram:"艮", baseStar:8, color:"#C4A35A", direction:"艮位" },
  N:  { name:"正北", element:"水", trigram:"坎", baseStar:1, color:"#2C3E6B", direction:"坎位" },
  NW: { name:"西北", element:"金", trigram:"乾", baseStar:6, color:"#B8B0A0", direction:"乾位" }
};

// --- 九星 (Nine Stars / Flying Stars) ---
const FLYING_STARS = {
  1: { name:"一白贪狼星", color:"白", element:"水", meaning:"桃花人缘、官运亨通", auspicious:true, shortName:"一白" },
  2: { name:"二黑巨门星", color:"黑", element:"土", meaning:"疾病晦气、身体欠安", auspicious:false, shortName:"二黑" },
  3: { name:"三碧禄存星", color:"碧", element:"木", meaning:"口舌是非、官司纠纷", auspicious:false, shortName:"三碧" },
  4: { name:"四绿文曲星", color:"绿", element:"木", meaning:"文昌学业、才华横溢", auspicious:true, shortName:"四绿" },
  5: { name:"五黄廉贞星", color:"黄", element:"土", meaning:"最大凶星、灾祸疾病", auspicious:false, shortName:"五黄" },
  6: { name:"六白武曲星", color:"白", element:"金", meaning:"偏财横财、权威地位", auspicious:true, shortName:"六白" },
  7: { name:"七赤破军星", color:"赤", element:"金", meaning:"破财盗窃、口舌之争", auspicious:false, shortName:"七赤" },
  8: { name:"八白左辅星", color:"白", element:"土", meaning:"正财置业、最旺吉星", auspicious:true, shortName:"八白" },
  9: { name:"九紫右弼星", color:"紫", element:"火", meaning:"喜庆姻缘、添丁发财", auspicious:true, shortName:"九紫" }
};

// --- 飞星运行路径 (Luo Shu Flying Order) ---
// Order when flying from center: Center → NW → W → NE → S → N → SW → E → SE
const FLYING_ORDER = ["C","NW","W","NE","S","N","SW","E","SE"];

// Pre-compute: for each central star, which star lands in which palace
// starAtPalace[centralStar][palaceKey] = flying star number
function buildFlyingStarMap() {
  const map = {};
  // Starting position of each star in the standard array (star 1 at N in base)
  // The flying pattern relative to the center
  const flyingPath = [
    { dr:-1, dc:0 },  // N  (from center)
    { dr:-1, dc:1 },  // NE
    { dr:0, dc:-1 },  // E
    { dr:0, dc:1 },   // W  -- actually let me use the path order
  ];

  for (let central = 1; central <= 9; central++) {
    map[central] = {};
    let currentStar = central;
    // Place central star
    map[central]["C"] = currentStar;
    // Follow the flying order path
    for (let i = 0; i < 8; i++) {
      currentStar = (currentStar % 9) + 1; // increment, wrap at 9→1
      map[central][FLYING_ORDER[i]] = currentStar;
    }
  }
  return map;
}

// Actually, let me pre-compute this manually for clarity and correctness
// The Luo Shu flying order from center goes: NW→W→NE→S→N→SW→E→SE
// Starting from the center star, each subsequent palace gets the next star (mod 9, 9→1)

function getFlyingStar(centralStar, palaceKey) {
  if (palaceKey === "C") return centralStar;
  const idx = FLYING_ORDER.indexOf(palaceKey);
  if (idx === -1) return centralStar;
  // Stars increment by 1 at each step, wrapping 9→1
  let star = centralStar;
  for (let i = 0; i <= idx; i++) {
    star = (star % 9) + 1;
  }
  return star;
}

function buildFullStarChart(centralStar) {
  const chart = {};
  for (const key of Object.keys(PALACES)) {
    chart[key] = getFlyingStar(centralStar, key);
  }
  return chart;
}

// --- 年飞星计算 (Annual Flying Star) ---
function getAnnualCentralStar(year) {
  // Sum digits of year until single digit, then 11 - digit
  let d = year;
  while (d > 9) {
    d = String(d).split('').reduce((s, c) => s + parseInt(c), 0);
  }
  let star = 11 - d;
  if (star > 9) star = star - 9;
  if (star === 0) star = 9;
  return star;
}

// --- 月飞星 (Monthly Flying Star) ---
// Month stars: 子午卯酉年 starting from 8, 辰戌丑未年 from 5, 寅申巳亥年 from 2
function getMonthCentralStar(year, month) {
  const earthlyBranch = getYearBranch(year);
  let base;
  if (["子","午","卯","酉"].includes(earthlyBranch)) base = 8;
  else if (["辰","戌","丑","未"].includes(earthlyBranch)) base = 5;
  else base = 2; // 寅申巳亥

  // Month 1 (January-ish, 寅月): month central = base
  // Each subsequent month: decrement by 1 (wrap 1→9)
  let star = base - (month - 1);
  while (star < 1) star += 9;
  return star;
}

function getYearBranch(year) {
  const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  // 2026 = 丙午年, earthly branch 午
  // Mapping: (year - 4) % 12
  return branches[((year - 4) % 12 + 12) % 12];
}

function getYearStem(year) {
  const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  return stems[((year - 4) % 10 + 10) % 10];
}

// --- 五行 (Five Elements) ---
const FIVE_ELEMENTS = {
  "木": { color:"绿色", colors:["#4A7C59","#6B9B76","#8FBC8F"], direction:"东/东南", season:"春" },
  "火": { color:"红色", colors:["#C41E3A","#D4576B","#FF6B6B"], direction:"南", season:"夏" },
  "土": { color:"黄色/棕色", colors:["#C4943A","#D4A76A","#F5DEB3"], direction:"中/东北/西南", season:"季末" },
  "金": { color:"白色/金色", colors:["#F5F0E8","#E8DED0","#D4C5B2"], direction:"西/西北", season:"秋" },
  "水": { color:"蓝色/黑色", colors:["#2C3E6B","#4A6FA5","#87CEEB"], direction:"北", season:"冬" }
};

// Five Elements relationships
const ELEMENT_CYCLE = {
  "木": { generates:"火", overcomes:"土", generatedBy:"水", overcomeBy:"金" },
  "火": { generates:"土", overcomes:"金", generatedBy:"木", overcomeBy:"水" },
  "土": { generates:"金", overcomes:"水", generatedBy:"火", overcomeBy:"木" },
  "金": { generates:"水", overcomes:"木", generatedBy:"土", overcomeBy:"火" },
  "水": { generates:"木", overcomes:"火", generatedBy:"金", overcomeBy:"土" }
};

// --- 植物推荐 (Plant Recommendations by Element) ---
const PLANT_RECOMMENDATIONS = {
  "木": [
    { name:"发财树", meaning:"招财进宝，旺事业", care:"喜半阴，保持土壤湿润" },
    { name:"绿萝", meaning:"净化空气，生气勃勃", care:"耐阴，水培土培均可" },
    { name:"巴西木", meaning:"步步高升，生机盎然", care:"喜温暖，避免阳光直射" },
    { name:"富贵竹", meaning:"节节高升，富贵吉祥", care:"水培养护，避免阳光直晒" }
  ],
  "火": [
    { name:"红掌", meaning:"鸿运当头，热情洋溢", care:"喜温暖湿润，散射光" },
    { name:"鸿运当头", meaning:"红红火火，好运连连", care:"喜半阴，保持盆土微湿" },
    { name:"一品红", meaning:"喜庆热烈，事业红火", care:"喜光，不耐寒" },
    { name:"朱蕉", meaning:"红红火火，驱邪避凶", care:"喜温暖，散射光照" }
  ],
  "土": [
    { name:"金钱树", meaning:"招财进宝，稳重吉祥", care:"耐阴耐旱，少浇水" },
    { name:"虎皮兰", meaning:"镇宅避邪，净化空气", care:"极其耐旱，少管理" },
    { name:"橡皮树", meaning:"稳重厚实，镇宅招财", care:"喜光耐阴，适应性强" },
    { name:"龟背竹", meaning:"长寿安康，添福添寿", care:"喜半阴，保持湿润" }
  ],
  "金": [
    { name:"白掌", meaning:"一帆风顺，纯洁高雅", care:"喜半阴，保持湿润" },
    { name:"银皇后", meaning:"高贵典雅，招财纳福", care:"耐阴，适合室内养护" },
    { name:"银叶菊", meaning:"银装素裹，高贵清雅", care:"喜光，适应性好" },
    { name:"白鹤芋", meaning:"纯洁吉祥，事业顺利", care:"喜温暖湿润环境" }
  ],
  "水": [
    { name:"水培富贵竹", meaning:"水生财，财源滚滚", care:"水培养护，每周换水" },
    { name:"荷花/碗莲", meaning:"出淤泥不染，高雅吉祥", care:"需充足阳光和水分" },
    { name:"水仙花", meaning:"吉祥如意，高贵芬芳", care:"水培，喜凉爽通风" },
    { name:"吊兰", meaning:"净化空气，生机无限", care:"适应性强，水培土培均可" }
  ]
};

// --- 化解物推荐 (Remedies by Issue) ---
const REMEDIES = {
  "缺角": {
    "西北": { item:"金属摆件/铜葫芦", reason:"西北属金，代表男主人/父亲位，宜补金气" },
    "西南": { item:"陶瓷/泰山石", reason:"西南属土，代表女主人/母亲位，宜补土气" },
    "正东": { item:"绿色植物/木质家具", reason:"正东属木，代表长子位，宜补木气" },
    "东南": { item:"绿色植物/文昌塔", reason:"东南属木，代表长女/文昌位，宜补木气" },
    "正北": { item:"鱼缸/黑色装饰", reason:"正北属水，代表中子位，宜补水气" },
    "正南": { item:"红色装饰/灯具", reason:"正南属火，代表中女位，宜补火气" },
    "正西": { item:"金属风铃/白色装饰", reason:"正西属金，代表少女位，宜补金气" },
    "东北": { item:"陶瓷/山石摆件", reason:"东北属土，代表少男位，宜补土气" }
  },
  "五黄": { item:"金属风铃/六帝钱", reason:"五黄属土，土生金，用金泄土气化解" },
  "二黑": { item:"金属葫芦/铜铃", reason:"二黑属土，用金泄病气" },
  "三碧": { item:"红色物品/灯具", reason:"三碧属木，用火泄木气，化解是非" },
  "穿堂风": { item:"屏风/玄关柜/水晶帘", reason:"阻隔气流直冲，藏风聚气" },
  "门对门": { item:"门帘/屏风/五帝钱", reason:"化解门冲，减少气场对冲" }
};

// --- 干支历法 (Sexagenary Cycle) ---
const HEAVENLY_STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const EARTHLY_BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const ZODIAC = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];

// 六十甲子表 (sexagenary cycle lookup)
function getSexagenaryName(stemIdx, branchIdx) {
  return HEAVENLY_STEMS[stemIdx % 10] + EARTHLY_BRANCHES[branchIdx % 12];
}

// 天乙贵人查询表 (日干 → 贵人地支)
const TIANYI_GUIREN = {
  "甲": ["丑","未"], "戊": ["丑","未"], "庚": ["丑","未"],
  "乙": ["子","申"], "己": ["子","申"],
  "丙": ["亥","酉"], "丁": ["亥","酉"],
  "辛": ["午","寅"], "壬": ["卯","巳"], "癸": ["卯","巳"]
};

// 文昌贵人 (日干 → 文昌地支)
const WENCHANG_GUIREN = {
  "甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申",
  "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯"
};

// 2026-2027 每月宜忌简表 (simplified almanac)
const MONTHLY_ALMANAC_2026 = [
  { month:1,  stemBranch:"庚寅", startDate:"2026-02-01", auspicious:["开业","出行","嫁娶","搬家"], inauspicious:["动土","安葬"] },
  { month:2,  stemBranch:"辛卯", startDate:"2026-03-03", auspicious:["嫁娶","开业","签约","出行"], inauspicious:["动土","破土"] },
  { month:3,  stemBranch:"壬辰", startDate:"2026-04-01", auspicious:["搬家","装修","出行","签约"], inauspicious:["嫁娶","安床"] },
  { month:4,  stemBranch:"癸巳", startDate:"2026-05-01", auspicious:["开业","出行","嫁娶","安床"], inauspicious:["动土","搬家"] },
  { month:5,  stemBranch:"甲午", startDate:"2026-05-30", auspicious:["嫁娶","签约","出行","开业"], inauspicious:["动土","装修"] },
  { month:6,  stemBranch:"乙未", startDate:"2026-06-29", auspicious:["搬家","装修","出行","签约"], inauspicious:["嫁娶","开业"] },
  { month:7,  stemBranch:"丙申", startDate:"2026-07-28", auspicious:["开业","出行","嫁娶","安床"], inauspicious:["动土","搬家"] },
  { month:8,  stemBranch:"丁酉", startDate:"2026-08-27", auspicious:["嫁娶","签约","搬家","装修"], inauspicious:["动土","出行"] },
  { month:9,  stemBranch:"戊戌", startDate:"2026-09-25", auspicious:["开业","出行","签约","安床"], inauspicious:["嫁娶","搬家"] },
  { month:10, stemBranch:"己亥", startDate:"2026-10-25", auspicious:["搬家","装修","嫁娶","出行"], inauspicious:["动土","开业"] },
  { month:11, stemBranch:"庚子", startDate:"2026-11-23", auspicious:["开业","出行","签约","安床"], inauspicious:["动土","嫁娶"] },
  { month:12, stemBranch:"辛丑", startDate:"2026-12-23", auspicious:["嫁娶","搬家","装修","出行"], inauspicious:["动土","开业"] }
];

// 每日宜忌 (simplified lookups for current months)
// In production, this would be a full almanac database
// For now, we provide monthly patterns
function getDayAlmanacAdvice(stemBranch, userDayStem) {
  // Simplified: avoid conflicting days based on earthly branches
  const clashes = {
    "子":"午","丑":"未","寅":"申","卯":"酉","辰":"戌","巳":"亥",
    "午":"子","未":"丑","申":"寅","酉":"卯","戌":"辰","亥":"巳"
  };
  // Provide basic guidance
  return {
    general: "宜静不宜动" in clashes ? "注意冲煞" : "一般日子"
  };
}

// --- 四柱八字简化计算 (Simplified Ba Zi Calculator) ---
function calcDayStemBranch(year, month, day) {
  // Simplified: calculate day stem-branch from a reference point
  // Reference: 2026-01-01 = 乙巳日 (day 42 of 60-day cycle)

  // For demo purposes, use an approximation
  // days since 2026-01-01
  const refDate = new Date(2026, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const daysDiff = Math.floor((targetDate - refDate) / (1000 * 60 * 60 * 24));

  // 2026-01-01 = day 42 in sexagenary cycle (乙巳)
  const cycleDay = ((42 + daysDiff) % 60 + 60) % 60;
  const stemIdx = cycleDay % 10;
  const branchIdx = cycleDay % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    full: HEAVENLY_STEMS[stemIdx] + EARTHLY_BRANCHES[branchIdx],
    cycleDay: cycleDay
  };
}

function calcYearStemBranch(year) {
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    full: HEAVENLY_STEMS[stemIdx] + EARTHLY_BRANCHES[branchIdx]
  };
}

// --- 贵人日查找 (Find Noble Days) ---
function findNobleDays(userDayStem, month, year) {
  const nobleBranches = TIANYI_GUIREN[userDayStem] || [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const nobleDays = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const sb = calcDayStemBranch(year, month, d);
    if (nobleBranches.includes(sb.branch)) {
      nobleDays.push({ day: d, branch: sb.branch, full: sb.full });
    }
  }
  return nobleDays;
}

function findWenchangDays(userDayStem, month, year) {
  const wenchangBranch = WENCHANG_GUIREN[userDayStem];
  if (!wenchangBranch) return [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const wenchangDays = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const sb = calcDayStemBranch(year, month, d);
    if (sb.branch === wenchangBranch) {
      wenchangDays.push({ day: d, full: sb.full });
    }
  }
  return wenchangDays;
}

// --- 关于年飞星 (Annual Flying Star for current year) ---
const CURRENT_YEAR = 2026;
const CURRENT_ANNUAL_STAR = getAnnualCentralStar(CURRENT_YEAR);
const CURRENT_ANNUAL_CHART = buildFullStarChart(CURRENT_ANNUAL_STAR);
