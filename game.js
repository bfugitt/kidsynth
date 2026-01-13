import { CONFIG } from './config.js';

/*
 * GAME MANAGER
 * Handles Badges, LocalStorage, and Progress tracking.
 */

class GameManager {
    constructor() {
        this.storageKey = 'soundGarden_v1';
        this.state = this.loadState();
    }

    // Default empty state
    getInitialState() {
        return {
            notesPlaced: 0,
            maxSimultaneous: 0,
            bpmChanged: false,
            waveformChanged: false,
            unlockedBadges: [], // Array of badge IDs
            gridData: [] // Saved song
        };
    }

    loadState() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : this.getInitialState();
    }

    saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    resetProgress() {
        this.state = this.getInitialState();
        this.saveState();
        location.reload(); // Simplest way to reset UI
    }

    // Call this whenever an action happens in the app
    trackAction(actionType, payload) {
        let earnedNewBadge = false;

        // Update Stats
        if (actionType === 'NOTE_PLACED') this.state.notesPlaced++;
        if (actionType === 'BPM_CHANGED') this.state.bpmChanged = true;
        if (actionType === 'WAVE_CHANGED') this.state.waveformChanged = true;
        if (actionType === 'PLAY_STEP') {
            if (payload.noteCount > this.state.maxSimultaneous) {
                this.state.maxSimultaneous = payload.noteCount;
            }
        }

        // Check Badge Conditions
        CONFIG.badges.forEach(badge => {
            if (!this.state.unlockedBadges.includes(badge.id)) {
                if (badge.condition(this.state)) {
                    this.unlockBadge(badge);
                    earnedNewBadge = true;
                }
            }
        });

        this.saveState();
        return earnedNewBadge;
    }

    unlockBadge(badge) {
        this.state.unlockedBadges.push(badge.id);
        
        // Trigger UI Notification
        const notification = document.getElementById('badge-notification');
        const badgeName = document.getElementById('badge-name');
        const badgeIcon = document.getElementById('badge-icon');
        
        badgeName.textContent = badge.name;
        badgeIcon.textContent = badge.icon;
        
        notification.classList.remove('translate-y-full', 'opacity-0');
        notification.classList.add('translate-y-0', 'opacity-100');
        
        // Play a little success sound
        this.playWinSound();

        setTimeout(() => {
            notification.classList.add('translate-y-full', 'opacity-0');
            notification.classList.remove('translate-y-0', 'opacity-100');
        }, 4000);
    }
    
    playWinSound() {
        // Simple distinct chime
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }
}

export const gameManager = new GameManager();
