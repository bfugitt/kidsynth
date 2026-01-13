/* * TEACHER CONFIGURATION FILE
 * Adjust these values to change the difficulty and rewards for the students.
 */

export const CONFIG = {
    // Basic App Settings
    appName: "The Sound Garden",
    defaultBPM: 120,
    minBPM: 60,
    maxBPM: 200,
    
    // Grid Size (8 notes tall, 16 steps wide is standard)
    rows: 8,
    cols: 16,

    // Gamification Settings
    showBadges: true, // Set to false to disable gamification
    resetButtonVisible: true, // Allow students to wipe their progress

    // Badge Definitions (You can add more here!)
    badges: [
        {
            id: 'first_note',
            name: 'Seed Planter',
            description: 'Place your first note on the grid.',
            icon: '🌱',
            condition: (state) => state.notesPlaced >= 1
        },
        {
            id: 'full_column',
            name: 'Harmony Hero',
            description: 'Play 3 notes at the exact same time.',
            icon: '🎵',
            condition: (state) => state.maxSimultaneous >= 3
        },
        {
            id: 'tempo_changer',
            name: 'Time Traveler',
            description: 'Change the speed (BPM) of the song.',
            icon: '🐢/🐇',
            condition: (state) => state.bpmChanged === true
        },
        {
            id: 'shape_shifter',
            name: 'Shape Shifter',
            description: 'Change the sound wave shape.',
            icon: '🌊',
            condition: (state) => state.waveformChanged === true
        },
        {
            id: 'master_composer',
            name: 'Master Gardener',
            description: 'Fill at least 20 spots on the grid.',
            icon: '🌳',
            condition: (state) => state.notesPlaced >= 20
        }
    ],

    // Color Palette (Reggio Inspired Earth Tones)
    colors: {
        activeTile: '#8B9D83', // Sage Green
        inactiveTile: '#E8E6E1', // Paper White
        playhead: '#D4A373',   // Wood/Clay
        background: '#FDFBF7'  // Cream
    }
};
