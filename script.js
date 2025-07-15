// Konstanten
const STORAGE_PREFIX = 'scoreboard_';
const MAX_TEAMS = 15;
const MIN_TEAMS = 2;

// Vordefinierte Teamfarben
const TEAM_COLORS = [
  '#ff0000', '#0000ff', '#00ff00', '#ffff00',
  '#ff00ff', '#00ffff', '#00ffff', '#ff8000', '#8000ff',
  '#00ff80', '#ff0080', '#808000', '#0080ff',
  '#800000', '#008000', '#000080', '#ffa500'
];

// App-Zustand
const appState = {
  teams: [],
  timerInterval: null,
  totalSeconds: 0,
  lastSaveKey: null,
  isTimerRunning: false,
  colorPickerTarget: null,
  autoSaveTimeout: null // NEU: Für Auto-Save-Feedback
};

// DOM-Elemente initialisieren
const elements = {
  scoreboard: document.getElementById('scoreboard'),
  timer: document.getElementById('timer'),
  timerBtn: document.getElementById('timerBtn'),
  lastSavedModal: document.getElementById('lastSavedModal'), // Jetzt im Modal
  colorPickerDialog: document.getElementById('colorPickerDialog'),
  colorPreview: document.getElementById('colorPreview'),
  colorPalette: document.getElementById('colorPalette'),
  customColor: document.getElementById('customColor'),
  autoSaveFeedback: document.getElementById('autoSaveFeedback'), // NEU: Auto-Save-Feedback-Element

  // MODAL-ELEMENTE
  saveLoadModal: document.getElementById('saveLoadModal'),
  openSaveLoadModalBtn: document.getElementById('openSaveLoadModalBtn'),
  closeSaveLoadModal: document.getElementById('closeSaveLoadModal'),
  saveNameModal: document.getElementById('saveNameModal'),
  gameNoteModal: document.getElementById('gameNoteModal'),
  saveGameModalBtn: document.getElementById('saveGameModalBtn'),
  savedGamesModal: document.getElementById('savedGamesModal'),
  deleteGameModalBtn: document.getElementById('deleteGameModalBtn'),
  loadGameModalBtn: document.getElementById('loadGameModalBtn')
};

// Event-Listener
document.addEventListener('DOMContentLoaded', initApp);
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
document.getElementById('addTeamBtn').addEventListener('click', addTeam);
document.getElementById('timerBtn').addEventListener('click', toggleTimer);
document.getElementById('resetBtn').addEventListener('click', resetGame);

// Event-Listener für das Modal
elements.openSaveLoadModalBtn.addEventListener('click', openSaveLoadModal);
elements.closeSaveLoadModal.addEventListener('click', closeSaveLoadModal);
elements.saveGameModalBtn.addEventListener('click', saveGame);
elements.loadGameModalBtn.addEventListener('click', loadGame);
elements.deleteGameModalBtn.addEventListener('click', deleteGame);

// Event-Listener für Color Picker
document.getElementById('applyColorBtn').addEventListener('click', applyTeamColor);
document.getElementById('cancelColorBtn').addEventListener('click', closeColorPicker);
elements.customColor.addEventListener('input', updateColorPreview);

/**
 * Initialisiert die App
 */
function initApp() {
  initializeDarkMode();
  loadSavedGames();
  initColorPalette();
  createTeam("Team 1", 0, TEAM_COLORS[0]);
  createTeam("Team 2", 0, TEAM_COLORS[1]);
  if (appState.lastSaveKey) {
    elements.saveNameModal.value = appState.lastSaveKey;
    showLastSaved(appState.lastSaveKey);
  }
}

/**
 * Initialisiert die Farbpalette für den Color Picker
 */
function initColorPalette() {
  elements.colorPalette.innerHTML = '';
  
  TEAM_COLORS.forEach(color => {
    const colorOption = document.createElement('div');
    colorOption.className = 'color-option';
    colorOption.style.backgroundColor = color;
    colorOption.dataset.color = color;
    
    colorOption.addEventListener('click', function() {
      selectColorOption(this);
      elements.customColor.value = color;
      updateColorPreview();
    });
    
    elements.colorPalette.appendChild(colorOption);
  });
}

/**
 * Erstellt ein neues Team
 * @param {string} name - Name des Teams
 * @param {number} score - Anfangspunktestand (Standard: 0)
 * @param {string} color - Teamfarbe (Standard: zufällige Farbe)
 */
function createTeam(name = "Team", score = 0, color = null) {
  if (appState.teams.length >= MAX_TEAMS) return;
  
  const id = Date.now() + Math.random();
  
  if (!color) {
    const usedColors = appState.teams.map(team => team.color);
    color = TEAM_COLORS.find(c => !usedColors.includes(c)) || 
            TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];
  }
  
  appState.teams.push({ id, name, score, color });
  renderTeams();
  autoSave();
}

/**
 * Rendert alle Teams im Scoreboard
 */
function renderTeams() {
  elements.scoreboard.innerHTML = "";
  
  appState.teams.forEach(team => {
    const teamElement = document.createElement("div");
    teamElement.className = "team";
    teamElement.style.borderTopColor = team.color;
    
    const removeButton = appState.teams.length > MIN_TEAMS 
      ? `<button class="remove" data-id="${team.id}">❌</button>` 
      : "";
    
    teamElement.innerHTML = `
      <div class="team-color-indicator" style="background-color: ${team.color}" data-id="${team.id}"></div>
      ${removeButton}
      <input class="team-name" value="${team.name}" data-id="${team.id}">
      <div class="score" id="score-${team.id}">${team.score}</div>
      <button class="btn-plus" data-id="${team.id}" data-action="increment">➕</button>
      <button class="btn-minus" data-id="${team.id}" data-action="decrement">➖</button>
    `;
    
    // Event-Listener für Team-Inputs und Buttons
    const nameInput = teamElement.querySelector('.team-name');
    nameInput.addEventListener('change', (e) => {
      renameTeam(team.id, e.target.value);
    });
    
    const colorIndicator = teamElement.querySelector('.team-color-indicator');
    colorIndicator.addEventListener('click', () => {
      openColorPicker(team.id, team.color);
    });
    
    const removeBtn = teamElement.querySelector('.remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => removeTeam(team.id));
    }
    
    const buttons = teamElement.querySelectorAll('button[data-action]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const delta = action === 'increment' ? 1 : -1;
        changeScore(team.id, delta);
      });
    });
    
    elements.scoreboard.appendChild(teamElement);
  });
}

/**
 * Ändert den Punktestand eines Teams
 * @param {number} id - ID des Teams
 * @param {number} delta - Punkte zu addieren/subtrahieren
 */
function changeScore(id, delta) {
  const team = appState.teams.find(t => t.id === id);
  if (!team) return;
  
  team.score = Math.max(0, team.score + delta);
  const scoreElement = document.getElementById(`score-${id}`); // Score Element holen
  scoreElement.textContent = team.score;
  
  // NEU: Animation triggern
  scoreElement.classList.remove('animate-pulse'); // Klasse entfernen, falls schon da
  void scoreElement.offsetWidth; // Reflow erzwingen
  scoreElement.classList.add('animate-pulse'); // Klasse hinzufügen für Animation
  
  autoSave();
}

/**
 * Benennt ein Team um
 * @param {number} id - ID des Teams
 * @param {string} newName - Neuer Name
 */
function renameTeam(id, newName) {
  const team = appState.teams.find(t => t.id === id);
  if (team) {
    team.name = newName;
    autoSave();
  }
}

/**
 * Entfernt ein Team
 * @param {number} id - ID des Teams
 */
function removeTeam(id) {
  if (appState.teams.length <= MIN_TEAMS) return;
  
  appState.teams = appState.teams.filter(t => t.id !== id);
  renderTeams();
  autoSave();
}

/**
 * Fügt ein neues Team hinzu
 */
function addTeam() {
  if (appState.teams.length >= MAX_TEAMS) {
    alert("Maximal 15 Teams erlaubt!");
    return;
  }
  
  createTeam(`Team ${appState.teams.length + 1}`);
}

/**
 * Öffnet den Farbwähler für ein Team
 * @param {number} teamId - ID des Teams
 * @param {string} currentColor - Aktuelle Teamfarbe
 */
function openColorPicker(teamId, currentColor) {
  appState.colorPickerTarget = teamId;
  
  elements.customColor.value = currentColor;
  updateColorPreview();
  
  const colorOptions = elements.colorPalette.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.color === currentColor) {
      option.classList.add('selected');
    }
  });
  
  elements.colorPickerDialog.classList.add('active');
}

/**
 * Wählt eine Farboption aus der Palette aus
 * @param {HTMLElement} selectedOption - Die ausgewählte Farboption
 */
function selectColorOption(selectedOption) {
  const colorOptions = elements.colorPalette.querySelectorAll('.color-option');
  colorOptions.forEach(option => option.classList.remove('selected'));
  selectedOption.classList.add('selected');
}

/**
 * Aktualisiert die Farbvorschau im Farbwähler
 */
function updateColorPreview() {
  elements.colorPreview.style.backgroundColor = elements.customColor.value;
}

/**
 * Wendet die ausgewählte Farbe auf das Team an
 */
function applyTeamColor() {
  if (!appState.colorPickerTarget) return;
  
  const team = appState.teams.find(t => t.id === appState.colorPickerTarget);
  if (team) {
    team.color = elements.customColor.value;
    renderTeams();
    autoSave();
  }
  
  closeColorPicker();
}

/**
 * Schließt den Farbwähler ohne Änderungen
 */
function closeColorPicker() {
  appState.colorPickerTarget = null;
  elements.colorPickerDialog.classList.remove('active');
}

/**
 * Startet oder pausiert den Timer
 */
function toggleTimer() {
  if (appState.isTimerRunning) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
    appState.isTimerRunning = false;
    elements.timerBtn.textContent = "Start";
  } else {
    appState.isTimerRunning = true;
    elements.timerBtn.textContent = "Stop";
    appState.timerInterval = setInterval(() => {
      appState.totalSeconds++;
      updateTimer();
    }, 1000);
  }
}

/**
 * Aktualisiert die Timer-Anzeige
 */
function updateTimer() {
  const minutes = String(Math.floor(appState.totalSeconds / 60)).padStart(2, '0');
  const seconds = String(appState.totalSeconds % 60).padStart(2, '0');
  elements.timer.textContent = `${minutes}:${seconds}`;
}

/**
 * Setzt das Spiel zurück
 */
function resetGame() {
  if (!confirm("Spiel wirklich zurücksetzen?")) return;
  
  appState.teams.forEach(t => t.score = 0);
  appState.totalSeconds = 0;
  
  if (appState.timerInterval) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
    appState.isTimerRunning = false;
    elements.timerBtn.textContent = "Start";
  }
  
  renderTeams();
  updateTimer();
  autoSave();
}

/**
 * Öffnet das Speichern/Laden-Modal
 */
function openSaveLoadModal() {
  elements.saveLoadModal.style.display = 'flex';
  loadSavedGames(); // Lädt die Liste der gespeicherten Spiele jedes Mal neu
  
  if (appState.lastSaveKey) {
    elements.saveNameModal.value = appState.lastSaveKey;
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + appState.lastSaveKey));
      elements.gameNoteModal.value = data.notes || '';
    } catch (e) {
      console.warn("Konnte Notizen für letzten Spielstand nicht laden.");
      elements.gameNoteModal.value = '';
    }
  } else {
    elements.saveNameModal.value = '';
    elements.gameNoteModal.value = '';
  }
  elements.savedGamesModal.value = 'default'; // Setzt das Load-Dropdown zurück
  showLastSaved(appState.lastSaveKey);
}

/**
 * Schließt das Speichern/Laden-Modal
 */
function closeSaveLoadModal() {
  elements.saveLoadModal.style.display = 'none';
}

/**
 * Speichert das aktuelle Spiel
 */
function saveGame() {
  const nameInput = elements.saveNameModal.value.trim();
  if (!nameInput && !appState.lastSaveKey) {
    alert("Bitte einen Namen für den Spielstand eingeben!");
    return;
  }
  
  appState.lastSaveKey = nameInput || appState.lastSaveKey;
  elements.saveNameModal.value = appState.lastSaveKey;
  
  const key = `${STORAGE_PREFIX}${appState.lastSaveKey}`;
  const data = {
    teams: appState.teams,
    totalSeconds: appState.totalSeconds,
    notes: elements.gameNoteModal.value.trim(),
    savedAt: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    loadSavedGames();
    showLastSaved(appState.lastSaveKey);
    // showAutoSaveFeedback(`Spiel "${appState.lastSaveKey}" gespeichert!`); // NEU: explizites Speichern zeigt auch Feedback
    alert(`Spiel "${appState.lastSaveKey}" gespeichert!`); // Beim manuellen Speichern Alert behalten
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    alert("Fehler beim Speichern des Spielstands!");
  }
}

/**
 * Automatisches Speichern
 * Speichert nur, wenn bereits ein LastSaveKey gesetzt ist (also ein Spiel schonmal benannt/geladen wurde)
 */
function autoSave() {
  if (appState.lastSaveKey) {
    const key = `${STORAGE_PREFIX}${appState.lastSaveKey}`;
    const data = {
      teams: appState.teams,
      totalSeconds: appState.totalSeconds,
      notes: elements.gameNoteModal.value.trim(), // Versucht, Notizen aus Modal zu holen
      savedAt: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      loadSavedGames(); // Aktualisiert die Liste im Modal
      showLastSaved(appState.lastSaveKey); // Aktualisiert die Anzeige im Modal
      showAutoSaveFeedback("Automatisch gespeichert!"); // NEU: Feedback anzeigen
    } catch (error) {
      console.error("Fehler beim Auto-Speichern:", error);
    }
  }
}

/**
 * Zeigt Auto-Save Feedback an
 * @param {string} message - Die anzuzeigende Nachricht
 */
function showAutoSaveFeedback(message) {
  elements.autoSaveFeedback.textContent = message;
  elements.autoSaveFeedback.classList.add('show');
  
  if (appState.autoSaveTimeout) {
    clearTimeout(appState.autoSaveTimeout);
  }
  
  appState.autoSaveTimeout = setTimeout(() => {
    elements.autoSaveFeedback.classList.remove('show');
    appState.autoSaveTimeout = null;
  }, 3000); // Nachricht nach 3 Sekunden ausblenden
}

/**
 * Lädt ein gespeichertes Spiel
 */
function loadGame() {
  const selected = elements.savedGamesModal.value;
  if (!selected || selected === "default") {
    alert("Bitte einen Spielstand zum Laden auswählen!");
    return;
  }
  
  try {
    const data = JSON.parse(localStorage.getItem(selected));
    if (!data) return;
    
    if (!confirm("Aktuelles Spiel wird überschrieben. Wirklich laden?")) {
        elements.savedGamesModal.value = "default";
        return;
    }

    appState.teams = data.teams || [];
    
    appState.teams.forEach((team, index) => {
      if (!team.color) {
        team.color = TEAM_COLORS[index % TEAM_COLORS.length];
      }
    });
    
    appState.totalSeconds = data.totalSeconds || 0;
    
    renderTeams();
    updateTimer();
    
    elements.gameNoteModal.value = data.notes || "";
    appState.lastSaveKey = selected.replace(STORAGE_PREFIX, "");
    elements.saveNameModal.value = appState.lastSaveKey;
    
    showLastSaved(appState.lastSaveKey);
    closeSaveLoadModal();
    alert(`Spiel "${appState.lastSaveKey}" erfolgreich geladen!`);

  } catch (error) {
    console.error("Fehler beim Laden:", error);
    alert("Fehler beim Laden des Spielstands!");
  }
}

/**
 * Löscht einen ausgewählten Spielstand
 */
function deleteGame() {
  const selected = elements.savedGamesModal.value;
  if (!selected || selected === "default") {
    alert("Bitte einen Spielstand zum Löschen auswählen!");
    return;
  }

  const nameToDelete = selected.replace(STORAGE_PREFIX, "");
  if (confirm(`Möchten Sie den Spielstand "${nameToDelete}" wirklich löschen?`)) {
    try {
      localStorage.removeItem(selected);
      if (appState.lastSaveKey === nameToDelete) {
        appState.lastSaveKey = null;
        elements.saveNameModal.value = '';
        elements.gameNoteModal.value = '';
      }
      loadSavedGames();
      showLastSaved('');
      alert(`Spiel "${nameToDelete}" erfolgreich gelöscht.`);
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen des Spielstands!");
    }
  }
}

/**
 * Zeigt den letzten Speicherstand an
 * @param {string} name - Name des Speicherstands
 */
function showLastSaved(name) {
  if (name) {
    elements.lastSavedModal.textContent = `Zuletzt bearbeitet: ${name}`;
  } else {
    elements.lastSavedModal.textContent = `Kein Spielstand aktiv`;
  }
}

/**
 * Lädt alle gespeicherten Spiele
 */
function loadSavedGames() {
  elements.savedGamesModal.innerHTML = '<option disabled selected value="default">📂 Spielstand auswählen</option>';
  
  try {
    const savedGames = Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .sort();
    
    savedGames.forEach(key => {
      const name = key.replace(STORAGE_PREFIX, "");
      const data = JSON.parse(localStorage.getItem(key));
      const date = data.savedAt ? formatDate(new Date(data.savedAt)) : '';
      
      const option = document.createElement("option");
      option.value = key;
      option.textContent = date ? `${name} (${date})` : name;
      elements.savedGamesModal.appendChild(option);
    });
  } catch (error) {
    console.error("Fehler beim Laden der Spielstände:", error);
  }
}

/**
 * Formatiert ein Datum
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} Formatiertes Datum
 */
function formatDate(date) {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Schaltet den Dark Mode um
 */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark);
  updateDarkModeButton(isDark);
}

/**
 * Aktualisiert den Dark Mode Button
 * @param {boolean} isDark - Ist Dark Mode aktiviert
 */
function updateDarkModeButton(isDark) {
  const btn = document.getElementById("darkModeToggle");
  btn.textContent = isDark ? "☀️" : "🌙";
}

/**
 * Initialisiert den Dark Mode
 */
function initializeDarkMode() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark-mode");
  updateDarkModeButton(isDark);
}