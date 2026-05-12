// ============================================================
// SECTION: CASTING ENGINE — 三钱法起卦
// ============================================================

/**
 * Cast one line by simulating three coins.
 * Each coin: heads=3 (yang), tails=2 (yin).
 * Returns 6 (老阴), 7 (少阳), 8 (少阴), or 9 (老阳).
 */
function castSingleLine() {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += Math.random() < 0.5 ? 3 : 2;
  }
  return sum; // 6, 7, 8, or 9
}

/**
 * Cast all 6 lines (bottom to top).
 * Returns array of 6 values: index 0 = bottom line (初爻), index 5 = top line (上爻).
 */
function castHexagram() {
  const lines = [];
  for (let i = 0; i < 6; i++) {
    lines.push(castSingleLine());
  }
  return lines;
}

/**
 * Get the classical name for a line (e.g., "初九", "六三", "上六").
 * pos: 0-based index (0=bottom/初爻, 5=top/上爻)
 * value: 6/7/8/9
 */
function getLineName(pos, value) {
  const isYang = (value === 7 || value === 9);
  const yinYang = isYang ? "九" : "六";
  if (pos === 0) return "初" + yinYang;
  if (pos === 5) return "上" + yinYang;
  return yinYang + ["二", "三", "四", "五"][pos - 1];
}

/**
 * Get a description of the line type.
 */
function getLineDescription(value) {
  switch (value) {
    case 6: return "老阴 ⚋ (变爻·阴变阳)";
    case 7: return "少阳 ⚊ (不变)";
    case 8: return "少阴 ⚋ (不变)";
    case 9: return "老阳 ⚊ (变爻·阳变阴)";
  }
  return "";
}

/**
 * Check if a line is yang (7 or 9).
 */
function isYangLine(value) {
  return value === 7 || value === 9;
}

/**
 * Check if a line is changing (6 or 9).
 */
function isChangingLine(value) {
  return value === 6 || value === 9;
}
