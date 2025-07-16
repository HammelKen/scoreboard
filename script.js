// Konstanten
const STORAGE_PREFIX = 'scoreboard_';
const MAX_TEAMS = 16;
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
  autoSaveTimeout: null,
  confirmCallback: null,
  initialTeams: [
    { name: "Team 1", score: 0, color: TEAM_COLORS[0] },
    { name: "Team 2", score: 0, color: TEAM_COLORS[1] }
  ]
};

// DOM-Elemente initialisieren
const elements = {
  scoreboard: document.getElementById('scoreboard'),
  timer: document.getElementById('timer'),
  timerBtn: document.getElementById('timerBtn'),
  lastSavedModal: document.getElementById('lastSavedModal'),
  colorPickerDialog: document.getElementById('colorPickerDialog'),
  colorPreview: document.getElementById('colorPreview'),
  colorPalette: document.getElementById('colorPalette'),
  customColor: document.getElementById('customColor'),
  autoSaveFeedback: document.getElementById('autoSaveFeedback'),
  rankingsTableBody: document.querySelector('#rankingsTable tbody'),
  rankingContainer: document.getElementById('rankingContainer'),
  toggleTimerBtn: document.getElementById('toggleTimerBtn'),
  timerContainer: document.getElementById('timerContainer'),
  bulkScoreAmount: document.getElementById('bulkScoreAmount'),
  addBulkScoreBtn: document.getElementById('addBulkScoreBtn'),
  subtractBulkScoreBtn: document.getElementById('subtractBulkScoreBtn'),
  bulkAdjustmentContainer: document.getElementById('bulkAdjustmentContainer'),

  // MODAL-ELEMENTE
  saveLoadModal: document.getElementById('saveLoadModal'),
  openSaveLoadModalBtn: document.getElementById('openSaveLoadModalBtn'),
  closeSaveLoadModal: document.getElementById('closeSaveLoadModal'),
  saveNameModal: document.getElementById('saveNameModal'),
  gameNoteModal: document.getElementById('gameNoteModal'),
  saveGameModalBtn: document.getElementById('saveGameModalBtn'),
  savedGamesModal: document.getElementById('savedGamesModal'),
  deleteGameModalBtn: document.getElementById('deleteGameModalBtn'),
  loadGameModalBtn: document.getElementById('loadGameModalBtn'),
  resetAllDataBtn: document.getElementById('resetAllDataBtn'),
  resetCurrentGameBtn: document.getElementById('resetCurrentGameBtn'),

  // NEU: Ranking Modal Elemente
  rankingsModal: document.getElementById('rankingsModal'),
  closeRankingsModal: document.getElementById('closeRankingsModal'),
  toggleRankingsBtn: document.getElementById('toggleRankingsBtn'),

  // NEU: Bulk Adjustment Modal Elemente
  bulkAdjustmentModal: document.getElementById('bulkAdjustmentModal'),
  closeBulkAdjustmentModal: document.getElementById('closeBulkAdjustmentModal'),
  toggleBulkAdjustmentBtn: document.getElementById('toggleBulkAdjustmentBtn'),

  // Custom Alert/Confirm Modals
  customAlertModal: document.getElementById('customAlertModal'),
  customAlertMessage: document.getElementById('customAlertMessage'),
  customAlertTitle: document.getElementById('customAlertTitle'),
  customAlertOkBtn: document.getElementById('customAlertOkBtn'),
  customConfirmModal: document.getElementById('customConfirmModal'),
  customConfirmMessage: document.getElementById('customConfirmMessage'),
  customConfirmTitle: document.getElementById('customConfirmTitle'),
  customConfirmYesBtn: document.getElementById('customConfirmYesBtn'),
  customConfirmNoBtn: document.getElementById('customConfirmNoBtn'),
};

// Event-Listener
document.addEventListener('DOMContentLoaded', initApp);
document.getElementById('addTeamBtn').addEventListener('click', addTeam);
elements.timerBtn.addEventListener('click', toggleTimer);
elements.resetCurrentGameBtn.addEventListener('click', resetCurrentGame);
elements.resetAllDataBtn.addEventListener('click', resetTeamScores);
elements.toggleTimerBtn.addEventListener('click', toggleTimerDisplay);

// Event-Listener für das Öffnen der neuen Modals
elements.toggleRankingsBtn.addEventListener('click', openRankingsModal);
elements.toggleBulkAdjustmentBtn.addEventListener('click', openBulkAdjustmentModal);

// Event-Listener für das Schließen der neuen Modals
elements.closeRankingsModal.addEventListener('click', closeRankingsModal);
elements.closeBulkAdjustmentModal.addEventListener('click', closeBulkAdjustmentModal);

// Event-Listener für das Speichern/Laden-Modal
elements.openSaveLoadModalBtn.addEventListener('click', openSaveLoadModal);
elements.closeSaveLoadModal.addEventListener('click', closeSaveLoadModal);
elements.saveGameModalBtn.addEventListener('click', saveGame);
elements.loadGameModalBtn.addEventListener('click', loadGame);
elements.deleteGameModalBtn.addEventListener('click', deleteGame);

// Event-Listener für Color Picker
document.getElementById('applyColorBtn').addEventListener('click', applyTeamColor);
document.getElementById('cancelColorBtn').addEventListener('click', closeColorPicker);
elements.customColor.addEventListener('input', updateColorPreview);

// Event-Listener für Custom Alert/Confirm Modals
elements.customAlertOkBtn.addEventListener('click', () => {
  elements.customAlertModal.style.display = 'none';
});
elements.customConfirmYesBtn.addEventListener('click', () => {
  elements.customConfirmModal.style.display = 'none';
  if (appState.confirmCallback) {
    appState.confirmCallback(true);
    appState.confirmCallback = null;
  }
});
elements.customConfirmNoBtn.addEventListener('click', () => {
  elements.customConfirmModal.style.display = 'none';
  if (appState.confirmCallback) {
    appState.confirmCallback(false);
    appState.confirmCallback = null;
  }
});

// Event-Listener für das Schließen der Modale über das 'x'
document.querySelectorAll('.close-button[data-close-modal]').forEach(button => {
  button.addEventListener('click', (event) => {
    const modalType = event.target.dataset.closeModal;
    if (modalType === 'alert') {
      elements.customAlertModal.style.display = 'none';
    } else if (modalType === 'confirm') {
      elements.customConfirmModal.style.display = 'none';
      if (appState.confirmCallback) {
        appState.confirmCallback(false);
        appState.confirmCallback = null;
      }
    }
  });
});

// Event-Listener für Bulk Score Adjustment Buttons
elements.addBulkScoreBtn.addEventListener('click', () => addBulkScore(true));
elements.subtractBulkScoreBtn.addEventListener('click', () => addBulkScore(false));

// Generische Event-Listener zum Schließen von Modals
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});


/**
 * Initialisiert die App
 */
function initApp() {
  loadSavedGames();
  initColorPalette();

  let loadedSuccessfully = false;
  if (appState.lastSaveKey) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + appState.lastSaveKey));
      if (data) {
        appState.teams = data.teams || [];
        appState.totalSeconds = data.totalSeconds || 0;
        elements.saveNameModal.value = appState.lastSaveKey;
        elements.gameNoteModal.value = data.notes || '';
        showLastSaved(appState.lastSaveKey);
        loadedSuccessfully = true;
      }
    } catch (e) {
      console.warn("Konnte letzten Spielstand nicht automatisch laden oder parsen:", e);
      appState.lastSaveKey = null;
    }
  }

  if (!loadedSuccessfully || appState.teams.length === 0) {
    appState.teams = [];
    createTeam(appState.initialTeams[0].name, appState.initialTeams[0].score, appState.initialTeams[0].color);
    createTeam(appState.initialTeams[1].name, appState.initialTeams[1].score, appState.initialTeams[1].color);
  }

  renderTeams();
  renderRankingsTable();
  updateTimer();
  elements.timerContainer.style.display = 'none';
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
  renderRankingsTable();
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
      <input type="number" class="score" value="${team.score}" data-id="${team.id}">
      <button class="btn-plus" data-id="${team.id}" data-action="increment">➕</button>
      <button class="btn-minus" data-id="${team.id}" data-action="decrement">➖</button>
    `;

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

    const scoreInput = teamElement.querySelector('input.score');
    scoreInput.addEventListener('change', (e) => {
      const newScore = parseInt(e.target.value) || 0;
      updateManualScore(team.id, newScore);
      e.target.value = newScore;
    });

    elements.scoreboard.appendChild(teamElement);
  });
}

/**
 * Rendert die Ranglistentabelle basierend auf den Team-Punkten.
 */
function renderRankingsTable() {
  const sortedTeams = [...appState.teams].sort((a, b) => b.score - a.score);
  elements.rankingsTableBody.innerHTML = '';

  if (sortedTeams.length === 0) {
    const row = elements.rankingsTableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 3;
    cell.textContent = "Keine Teams vorhanden.";
    cell.style.textAlign = "center";
    return;
  }

  sortedTeams.forEach((team, index) => {
    const row = elements.rankingsTableBody.insertRow();
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${team.name}</td>
      <td>${team.score}</td>
    `;
  });
}


/**
 * Ändert den Punktestand eines Teams über die Plus/Minus-Buttons
 * @param {number} id - ID des Teams
 * @param {number} delta - Punkte zu addieren/subtrahieren
 */
function changeScore(id, delta) {
  const team = appState.teams.find(t => t.id === id);
  if (!team) return;

  team.score = team.score + delta;
  const scoreInput = document.querySelector(`.team input.score[data-id="${id}"]`);
  if (scoreInput) {
    scoreInput.value = team.score;
    scoreInput.classList.remove('animate-pulse');
    void scoreInput.offsetWidth;
    scoreInput.classList.add('animate-pulse');
  }
  renderRankingsTable();
  autoSave();
}

/**
 * Aktualisiert den Punktestand eines Teams manuell über das Inputfeld
 * @param {number} id - ID des Teams
 * @param {number} newScore - Neuer Punktestand
 */
function updateManualScore(id, newScore) {
  const team = appState.teams.find(t => t.id === id);
  if (team) {
    team.score = newScore;
    renderRankingsTable();
    autoSave();
    const scoreInput = document.querySelector(`.team input.score[data-id="${id}"]`);
    if (scoreInput) {
      scoreInput.classList.remove('animate-pulse');
      void scoreInput.offsetWidth;
      scoreInput.classList.add('animate-pulse');
    }
  }
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
    renderRankingsTable();
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
  renderRankingsTable();
  autoSave();
}

/**
 * Fügt ein neues Team hinzu
 */
function addTeam() {
  if (appState.teams.length >= MAX_TEAMS) {
    showCustomAlert("Maximal 16 Teams erlaubt!");
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
    renderRankingsTable();
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
 * Schaltet die Sichtbarkeit des Timer-Bereichs um.
 */
function toggleTimerDisplay() {
  if (elements.timerContainer.style.display === 'none') {
    elements.timerContainer.style.display = 'flex';
  } else {
    elements.timerContainer.style.display = 'none';
  }
}

/**
 * Setzt den Timer zurück.
 */
function resetCurrentGame() {
  showCustomConfirm("Timer wirklich zurücksetzen?", (result) => {
    if (!result) return;

    appState.totalSeconds = 0;

    if (appState.timerInterval) {
      clearInterval(appState.timerInterval);
      appState.timerInterval = null;
      appState.isTimerRunning = false;
      elements.timerBtn.textContent = "Start";
    }

    updateTimer();
  }, "");
}

/**
 * Setzt NUR die Punkte aller Teams auf 0 zurück.
 */
function resetTeamScores() {
  showCustomConfirm("Möchten Sie die Punkte aller Teams auf 0 zurücksetzen?", (result) => {
    if (result) {
      appState.teams.forEach(t => t.score = 0);
      renderTeams();
      renderRankingsTable();
      autoSave();
      showCustomAlert("Alle Teampunkte wurden auf 0 zurückgesetzt.");
    }
  }, "Punkte zurücksetzen");
}

/**
 * Passt die Punktzahl aller Teams gleichzeitig an.
 * @param {boolean} isAddition - true für Hinzufügen, false für Abziehen.
 */
function addBulkScore(isAddition) {
  const amount = parseInt(elements.bulkScoreAmount.value);

  if (isNaN(amount) || amount <= 0) {
    showCustomAlert("Bitte geben Sie eine positive Zahl als Punktwert ein.");
    return;
  }

  const actionText = isAddition ? "hinzufügen" : "abziehen";
  showCustomConfirm(`Möchten Sie wirklich ${amount} Punkte von allen Teams ${actionText}?`, (result) => {
    if (result) {
      appState.teams.forEach(team => {
        team.score = isAddition ? team.score + amount : team.score - amount;
      });
      renderTeams();
      renderRankingsTable();
      autoSave();
      showCustomAlert(`Es wurden ${amount} Punkte bei allen Teams ${actionText}.`);
    }
  }, "Punkteanpassung");
}

/**
 * Öffnet das Ranking-Modal.
 */
function openRankingsModal() {
  elements.rankingsModal.style.display = 'flex';
}

/**
 * Schließt das Ranking-Modal.
 */
function closeRankingsModal() {
  elements.rankingsModal.style.display = 'none';
}

/**
 * Öffnet das Bulk-Adjustment-Modal.
 */
function openBulkAdjustmentModal() {
  elements.bulkAdjustmentModal.style.display = 'flex';
}

/**
 * Schließt das Bulk-Adjustment-Modal.
 */
function closeBulkAdjustmentModal() {
  elements.bulkAdjustmentModal.style.display = 'none';
}

/**
 * Öffnet das Speichern/Laden-Modal
 */
function openSaveLoadModal() {
  elements.saveLoadModal.style.display = 'flex';
  loadSavedGames();

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
  elements.savedGamesModal.value = 'default';
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
    showCustomAlert("Bitte einen Namen für den Spielstand eingeben!");
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
    showCustomAlert(`Spiel "${appState.lastSaveKey}" gespeichert!`);
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    showCustomAlert("Fehler beim Speichern des Spielstands!");
  }
}

/**
 * Automatisches Speichern
 */
function autoSave() {
  if (appState.lastSaveKey) {
    const key = `${STORAGE_PREFIX}${appState.lastSaveKey}`;
    const data = { teams: appState.teams, totalSeconds: appState.totalSeconds, notes: elements.gameNoteModal.value.trim(), savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      loadSavedGames();
      showLastSaved(appState.lastSaveKey);
      showAutoSaveFeedback("Automatisch gespeichert!");
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
  }, 3000);
}

/**
 * Lädt ein gespeichertes Spiel
 */
function loadGame() {
  const selected = elements.savedGamesModal.value;
  if (!selected || selected === "default") {
    showCustomAlert("Bitte einen Spielstand zum Laden auswählen!");
    return;
  }

  try {
    const data = JSON.parse(localStorage.getItem(selected));
    if (!data) {
        showCustomAlert("Fehler: Spielstand konnte nicht gefunden werden.");
        return;
    }

    showCustomConfirm("Aktuelles Spiel wird überschrieben. Wirklich laden?", (result) => {
        if (!result) {
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
        renderRankingsTable();
        updateTimer();

        elements.gameNoteModal.value = data.notes || "";
        appState.lastSaveKey = selected.replace(STORAGE_PREFIX, "");
        elements.saveNameModal.value = appState.lastSaveKey;

        showLastSaved(appState.lastSaveKey);
        closeSaveLoadModal();
        showCustomAlert(`Spiel "${appState.lastSaveKey}" erfolgreich geladen!`);

    }, "Spiel laden");

  } catch (error) {
    console.error("Fehler beim Laden:", error);
    showCustomAlert("Fehler beim Laden des Spielstands!");
  }
}

/**
 * Löscht einen ausgewählten Spielstand
 */
function deleteGame() {
  const selected = elements.savedGamesModal.value;
  if (!selected || selected === "default") {
    showCustomAlert("Bitte einen Spielstand zum Löschen auswählen!");
    return;
  }

  const nameToDelete = selected.replace(STORAGE_PREFIX, "");
  showCustomConfirm(`Möchten Sie den Spielstand "${nameToDelete}" wirklich löschen?`, (result) => {
    if (result) {
      try {
        localStorage.removeItem(selected);
        if (appState.lastSaveKey === nameToDelete) {
          appState.lastSaveKey = null;
          elements.saveNameModal.value = '';
          elements.gameNoteModal.value = '';
        }
        loadSavedGames();
        showLastSaved(appState.lastSaveKey || '');
        showCustomAlert(`Spiel "${nameToDelete}" erfolgreich gelöscht.`);
      } catch (error) {
        console.error("Fehler beim Löschen:", error);
        showCustomAlert("Fehler beim Löschen des Spielstands!");
      }
    }
  }, "Spiel löschen");
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
      let data;
      try {
        data = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        console.warn(`Fehler beim Parsen des Spielstands "${name}". Überspringe diesen.`);
        return;
      }

      const date = data && data.savedAt ? formatDate(new Date(data.savedAt)) : '';

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
  if (isNaN(date.getTime())) {
    return 'Ungültiges Datum';
  }
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
/**
 * Zeigt ein benutzerdefiniertes Alert-Popup an.
 * @param {string} message - Die Nachricht, die angezeigt werden soll.
 * @param {string} [title="Achtung!"] - Optionaler Titel für das Alert-Fenster.
 */
function showCustomAlert(message, title = "Achtung!") {
  elements.customAlertTitle.textContent = title;
  elements.customAlertMessage.textContent = message;
  elements.customAlertModal.style.display = 'flex';
}

/**
 * Zeigt ein benutzerdefiniertes Confirm-Popup an.
 * @param {string} message - Die Bestätigungsnachricht.
 * @param {function(boolean): void} callback - Callback-Funktion, die mit true (Ja) oder false (Nein) aufgerufen wird.
 * @param {string} [title="Bestätigung erforderlich"] - Optionaler Titel für das Confirm-Fenster.
 */
function showCustomConfirm(message, callback, title = "Bestätigung erforderlich") {
  elements.customConfirmTitle.textContent = title;
  elements.customConfirmMessage.textContent = message;
  appState.confirmCallback = callback;
  elements.customConfirmModal.style.display = 'flex';
}
