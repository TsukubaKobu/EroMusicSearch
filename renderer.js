const modeSelect = document.getElementById('modeSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const mirrorCheck = document.getElementById('mirrorCheck');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('errorBox');
const resultsTable = document.getElementById('resultsTable');
const noResults = document.getElementById('noResults');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const tableBody = document.getElementById('tableBody');

// Always read from the actual DOM element to avoid stale state on reload
function getCurrentMode() {
  const [s, m] = modeSelect.value.split('|');
  return { source: s, mode: m };
}

function updateMirrorVisibility() {
  const { source } = getCurrentMode();
  mirrorCheck.closest('.mirror-label').classList.toggle('hidden', source !== 'erogamescape');
}

modeSelect.addEventListener('change', () => {
  hideResults();
  updateMirrorVisibility();
  searchInput.focus();
});

updateMirrorVisibility();

const performSearch = async () => {
  const term = searchInput.value.trim();
  if (!term) return;

  hideResults();
  errorBox.classList.add('hidden');
  loader.classList.remove('hidden');
  searchBtn.disabled = true;

  try {
    const { source, mode } = getCurrentMode();
    const mirrorMode = mirrorCheck.checked;
    const results = await window.api.searchDatabase({ source, mode, term, mirrorMode });
    if (results && results.length > 0) {
      renderTable(results);
    } else {
      noResults.classList.remove('hidden');
    }
  } catch (error) {
    errorBox.textContent = `エラー: ${error.message || error}`;
    errorBox.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    searchBtn.disabled = false;
  }
};

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') performSearch();
});

function hideResults() {
  resultsTable.classList.add('hidden');
  noResults.classList.add('hidden');
  tableHeaderRow.innerHTML = '';
  tableBody.innerHTML = '';
}

function renderTable(data) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);

  tableHeaderRow.innerHTML = '';
  headers.forEach(h => {
    const th = document.createElement('th');
    if (h === 'workName') th.textContent = '作品';
    else if (h === 'category') th.textContent = '分類';
    else if (h === 'musicName') th.textContent = '楽曲';
    else th.textContent = h;
    tableHeaderRow.appendChild(th);
  });

  tableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach(h => {
      const td = document.createElement('td');
      td.textContent = row[h];
      td.title = 'Click to copy';
      td.addEventListener('click', () => {
        navigator.clipboard.writeText(td.textContent).then(() => {
          td.classList.add('copied');
          setTimeout(() => td.classList.remove('copied'), 500);
        });
      });
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  resultsTable.classList.remove('hidden');
}
