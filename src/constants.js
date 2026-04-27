const EGS_URLS = {
  primary: 'https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/sql_for_erogamer_form.php',
  mirror: 'https://koko.kyara.top/sql_for_erogamer_form.php',
};

const ANISON_BASE = 'http://anison.info/data/';

const BANGUMI_BASE = 'https://api.bgm.tv/';
const BANGUMI_UA = 'EroMusicSearch/1.0 (https://github.com/eromusicsearch)';

const RETRY_DELAY_MS = 800;
const TIMEOUT_MS = 15000;
const MAX_WORKS = 3;

function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

const MODES = {
  GAME_TO_MUSIC: 'gameToMusic',
  MUSIC_TO_GAME: 'musicToGame',
};

const SOURCES = {
  EROGAMESCAPE: 'erogamescape',
  BANGUMI: 'bangumi',
  ANISON: 'anison',
};

function toKatakana(str) {
  return str.replace(/[\u3041-\u3096]/g, function (match) {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}

function toHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, function (match) {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

function escapeLike(str) {
  return str.replace(/[\\%_']/g, function (match) {
    switch (match) {
      case '\\': return '\\\\';
      case '%': return '\\%';
      case '_': return '\\_';
      case "'": return "''";
      default: return match;
    }
  });
}

module.exports = {
  EGS_URLS,
  ANISON_BASE,
  BANGUMI_BASE,
  BANGUMI_UA,
  RETRY_DELAY_MS,
  TIMEOUT_MS,
  MAX_WORKS,
  fetchWithTimeout,
  MODES,
  SOURCES,
  toKatakana,
  toHiragana,
  escapeLike,
};
