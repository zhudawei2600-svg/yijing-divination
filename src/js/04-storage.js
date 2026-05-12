// ============================================================
// SECTION: STORAGE ENGINE — localStorage 历史记录管理
// ============================================================

const STORAGE_KEY = "iching-history";
const MAX_HISTORY = 100;

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveReading(result) {
  const entry = {
    id: String(result.timestamp),
    timestamp: result.timestamp,
    dateStr: formatDate(result.timestamp),
    question: result.question,
    lines: result.lines,
    primaryKingWen: result.primaryHex ? result.primaryHex.kingWen : 0,
    primaryName: result.primaryHex ? result.primaryHex.nameZh : "",
    transformedKingWen: result.transformedHex ? result.transformedHex.kingWen : null,
    transformedName: result.transformedHex ? result.transformedHex.nameZh : null,
    changingLineCount: result.changingLines.length
  };

  const history = loadHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return entry;
}

function deleteReading(id) {
  const history = loadHistory().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function clearAllHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

function formatDate(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
