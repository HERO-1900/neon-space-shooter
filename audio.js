/**
 * Audio Manager for Neon Space Shooter
 * Uses Web Audio API for synthesized sounds (no external files needed)
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.5;
        this.bgmOscillators = [];
        this.isBGMPlaying = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
        return this.enabled;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // Play a laser/shoot sound
    playShoot() {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // Play explosion sound
    playExplosion(size = 'small') {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        const baseFreq = size === 'large' ? 100 : 200;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.1, this.ctx.currentTime + 0.3);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    // Play power-up collection sound
    playPowerUp() {
        if (!this.enabled || !this.ctx) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
        const now = this.ctx.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now + i * 0.05);
            gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + i * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.2);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.2);
        });
    }

    // Play player hit/damage sound
    playHit() {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    // Play game over sound
    playGameOver() {
        if (!this.enabled || !this.ctx) return;
        
        const notes = [440, 415, 392, 370, 349]; // Descending A minor scale
        const now = this.ctx.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + i * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.3);
        });
        
        this.stopBGM();
    }

    // Start background music
    startBGM() {
        if (!this.enabled || !this.ctx || this.isBGMPlaying) return;
        
        this.isBGMPlaying = true;
        this.playBassLine();
        this.playArpeggio();
    }

    playBassLine() {
        const bassNotes = [65.41, 65.41, 98.00, 65.41, 73.42, 73.42, 98.00, 73.42]; // C, C, G, C, D, D, G, D
        let noteIndex = 0;
        
        const playNextBass = () => {
            if (!this.isBGMPlaying || !this.enabled) return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = bassNotes[noteIndex];
            
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(this.volume * 0.15, this.ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.4);
            
            noteIndex = (noteIndex + 1) % bassNotes.length;
            
            if (this.isBGMPlaying) {
                setTimeout(playNextBass, 400);
            }
        };
        
        playNextBass();
    }

    playArpeggio() {
        const arpNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C major arpeggio
        let noteIndex = 0;
        
        const playNextArp = () => {
            if (!this.isBGMPlaying || !this.enabled) return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = arpNotes[noteIndex];
            
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(this.volume * 0.1, this.ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
            
            noteIndex = (noteIndex + 1) % arpNotes.length;
            
            if (this.isBGMPlaying) {
                setTimeout(playNextArp, 200);
            }
        };
        
        playNextArp();
    }

    stopBGM() {
        this.isBGMPlaying = false;
    }
}

// Create global audio manager instance
const audio = new AudioManager();
