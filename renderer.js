let currentSource = 'erogamescape';
let currentMode = 'gameToMusic';

const sourceTabs = document.querySelectorAll('.source-tab');
const directionTabs = document.querySelectorAll('.direction-tab');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('errorBox');
const resultsTable = document.getElementById('resultsTable');
const noResults = document.getElementById('noResults');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const tableBody = document.getElementById('tableBody');

// Handle source tab switching
sourceTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sourceTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSource = tab.dataset.source;
    hideResults();
    searchInput.focus();
  });
});

// Handle direction tab switching
directionTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    directionTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;

    if (currentMode === 'gameToMusic') {
      searchInput.placeholder = "Enter work name...";
    } else {
      searchInput.placeholder = "Enter music name...";
    }
    
    hideResults();
    searchInput.focus();
  });
});

// Handle search action
const performSearch = async () => {
  const term = searchInput.value.trim();
  if (!term) return;

  // UI state updates
  hideResults();
  errorBox.classList.add('hidden');
  loader.classList.remove('hidden');
  searchBtn.disabled = true;

  try {
    const results = await window.api.searchDatabase({ source: currentSource, mode: currentMode, term });
    
    if (results && results.length > 0) {
      renderTable(results);
    } else {
      noResults.classList.remove('hidden');
    }
  } catch (error) {
    errorBox.textContent = `Error: ${error}`;
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
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);

  // Create Headers
  tableHeaderRow.innerHTML = '';
  headers.forEach(header => {
    const th = document.createElement('th');
    if (header === 'workName') th.textContent = 'Work Name';
    else if (header === 'category') th.textContent = 'Category';
    else if (header === 'musicName') th.textContent = 'Music Name';
    else th.textContent = header;
    tableHeaderRow.appendChild(th);
  });

  // Create Rows
  tableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach(header => {
      const td = document.createElement('td');
      td.textContent = row[header];
      td.title = "Click to copy";
      
      // Click to copy functionality
      td.addEventListener('click', () => {
        navigator.clipboard.writeText(td.textContent).then(() => {
          td.classList.add('copied');
          setTimeout(() => {
            td.classList.remove('copied');
          }, 500);
        });
      });

      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  resultsTable.classList.remove('hidden');
}
