// Music Player Service
class MusicPlayerService {
    constructor() {
        this.audioElement = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = 0.7;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'all', 'one'
        this.callbacks = {}; // Event system for callbacks
        
        // Set initial volume
        this.audioElement.volume = this.volume;
        
        // Load sample tracks
        this.loadSampleTracks();
        
        // Add event listeners to audio element
        this.audioElement.addEventListener('ended', () => this.handleTrackEnded());
        this.audioElement.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.audioElement.addEventListener('volumechange', () => this.handleVolumeChange());
    }
    
    loadSampleTracks() {
        this.playlist = [
            {
                id: 1,
                title: 'Blinding Lights',
                artist: 'The Weeknd',
                album: 'After Hours',
                duration: 201, // 3:21
                cover: 'assets/covers/blinding-lights.jpeg', // placeholder path
                url: 'assets/music/sample1.mp3', // placeholder path
                color: '#E13300'
            },
            {
                id: 2,
                title: 'Bad Guy',
                artist: 'Billie Eilish',
                album: 'When We All Fall Asleep, Where Do We Go?',
                duration: 194, // 3:14
                cover: 'assets/covers/bad-guy.jpeg', // placeholder path
                url: 'assets/music/sample2.mp3', // placeholder path
                color: '#00E1DD'
            },
            {
                id: 3,
                title: 'Shape of You',
                artist: 'Ed Sheeran',
                album: '÷ (Divide)',
                duration: 234, // 3:54
                cover: 'assets/covers/shape-of-you.jpeg', // placeholder path
                url: 'assets/music/sample3.mp3', // placeholder path
                color: '#3300E1'
            },
            {
                id: 4,
                title: 'Don\'t Start Now',
                artist: 'Dua Lipa',
                album: 'Future Nostalgia',
                duration: 183, // 3:03
                cover: 'assets/covers/dont-start-now.jpeg', // placeholder path
                url: 'assets/music/sample4.mp3', // placeholder path
                color: '#E100DD'
            },
            {
                id: 5,
                title: 'Uptown Funk',
                artist: 'Mark Ronson ft. Bruno Mars',
                album: 'Uptown Special',
                duration: 270, // 4:30
                cover: 'assets/covers/uptown-funk.jpeg', // placeholder path
                url: 'assets/music/sample5.mp3', // placeholder path
                color: '#A1E100'
            }
        ];
    }
    
    // Event system methods
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.callbacks[event]) return;
        this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
    
    trigger(event, data) {
        if (!this.callbacks[event]) return;
        this.callbacks[event].forEach(callback => callback(data));
    }
    
    // Event handlers for audio element
    handleTrackEnded() {
        switch (this.repeatMode) {
            case 'one':
                this.seek(0);
                this.play();
                break;
            case 'all':
                this.next();
                break;
            case 'none':
                if (this.currentTrackIndex < this.playlist.length - 1) {
                    this.next();
                } else {
                    this.pause();
                    this.seek(0);
                }
                break;
        }
    }
    
    handleTimeUpdate() {
        const currentTime = this.audioElement.currentTime;
        const duration = this.audioElement.duration || 0;
        const percentage = duration ? (currentTime / duration) * 100 : 0;
        
        this.trigger('onProgressChanged', {
            currentTime,
            duration,
            percentage
        });
    }
    
    handleVolumeChange() {
        this.trigger('onVolumeChanged', this.audioElement.volume);
    }
    
    // Player control methods
    play(index = undefined) {
        if (index !== undefined && index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
            this.loadCurrentTrack();
        }
        
        this.audioElement.play()
            .then(() => {
                this.isPlaying = true;
                this.trigger('onPlayStateChanged', true);
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                this.isPlaying = false;
                this.trigger('onPlayStateChanged', false);
            });
    }
    
    pause() {
        this.audioElement.pause();
        this.isPlaying = false;
        this.trigger('onPlayStateChanged', false);
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    previous() {
        if (this.audioElement.currentTime > 3) {
            // If current time is more than 3 seconds, restart track
            this.seek(0);
        } else {
            // Go to previous track
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadCurrentTrack();
            this.play();
        }
    }
    
    next() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadCurrentTrack();
        this.play();
    }
    
    loadCurrentTrack() {
        const track = this.playlist[this.currentTrackIndex];
        if (track) {
            this.audioElement.src = track.url;
            this.trigger('onTrackChanged', track);
        }
    }
    
    setVolume(volume) {
        volume = Math.min(Math.max(volume, 0), 1);
        this.audioElement.volume = volume;
        this.volume = volume;
    }
    
    seek(time) {
        if (isNaN(this.audioElement.duration)) return;
        
        time = Math.min(Math.max(time, 0), this.audioElement.duration);
        this.audioElement.currentTime = time;
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        return this.isShuffled;
    }
    
    toggleRepeat() {
        switch (this.repeatMode) {
            case 'none':
                this.repeatMode = 'all';
                break;
            case 'all':
                this.repeatMode = 'one';
                break;
            case 'one':
                this.repeatMode = 'none';
                break;
        }
        return this.repeatMode;
    }
    
    // Helper methods
    getProgress() {
        return {
            currentTime: this.audioElement.currentTime,
            duration: this.audioElement.duration || 0,
            percentage: this.audioElement.duration ? (this.audioElement.currentTime / this.audioElement.duration) * 100 : 0
        };
    }
    
    getCurrentTrack() {
        return this.playlist[this.currentTrackIndex];
    }
    
    static formatTime(timeInSeconds) {
        if (isNaN(timeInSeconds)) return '0:00';
        
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Create a single instance and attach to window
window.musicPlayer = new MusicPlayerService();

// For convenience, also expose as a global
const musicPlayer = window.musicPlayer;

// Load sample tracks
document.addEventListener('DOMContentLoaded', function() {
    musicPlayer.loadSampleTracks();
}); 