// Audio Manager - Handles all game audio
class AudioManager {
    constructor() {
        this.backgroundMusic = [];
        this.soundEffects = {};
        this.currentMusicIndex = 0;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.4;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Initialize background music
            this.backgroundMusic[0] = new Audio('https://soundcloud.com/pixl/moon-theme-hotline-miami-2/download');
            this.backgroundMusic[1] = new Audio('https://soundcloud.com/pixl/void-hotline-miami-2/download');
            
            // Initialize sound effects
            this.soundEffects.death = new Audio('https://soundcloud.com/retro-ambience/synthesized-retro-game/download');
            this.soundEffects.typing = new Audio('https://soundcloud.com/elcarteldelrap/snare-perfect-trap-type-beat/download');
            
            // Set up music properties
            this.backgroundMusic.forEach((music, index) => {
                music.volume = this.musicVolume;
                music.addEventListener('ended', () => this.playNextTrack());
            });
            
            // Set up sound effect properties
            this.soundEffects.death.volume = this.sfxVolume;
            this.soundEffects.typing.volume = this.sfxVolume * 0.4; // Lower volume for typing
            
            this.initialized = true;
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            // Create silent audio objects as fallbacks
            this.createFallbackAudio();
        }
    }

    createFallbackAudio() {
        // Create silent audio objects to prevent errors
        const silentAudio = () => ({
            play: () => Promise.resolve(),
            pause: () => {},
            volume: 0,
            addEventListener: () => {}
        });
        
        this.backgroundMusic = [silentAudio(), silentAudio()];
        this.soundEffects = {
            death: silentAudio(),
            typing: silentAudio()
        };
    }

    async startBackgroundMusic() {
        if (!this.initialized) await this.initialize();
        
        try {
            await this.backgroundMusic[this.currentMusicIndex].play();
        } catch (error) {
            console.warn('Background music playback failed:', error);
        }
    }

    playNextTrack() {
        this.currentMusicIndex = (this.currentMusicIndex + 1) % this.backgroundMusic.length;
        this.startBackgroundMusic();
    }

    async playSound(soundName, pitchVariation = false) {
        if (!this.initialized) await this.initialize();
        
        try {
            const sound = this.soundEffects[soundName];
            if (!sound) return;
            
            // Clone the audio for overlapping sounds
            const soundClone = sound.cloneNode();
            
            if (pitchVariation) {
                // Random pitch between 0.8 and 1.2
                soundClone.playbackRate = 0.8 + Math.random() * 0.4;
            }
            
            await soundClone.play();
        } catch (error) {
            console.warn(`Sound ${soundName} playback failed:`, error);
        }
    }

    stopAllMusic() {
        this.backgroundMusic.forEach(music => {
            music.pause();
            music.currentTime = 0;
        });
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.backgroundMusic.forEach(music => {
            music.volume = this.musicVolume;
        });
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.soundEffects).forEach(sound => {
            sound.volume = this.sfxVolume;
        });
    }
}

// Global audio manager instance
const audioManager = new AudioManager();

