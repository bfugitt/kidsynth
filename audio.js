import { CONFIG } from './config.js';

/* * AUDIO ENGINE
 * Handles the Web Audio API connections.
 * Simplified for stability and tone.
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
export const audioCtx = new AudioContext();

// Master Volume to prevent clipping
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.4;
masterGain.connect(audioCtx.destination);

// Effects Chain (Simple Reverb)
const reverbNode = audioCtx.createConvolver();
const reverbGain = audioCtx.createGain();
reverbGain.gain.value = 0.3; // 30% Wet
reverbNode.connect(reverbGain);
reverbGain.connect(masterGain);
masterGain.connect(reverbNode); // Send dry to reverb

// Reverb Impulse Response (Synthetic simplified reverb)
function createImpulse() {
    const rate = audioCtx.sampleRate;
    const length = rate * 2.0; // 2 seconds
    const decay = 2.0;
    const impulse = audioCtx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
        const n = length - i;
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
}
reverbNode.buffer = createImpulse();


// Scales (Pentatonic is great for kids - no wrong notes!)
const SCALES = {
    'pentatonic': [0, 2, 4, 7, 9, 12, 14, 16], // C Major Pentatonic extended
    'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

export class Synthesizer {
    constructor() {
        this.waveform = 'triangle'; // Softer start sound
        this.baseOctave = 4; // C4
    }

    setWaveform(type) {
        // limit to basics for kids
        if(['sine', 'square', 'sawtooth', 'triangle'].includes(type)) {
            this.waveform = type;
        }
    }

    // Convert grid row to frequency
    getFrequency(row) {
        // Invert row (0 is top/high pitch, 7 is bottom/low pitch)
        const invertedRow = (CONFIG.rows - 1) - row;
        
        // Use C Major Pentatonic for beautiful sounds automatically
        const scale = SCALES.pentatonic; 
        // Map row to a MIDI note equivalent roughly
        const rootNote = 60; // Middle C
        const noteIndex = invertedRow % scale.length;
        const midiNote = rootNote + scale[noteIndex];
        
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    playNote(row, duration) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = this.waveform;
        osc.frequency.value = this.getFrequency(row);

        // Envelope (ADSR) - Hardcoded to be snappy but smooth
        const now = audioCtx.currentTime;
        const attack = 0.05;
        const release = 0.3;

        osc.connect(gain);
        gain.connect(masterGain);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration + release);

        osc.start(now);
        osc.stop(now + duration + release + 0.1);
        
        // Clean up node references
        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, (duration + release + 1) * 1000);
    }
}

export const synth = new Synthesizer();
