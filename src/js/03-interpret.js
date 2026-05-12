// ============================================================
// SECTION: INTERPRETATION ENGINE — 卦象查找、变爻、卦变
// ============================================================

/**
 * Convert 6 line values to a 6-bit binary value.
 * Yang (7,9) → 1, Yin (6,8) → 0.
 * Bit 0 = line 0 (bottom 初爻), Bit 5 = line 5 (top 上爻).
 */
function linesToBinary(lines) {
  let binary = 0;
  for (let i = 0; i < 6; i++) {
    if (isYangLine(lines[i])) {
      binary |= (1 << i);
    }
  }
  return binary;
}

/**
 * Look up hexagram data from line values.
 */
function lookupHexagram(lines) {
  const binaryValue = linesToBinary(lines);
  const kingWen = BINARY_TO_KINGWEN.get(binaryValue);
  return HEXAGRAM_DATA[kingWen] || null;
}

/**
 * Find indices of changing lines (values 6 or 9).
 * Returns array of 0-based indices, bottom-to-top order.
 */
function findChangingLines(lines) {
  const changing = [];
  for (let i = 0; i < 6; i++) {
    if (isChangingLine(lines[i])) {
      changing.push(i);
    }
  }
  return changing;
}

/**
 * Apply line transformation: old yin(6)→young yang(7), old yang(9)→young yin(8).
 * Returns new lines array representing the transformed hexagram.
 */
function transformLines(lines) {
  return lines.map(v => {
    if (v === 6) return 7;
    if (v === 9) return 8;
    return v;
  });
}

/**
 * Get the transformed (changed) hexagram data.
 * Returns { lines, hexagram } or null if no changing lines.
 */
function getTransformedHexagram(lines) {
  const changingLines = findChangingLines(lines);
  if (changingLines.length === 0) return null;
  const transformed = transformLines(lines);
  const hex = lookupHexagram(transformed);
  return { lines: transformed, hexagram: hex };
}

/**
 * Full interpretation of a casting result.
 * Returns a rich result object.
 */
function interpretResult(question, lines) {
  const primaryHex = lookupHexagram(lines);
  const changingLines = findChangingLines(lines);
  const transformed = getTransformedHexagram(lines);

  return {
    question: question || "",
    lines: lines,
    primaryHex: primaryHex,
    changingLines: changingLines,
    changingLineNames: changingLines.map(i => getLineName(i, lines[i])),
    transformedHex: transformed ? transformed.hexagram : null,
    hasChanges: changingLines.length > 0,
    timestamp: Date.now()
  };
}
