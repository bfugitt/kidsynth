import { CONFIG } from './config.js';
import { synth, audioCtx } from './audio.js';
import { gameManager } from './game.js';

/*
 * MAIN APP CONTROLLER
 * Handles the Grid, Sequencing Logic, and UI interaction.
 */

// DOM Elements
const gridContainer = document.getElementById('grid');
const playBtn = document.getElementById('play-btn');
const tempoSlider = document.getElementById('tempo');
const tempoVal = document.getElementById('tempo-val');
const waveSelector = document.getElementById('waveform');
const clearBtn = document.getElementById('clear-btn');
const resetGameBtn = document.getElementById('reset-game-btn');
const badgeList = document.getElementById('badge-list');

// State
let isPlaying = false;
let currentStep = 0;
let intervalId = null;
let gridState = Array(CONFIG.rows).fill().map(() => Array(CONFIG.cols).fill(false));

// --- Initialization ---

function init() {
    createGrid();
    renderBadges();
    
    // Load saved grid if it exists? 
    // For simplicity, we start fresh grid but keep badges.
    
    // Listeners
    playBtn.addEventListener('click', togglePlay);
    clearBtn.addEventListener('click', clearGrid);
    resetGameBtn.addEventListener('click', () => {
        if(confirm("Are you sure? This will delete all badges!")) {
            gameManager.resetProgress();
        }
    });
    
    tempoSlider.addEventListener('input', (e) => {
        tempoVal.textContent = e.target.value;
        gameManager.trackAction('BPM_CHANGED');
        if (isPlaying) {
            stop();
            play(); // Restart to apply new tempo
        }
    });

    waveSelector.addEventListener('change', (e) => {
        synth.setWaveform(e.target.value);
        gameManager.trackAction('WAVE_CHANGED');
    });
}

// --- Grid UI ---

function createGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${CONFIG.cols}, minmax(0, 1fr))`;
    gridContainer.innerHTML = '';

    for (let r = 0; r < CONFIG.rows; r++) {
        for (let c = 0; c < CONFIG.cols; c++) {
            const cell = document.createElement('div');
            
            // TailWind classes for the "Tile/Pebble" look
            cell.className = `
                aspect-square rounded-full border-2 border-stone-200 
                cursor-pointer transition-all duration-200 ease-out
                hover:scale-110 hover:border-stone-400
                bg-white shadow-sm
            `;
            
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.addEventListener('click', () => toggleCell(r, c, cell));
            gridContainer.appendChild(cell);
        }
    }
}

function toggleCell(r, c, element) {
    const newState = !gridState[r][c];
    gridState[r][c] = newState;

    if (newState) {
        element.style.backgroundColor = CONFIG.colors.activeTile;
        element.style.borderColor = "#788773"; // slightly darker sage
        element.classList.add('shadow-md');
        gameManager.trackAction('NOTE_PLACED');
        
        // Preview sound
        synth.playNote(r, 0.2);
    } else {
        element.style.backgroundColor = "white";
        element.style.borderColor = "#E7E5E4"; // stone-200
        element.classList.remove('shadow-md');
    }
}

function clearGrid() {
    gridState = gridState.map(row => row.map(() => false));
    const cells = gridContainer.children;
    for (let cell of cells) {
        cell.style.backgroundColor = "white";
        cell.style.borderColor = "#E7E5E4";
        cell.classList.remove('shadow-md');
    }
    stop();
}

// --- Sequencer Logic ---

function togglePlay() {
    if (isPlaying) {
        stop();
    } else {
        play();
    }
}

function play() {
    // Resume context if needed (browser policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    isPlaying = true;
    playBtn.textContent = "Stop";
    playBtn.classList.remove('bg-stone-800');
    playBtn.classList.add('bg-red-800');
    
    const bpm = parseInt(tempoSlider.value);
    const msPerStep = (60 / bpm) * 1000 / 4; // 16th notes
    
    intervalId = setInterval(nextStep, msPerStep);
}

function stop() {
    isPlaying = false;
    clearInterval(intervalId);
    playBtn.textContent = "Play";
    playBtn.classList.add('bg-stone-800');
    playBtn.classList.remove('bg-red-800');
    
    // Clear playhead UI
    updatePlayheadUI(-1);
    currentStep = 0;
}

function nextStep() {
    // Play notes for current step
    let activeNotes = 0;
    
    for (let r = 0; r < CONFIG.rows; r++) {
        if (gridState[r][currentStep]) {
            synth.playNote(r, 0.3);
            activeNotes++;
        }
    }

    if (activeNotes > 0) {
        gameManager.trackAction('PLAY_STEP', { noteCount: activeNotes });
    }

    updatePlayheadUI(currentStep);
    renderBadges(); // Check if new badges unlocked

    currentStep++;
    if (currentStep >= CONFIG.cols) {
        currentStep = 0;
    }
}

// --- Visual Updates ---

function updatePlayheadUI(stepIndex) {
    const cells = Array.from(gridContainer.children);
    
    cells.forEach(cell => {
        const c = parseInt(cell.dataset.col);
        const r = parseInt(cell.dataset.row);
        const isActive = gridState[r][c];
        
        // Reset base style
        if (isActive) {
            cell.style.backgroundColor = CONFIG.colors.activeTile;
            cell.style.transform = 'scale(1.0)';
        } else {
            cell.style.backgroundColor = 'white';
        }

        // Apply Playhead highlight
        if (c === stepIndex) {
            cell.style.boxShadow = `0 0 0 4px ${CONFIG.colors.playhead}`;
            if(isActive) {
                cell.style.transform = 'scale(1.15)'; // Pop effect when playing
                cell.style.filter = 'brightness(1.1)';
            }
        } else {
            cell.style.boxShadow = 'none';
            cell.style.filter = 'none';
        }
    });
}

function renderBadges() {
    badgeList.innerHTML = '';
    const unlocked = gameManager.state.unlockedBadges;
    
    CONFIG.badges.forEach(badge => {
        const isUnlocked = unlocked.includes(badge.id);
        const badgeEl = document.createElement('div');
        
        badgeEl.className = `
            flex flex-col items-center justify-center p-2 rounded-lg text-center
            ${isUnlocked ? 'bg-amber-100 text-stone-800 border-2 border-amber-300' : 'bg-stone-100 text-stone-300 border border-stone-200'}
        `;
        
        badgeEl.innerHTML = `
            <div class="text-2xl mb-1 filter ${isUnlocked ? '' : 'grayscale opacity-30'}">${badge.icon}</div>
            <div class="text-xs font-bold leading-tight">${badge.name}</div>
        `;
        
        if(isUnlocked) {
            badgeEl.title = badge.description;
        } else {
             badgeEl.title = "Keep exploring to unlock!";
        }
        
        badgeList.appendChild(badgeEl);
    });
}

// Run
window.addEventListener('load', init);
