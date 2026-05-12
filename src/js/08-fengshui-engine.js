// ============================================================
// SECTION: FENG SHUI ENGINE — 风水算法引擎
// ============================================================

// --- COMPASS FUNCTIONS ---

/**
 * Convert device heading (degrees) to 二十四山 name.
 * 0° = North = 子
 */
function headingToMountain(heading) {
  // Normalize heading to 0-360
  let h = ((heading % 360) + 360) % 360;
  // Each mountain spans 15°, but centered on its angle
  // Mountain i starts at angle[i] - 7.5°
  for (let i = 0; i < 24; i++) {
    const center = MOUNTAINS_24[i].angle;
    const prevCenter = MOUNTAINS_24[(i - 1 + 24) % 24].angle;
    const boundary = (center + prevCenter) / 2;
    if (prevCenter > center) {
      // Wraparound case around 0°
      if (h >= (boundary + 360) / 2 || h < boundary) {
        return MOUNTAINS_24[i];
      }
    }
  }

  // Simpler approach: find nearest mountain
  let best = MOUNTAINS_24[0];
  let bestDist = 360;
  for (const m of MOUNTAINS_24) {
    let dist = Math.abs(h - m.angle);
    if (dist > 180) dist = 360 - dist;
    if (dist < 7.5) return m;
    if (dist < bestDist) { bestDist = dist; best = m; }
  }
  return best;
}

/**
 * Get the opposite mountain (坐 vs 向).
 * The opposite is 180° away (12 positions in the 24-mountain array).
 */
function getOppositeMountain(mountain) {
  const idx = MOUNTAINS_24.indexOf(mountain);
  if (idx === -1) return mountain;
  const oppIdx = (idx + 12) % 24;
  return MOUNTAINS_24[oppIdx];
}

/**
 * Get the trigram associated with a compass direction.
 */
function getDirectionTrigram(heading) {
  const m = headingToMountain(heading);
  return m.trigram;
}

/**
 * Get the eight-trigram house (八宅) for a given sitting direction.
 */
function getEightHouse(sittingMountain) {
  const sittingTrigram = sittingMountain.trigram;
  // 八宅: 乾(6) 坎(1) 艮(8) 震(3) 巽(4) 离(9) 坤(2) 兑(7)
  const houseMap = {
    "乾": { name:"乾宅", element:"金", group:"西四宅" },
    "坤": { name:"坤宅", element:"土", group:"西四宅" },
    "艮": { name:"艮宅", element:"土", group:"西四宅" },
    "兑": { name:"兑宅", element:"金", group:"西四宅" },
    "坎": { name:"坎宅", element:"水", group:"东四宅" },
    "离": { name:"离宅", element:"火", group:"东四宅" },
    "震": { name:"震宅", element:"木", group:"东四宅" },
    "巽": { name:"巽宅", element:"木", group:"东四宅" }
  };
  return houseMap[sittingTrigram] || { name:"未知", element:"—", group:"—" };
}

// --- NINE PALACES FLYING STARS ---

/**
 * Build a complete analysis of the nine palaces for a given year.
 */
function analyzeNinePalaces(year) {
  const centralStar = getAnnualCentralStar(year);
  const chart = buildFullStarChart(centralStar);
  const results = [];

  for (const [key, palace] of Object.entries(PALACES)) {
    const flyingStar = chart[key];
    const starInfo = FLYING_STARS[flyingStar];
    const baseStar = palace.baseStar;

    // Determine combined quality
    let quality, suggestion;
    const baseStarInfo = FLYING_STARS[baseStar];
    const combined = baseStarInfo.auspicious && starInfo.auspicious ? "大吉" :
                     !baseStarInfo.auspicious && !starInfo.auspicious ? "大凶" :
                     starInfo.auspicious ? "吉" : "平";

    // Specific suggestions
    if (flyingStar === 5) {
      suggestion = "五黄大凶，宜静不宜动。可放金属风铃或六帝钱化解。";
      quality = "大凶";
    } else if (flyingStar === 2) {
      suggestion = "二黑病符星，注意身体健康。放铜葫芦或金属物品化解。";
      quality = "凶";
    } else if (flyingStar === 8) {
      suggestion = "八白当旺正财星，宜在此方位办公或安床，利财运。";
      quality = "大吉";
    } else if (flyingStar === 9) {
      suggestion = "九紫喜庆星，宜在此方位放红色物品催旺桃花和姻缘。";
      quality = "大吉";
    } else if (flyingStar === 4) {
      suggestion = "四绿文昌星，宜做书房或放书桌，有利学业考试。";
      quality = "吉";
    } else if (flyingStar === 1) {
      suggestion = "一白桃花星，利人际关系和官运。可放水养植物旺人缘。";
      quality = "吉";
    } else if (flyingStar === 6) {
      suggestion = "六白武曲星，利偏财和事业权威。可放金属摆件。";
      quality = "吉";
    } else if (flyingStar === 3) {
      suggestion = "三碧是非星，注意口舌争执。可放红色物品化解。";
      quality = "凶";
    } else if (flyingStar === 7) {
      suggestion = "七赤破军星，注意破财盗窃。宜静不宜动。";
      quality = "凶";
    } else {
      suggestion = combined === "大吉" ? "吉位，宜常用。" : "一般位置，顺其自然。";
      quality = combined;
    }

    results.push({
      key, palace, flyingStar, starInfo, quality, suggestion
    });
  }

  return {
    year,
    yearStemBranch: calcYearStemBranch(year).full,
    centralStar,
    centralStarInfo: FLYING_STARS[centralStar],
    palaces: results
  };
}

// --- CORNER DEFICIENCY DETECTION ---

/**
 * Analyze corner deficiency based on palace area ratios.
 * areas: {SE, S, SW, E, C, W, NE, N, NW} each 0-1 ratio of standard
 * Returns array of deficiency findings.
 */
function analyzeDeficiency(areas) {
  const findings = [];
  const threshold = 0.6; // below 60% of standard = deficient

  const personMapping = {
    "NW": "男主人/父亲",
    "SW": "女主人/母亲",
    "E": "长子",
    "SE": "长女",
    "N": "中子",
    "S": "中女",
    "NE": "少男",
    "W": "少女"
  };

  for (const [key, ratio] of Object.entries(areas)) {
    if (ratio < threshold && key !== "C") {
      const remedy = REMEDIES["缺角"][key];
      findings.push({
        position: key,
        palace: PALACES[key],
        ratio: Math.round(ratio * 100),
        affectedPerson: personMapping[key] || key + "位",
        remedy: remedy || { item:"摆件", reason:"补足气场" }
      });
    }
  }
  return findings;
}

// --- AUSPICIOUS DATE FINDER ---

/**
 * Find auspicious dates in a given month for a user.
 * userBirth: { year, month, day }
 */
function findAuspiciousDates(userBirth, targetYear, targetMonth) {
  // Calculate user's day stem from birth date
  const birthDSB = calcDayStemBranch(userBirth.year, userBirth.month, userBirth.day);
  const userDayStem = birthDSB.stem;

  // Find noble days and wenchang days
  const nobleDays = findNobleDays(userDayStem, targetMonth, targetYear);
  const wenchangDays = findWenchangDays(userDayStem, targetMonth, targetYear);

  // Get monthly almanac
  const monthAlmanac = MONTHLY_ALMANAC_2026.find(m => m.month === targetMonth);

  // Build full date list
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const dates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dsb = calcDayStemBranch(targetYear, targetMonth, d);
    const isNoble = nobleDays.some(nd => nd.day === d);
    const isWenchang = wenchangDays.some(wd => wd.day === d);

    let recommendation = "普通";
    if (isNoble && isWenchang) recommendation = "上吉";
    else if (isNoble) recommendation = "吉·贵人";
    else if (isWenchang) recommendation = "吉·文昌";

    // Check clash with user's earthly branch
    const userBranch = birthDSB.branch;
    const dayBranch = dsb.branch;
    const clashes = {
      "子":"午","丑":"未","寅":"申","卯":"酉","辰":"戌","巳":"亥",
      "午":"子","未":"丑","申":"寅","酉":"卯","戌":"辰","亥":"巳"
    };
    if (clashes[userBranch] === dayBranch) {
      recommendation = "凶·冲煞";
    }

    dates.push({
      day: d,
      stemBranch: dsb.full,
      stem: dsb.stem,
      branch: dsb.branch,
      recommendation,
      isNoble, isWenchang,
      monthAuspicious: monthAlmanac ? monthAlmanac.auspicious : [],
      monthInauspicious: monthAlmanac ? monthAlmanac.inauspicious : []
    });
  }

  return {
    userDayStem,
    userBranch: birthDSB.branch,
    nobleDays,
    wenchangDays,
    monthAlmanac,
    dates,
    birthInfo: birthDSB
  };
}

// --- FIVE ELEMENTS COLOR & PLANT ADVISOR ---

/**
 * Get color palette and plant recommendations for a direction/element.
 */
function getElementRecommendations(element) {
  const elem = FIVE_ELEMENTS[element];
  const plants = PLANT_RECOMMENDATIONS[element];
  const cycle = ELEMENT_CYCLE[element];

  return {
    element,
    colors: elem.colors,
    colorName: elem.color,
    direction: elem.direction,
    season: elem.season,
    plants,
    generates: cycle.generates,
    overcomes: cycle.overcomes,
    generatedBy: cycle.generatedBy,
    overcomeBy: cycle.overcomeBy
  };
}

/**
 * Get recommendations based on a given compass direction.
 */
function getDirectionRecommendations(heading) {
  const mountain = headingToMountain(heading);
  const element = mountain.element;
  return {
    mountain,
    element,
    recommendations: getElementRecommendations(element),
    trigram: mountain.trigram
  };
}

// --- COMBINED HOUSE ANALYSIS ---

/**
 * Full analysis combining sitting direction, year, and basic floor plan info.
 */
function fullHouseAnalysis(sittingHeading, areas) {
  const sittingMountain = headingToMountain(sittingHeading);
  const facingMountain = getOppositeMountain(sittingMountain);
  const house = getEightHouse(sittingMountain);
  const annualAnalysis = analyzeNinePalaces(CURRENT_YEAR);
  const deficiencyAnalysis = areas ? analyzeDeficiency(areas) : [];
  const directionRecs = getDirectionRecommendations(sittingHeading);

  return {
    sitting: sittingMountain,
    facing: facingMountain,
    house,
    annualStars: annualAnalysis,
    deficiencies: deficiencyAnalysis,
    elementRecommendations: directionRecs
  };
}
