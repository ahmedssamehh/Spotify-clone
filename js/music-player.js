// Music Player Service - Enhanced with Spotify API Integration
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
        this.spotifyPlayer = null; // Spotify Web Playback SDK player
        this.isSpotifyConnected = false;
        this.deviceId = null;
        
        // Set initial volume
        this.audioElement.volume = this.volume;
        
        // Add event listeners to audio element
        this.audioElement.addEventListener('ended', () => this.handleTrackEnded());
        this.audioElement.addEventListener('timeupdate', () => this.handleTimeUpdate());
        this.audioElement.addEventListener('volumechange', () => this.handleVolumeChange());
        
        // Add error handling for audio element
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio element error:', e);
            this.handleAudioError(e);
        });
        
        // Initialize with sample tracks for fallback
        this.loadSampleTracks();
        
        // Initialize Spotify integration
        this.initSpotify();
    }
    
    // Handle audio errors
    handleAudioError(error) {
        console.error('Audio error:', error);
        const track = this.playlist[this.currentTrackIndex];
        
        // Check if the current track has a fallback URL
        if (track && !track.fallbackUrl) {
            // Add fallback URLs to publicly available audio files
            track.fallbackUrl = this.getFallbackAudioUrl(this.currentTrackIndex);
            console.log('Using fallback URL:', track.fallbackUrl);
            
            // Use the fallback URL
            this.audioElement.src = track.fallbackUrl;
            this.audioElement.load();
            
            // Attempt to play again if it was playing
            if (this.isPlaying) {
                this.audioElement.play().catch(err => {
                    console.error('Failed to play fallback audio:', err);
                });
            }
        }
        
        // Trigger error event for UI updates
        this.trigger('onError', {
            track: track,
            error: error
        });
    }
    
    // Get a fallback audio URL
    getFallbackAudioUrl(index) {
        // Array of public domain audio URLs that can be used as fallbacks
        const fallbackUrls = [
            'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
            'https://samplelib.com/lib/preview/mp3/sample-6s.mp3',
            'https://samplelib.com/lib/preview/mp3/sample-9s.mp3',
            'https://samplelib.com/lib/preview/mp3/sample-12s.mp3',
            'https://samplelib.com/lib/preview/mp3/sample-15s.mp3'
        ];
        
        // Return a URL based on the index, cycling through if needed
        return fallbackUrls[index % fallbackUrls.length];
    }
    
    // Initialize Spotify integration
    async initSpotify() {
        // Check if Spotify API is available
        if (!window.spotifyAPI) {
            console.warn('Spotify API not available. Using local playback only.');
            return;
        }
        
        try {
            // Try to initialize Spotify API connection
            await window.spotifyAPI.init();
            
            // Initialize Spotify Web Playback SDK
            this.initSpotifyPlaybackSDK();
            
            // Load user's saved tracks and playlists
            this.loadUserLibrary();
        } catch (error) {
            console.warn('Spotify authentication required:', error);
            // Continue with local playback
        }
    }
    
    // Initialize Spotify Web Playback SDK
    initSpotifyPlaybackSDK() {
        // Wait for Spotify SDK to be available
        window.onSpotifyWebPlaybackSDKReady = () => {
            const token = window.spotifyAPI?.getToken();
            
            if (!token) {
                console.warn('No Spotify token available. User needs to log in first.');
                return;
            }
            
            this.spotifyPlayer = new Spotify.Player({
                name: 'Spotify Clone Player',
                getOAuthToken: cb => {
                    // Get the current token
                    const currentToken = window.spotifyAPI.getToken();
                    cb(currentToken);
                },
                volume: this.volume
            });
            
            // Error handling
            this.spotifyPlayer.addListener('initialization_error', ({ message }) => {
                console.error('Spotify Player initialization error:', message);
            });
            
            this.spotifyPlayer.addListener('authentication_error', ({ message }) => {
                console.error('Spotify Player authentication error:', message);
                // Try to refresh token or prompt for login
                this.showAuthError('Authentication error: ' + message);
            });
            
            this.spotifyPlayer.addListener('account_error', ({ message }) => {
                console.error('Spotify Player account error:', message);
                this.showAuthError('Account error: ' + message);
            });
            
            this.spotifyPlayer.addListener('playback_error', ({ message }) => {
                console.error('Spotify Player playback error:', message);
            });
            
            // Playback status updates
            this.spotifyPlayer.addListener('player_state_changed', state => {
                if (!state) return;
                
                const { track_window, paused, position, duration, shuffle, repeat_mode } = state;
                const { current_track } = track_window;
                
                // Update current track info
                const track = {
                    id: current_track.id,
                    title: current_track.name,
                    artist: current_track.artists.map(a => a.name).join(', '),
                    album: current_track.album.name,
                    duration: duration / 1000, // Convert ms to seconds
                    cover: current_track.album.images[0]?.url || 'img/default-cover.png',
                    url: `spotify:track:${current_track.id}`,
                    color: '#1DB954' // Spotify green as fallback
                };
                
                // Update player state
                this.isPlaying = !paused;
                this.isShuffled = shuffle;
                this.repeatMode = ['none', 'all', 'one'][repeat_mode];
                
                // Trigger events
                this.trigger('onTrackChanged', track);
                this.trigger('onPlayStateChanged', !paused);
                this.trigger('onShuffleChanged', shuffle);
                this.trigger('onRepeatChanged', this.repeatMode);
                this.trigger('onProgressChanged', {
                    currentTime: position / 1000, // Convert ms to seconds
                    duration: duration / 1000,
                    percentage: (position / duration) * 100
                });
            });
            
            // Ready
            this.spotifyPlayer.addListener('ready', ({ device_id }) => {
                console.log('Spotify Player Ready with Device ID:', device_id);
                this.deviceId = device_id;
                this.isSpotifyConnected = true;
                this.showPlayerReady();
                this.trigger('onSpotifyConnected', {
                    connected: true,
                    deviceId: device_id
                });
                
                // Transfer playback to this device if logged in
                if (window.spotifyAPI.isLoggedIn()) {
                    window.spotifyAPI.transferPlayback(device_id)
                        .then(() => console.log('Playback transferred to this device'))
                        .catch(err => console.error('Error transferring playback:', err));
                }
            });
            
            // Not Ready
            this.spotifyPlayer.addListener('not_ready', ({ device_id }) => {
                console.log('Spotify Player Device ID has gone offline:', device_id);
                this.isSpotifyConnected = false;
                this.trigger('onSpotifyConnected', {
                    connected: false,
                    deviceId: null
                });
            });
            
            // Connect to the player
            this.spotifyPlayer.connect()
                .then(success => {
                    if (!success) {
                        console.error('Failed to connect to Spotify Player');
                    }
                });
        };
    }
    
    // Show player ready notification
    showPlayerReady() {
        const notification = document.getElementById('player-ready');
        if (notification) {
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }
    
    // Show authentication error
    showAuthError(message) {
        console.error('Spotify authentication error:', message);
        // Optional: Show a UI notification to the user
        alert('Spotify authentication error. Please log in again.');
        window.spotifyAPI.logout();
    }
    
    // Load user's library from Spotify
    async loadUserLibrary() {
        try {
            // Get user's saved tracks
            const savedTracks = await window.spotifyAPI.getSavedTracks();
            if (savedTracks && savedTracks.items) {
                // Convert Spotify track objects to our format
                const tracks = savedTracks.items.map(item => ({
                    id: item.track.id,
                    title: item.track.name,
                    artist: item.track.artists.map(a => a.name).join(', '),
                    album: item.track.album.name,
                    duration: item.track.duration_ms / 1000, // Convert ms to seconds
                    cover: item.track.album.images[0]?.url || 'img/default-cover.png',
                    url: `spotify:track:${item.track.id}`,
                    color: '#1DB954' // Spotify green as fallback
                }));
                
                // Replace sample tracks with real tracks
                if (tracks.length > 0) {
                    this.playlist = tracks;
                    this.trigger('onPlaylistChanged', this.playlist);
                }
            }
        } catch (error) {
            console.error('Error loading Spotify library:', error);
            // Continue with sample tracks
        }
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
                url: 'assets/music/sample1.mp3', // local path
                fallbackUrl: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3', // fallback
                color: '#E13300'
            },
            {
                id: 2,
                title: 'Bad Guy',
                artist: 'Billie Eilish',
                album: 'When We All Fall Asleep, Where Do We Go?',
                duration: 194, // 3:14
                cover: 'assets/covers/bad-guy.jpeg', // placeholder path
                url: 'assets/music/sample2.mp3', // local path
                fallbackUrl: 'https://samplelib.com/lib/preview/mp3/sample-6s.mp3', // fallback
                color: '#00E1DD'
            },
            {
                id: 3,
                title: 'Shape of You',
                artist: 'Ed Sheeran',
                album: '÷ (Divide)',
                duration: 234, // 3:54
                cover: 'assets/covers/shape-of-you.jpeg', // placeholder path
                url: 'assets/music/sample3.mp3', // local path
                fallbackUrl: 'https://samplelib.com/lib/preview/mp3/sample-9s.mp3', // fallback
                color: '#3300E1'
            },
            {
                id: 4,
                title: 'Don\'t Start Now',
                artist: 'Dua Lipa',
                album: 'Future Nostalgia',
                duration: 183, // 3:03
                cover: 'assets/covers/dont-start-now.jpeg', // placeholder path
                url: 'assets/music/sample4.mp3', // local path
                fallbackUrl: 'https://samplelib.com/lib/preview/mp3/sample-12s.mp3', // fallback
                color: '#E100DD'
            },
            {
                id: 5,
                title: 'Uptown Funk',
                artist: 'Mark Ronson ft. Bruno Mars',
                album: 'Uptown Special',
                duration: 270, // 4:30
                cover: 'assets/covers/uptown-funk.jpeg', // placeholder path
                url: 'assets/music/sample5.mp3', // local path
                fallbackUrl: 'https://samplelib.com/lib/preview/mp3/sample-15s.mp3', // fallback
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
    async play(index = undefined) {
        // If index is provided, update current track
        if (index !== undefined && index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
            
            // If using Spotify, load the track from Spotify
            if (this.isSpotifyConnected && this.deviceId) {
                const track = this.playlist[this.currentTrackIndex];
                
                if (track.id && track.url.startsWith('spotify:track:')) {
                    try {
                        // Play the track using Spotify Connect API
                        await window.spotifyAPI.request(
                            'me/player/play', 
                            'PUT',
                            {
                                device_id: this.deviceId,
                                uris: [track.url]
                            }
                        );
                        
                        this.isPlaying = true;
                        this.trigger('onPlayStateChanged', true);
                        this.trigger('onTrackChanged', track);
                        return;
                    } catch (error) {
                        console.error('Error playing track with Spotify:', error);
                        // Fall back to local playback
                    }
                }
            }
            
            // If Spotify playback failed or not available, use local audio
            this.loadCurrentTrack();
        }
        
        // If already using Spotify Web Playback SDK
        if (this.isSpotifyConnected && this.spotifyPlayer) {
            try {
                await this.spotifyPlayer.resume();
                this.isPlaying = true;
                this.trigger('onPlayStateChanged', true);
                return;
            } catch (error) {
                console.error('Error resuming Spotify playback:', error);
                // Fall back to local audio
            }
        }
        
        // Use local audio element as fallback
        try {
            await this.audioElement.play();
            this.isPlaying = true;
            this.trigger('onPlayStateChanged', true);
        } catch (error) {
            console.error('Error playing audio:', error);
            
            // Try with fallback URL if available
            const track = this.playlist[this.currentTrackIndex];
            if (track && track.fallbackUrl) {
                console.log('Trying fallback URL:', track.fallbackUrl);
                this.audioElement.src = track.fallbackUrl;
                this.audioElement.load();
                
                try {
                    await this.audioElement.play();
                    this.isPlaying = true;
                    this.trigger('onPlayStateChanged', true);
                } catch (fallbackError) {
                    console.error('Error playing fallback audio:', fallbackError);
                    this.isPlaying = false;
                    this.trigger('onPlayStateChanged', false);
                    this.trigger('onError', {
                        track: track,
                        error: fallbackError
                    });
                }
            } else {
                this.isPlaying = false;
                this.trigger('onPlayStateChanged', false);
            }
        }
    }
    
    async pause() {
        // If using Spotify Web Playback SDK
        if (this.isSpotifyConnected && this.spotifyPlayer) {
            try {
                await this.spotifyPlayer.pause();
                this.isPlaying = false;
                this.trigger('onPlayStateChanged', false);
                return;
            } catch (error) {
                console.error('Error pausing Spotify playback:', error);
                // Fall back to local audio
            }
        }
        
        // Use local audio element as fallback
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
    
    async previous() {
        // Check if we should restart the track or go to the previous one
        const currentTime = this.isSpotifyConnected 
            ? await this.getCurrentSpotifyPosition() 
            : this.audioElement.currentTime;
            
        if (currentTime > 3) {
            // If current time is more than 3 seconds, restart track
            this.seek(0);
        } else {
            // Go to previous track
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
            
            // If using Spotify Web Playback SDK
            if (this.isSpotifyConnected && this.deviceId) {
                const track = this.playlist[this.currentTrackIndex];
                
                if (track.id && track.url.startsWith('spotify:track:')) {
                    try {
                        // Play the previous track using Spotify
                        await window.spotifyAPI.request(
                            'me/player/play', 
                            'PUT',
                            {
                                device_id: this.deviceId,
                                uris: [track.url]
                            }
                        );
                        return;
                    } catch (error) {
                        console.error('Error playing previous track with Spotify:', error);
                        // Fall back to local playback
                    }
                }
            }
            
            // Local playback fallback
            this.loadCurrentTrack();
            this.play();
        }
    }
    
    async next() {
        // Go to next track
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        
        // If using Spotify Web Playback SDK
        if (this.isSpotifyConnected && this.deviceId) {
            const track = this.playlist[this.currentTrackIndex];
            
            if (track.id && track.url.startsWith('spotify:track:')) {
                try {
                    // Play the next track using Spotify
                    await window.spotifyAPI.request(
                        'me/player/play', 
                        'PUT',
                        {
                            device_id: this.deviceId,
                            uris: [track.url]
                        }
                    );
                    return;
                } catch (error) {
                    console.error('Error playing next track with Spotify:', error);
                    // Fall back to local playback
                }
            }
        }
        
        // Local playback fallback
        this.loadCurrentTrack();
        this.play();
    }
    
    loadCurrentTrack() {
        const track = this.playlist[this.currentTrackIndex];
        if (track) {
            // Try the primary URL first
            if (track.url && !track.url.startsWith('spotify:')) {
                this.audioElement.src = track.url;
                
                // Add error handler for this specific load
                const errorHandler = () => {
                    console.log('Error loading track, trying fallback URL');
                    
                    // If primary URL fails, try the fallback
                    if (track.fallbackUrl) {
                        this.audioElement.src = track.fallbackUrl;
                        this.audioElement.load();
                    }
                    
                    // Remove this one-time handler
                    this.audioElement.removeEventListener('error', errorHandler);
                };
                
                this.audioElement.addEventListener('error', errorHandler, { once: true });
                this.audioElement.load();
            }
            // If it's a Spotify URL or no URL is available, but we have a fallback
            else if (track.fallbackUrl) {
                this.audioElement.src = track.fallbackUrl;
                this.audioElement.load();
            }
            
            this.trigger('onTrackChanged', track);
        }
    }
    
    async setVolume(volume) {
        volume = Math.min(Math.max(volume, 0), 1);
        
        // Update Spotify player volume if connected
        if (this.isSpotifyConnected && this.spotifyPlayer) {
            try {
                await this.spotifyPlayer.setVolume(volume);
            } catch (error) {
                console.error('Error setting Spotify volume:', error);
            }
        }
        
        // Always update local audio element for consistency
        this.audioElement.volume = volume;
        this.volume = volume;
    }
    
    async seek(time) {
        // If using Spotify
        if (this.isSpotifyConnected && this.spotifyPlayer) {
            try {
                // Spotify expects position in milliseconds
                await this.spotifyPlayer.seek(time * 1000);
                return;
            } catch (error) {
                console.error('Error seeking in Spotify playback:', error);
                // Fall back to local audio
            }
        }
        
        // For local audio
        if (isNaN(this.audioElement.duration)) return;
        
        time = Math.min(Math.max(time, 0), this.audioElement.duration);
        this.audioElement.currentTime = time;
    }
    
    async toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        
        // If using Spotify
        if (this.isSpotifyConnected) {
            try {
                await window.spotifyAPI.request(
                    `me/player/shuffle?state=${this.isShuffled}`,
                    'PUT'
                );
            } catch (error) {
                console.error('Error toggling shuffle with Spotify:', error);
            }
        }
        
        return this.isShuffled;
    }
    
    async toggleRepeat() {
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
        
        // If using Spotify
        if (this.isSpotifyConnected) {
            // Convert our repeat mode to Spotify format
            let spotifyRepeatMode = 'off';
            if (this.repeatMode === 'all') spotifyRepeatMode = 'context';
            if (this.repeatMode === 'one') spotifyRepeatMode = 'track';
            
            try {
                await window.spotifyAPI.request(
                    `me/player/repeat?state=${spotifyRepeatMode}`,
                    'PUT'
                );
            } catch (error) {
                console.error('Error toggling repeat mode with Spotify:', error);
            }
        }
        
        return this.repeatMode;
    }
    
    // Get current position from Spotify
    async getCurrentSpotifyPosition() {
        if (!this.isSpotifyConnected) return 0;
        
        try {
            const playbackState = await window.spotifyAPI.request('me/player');
            return playbackState?.progress_ms / 1000 || 0; // Convert ms to seconds
        } catch (error) {
            console.error('Error getting Spotify playback position:', error);
            return 0;
        }
    }
    
    // Helper methods
    async getProgress() {
        // If using Spotify
        if (this.isSpotifyConnected) {
            try {
                const position = await this.getCurrentSpotifyPosition();
                const duration = this.playlist[this.currentTrackIndex]?.duration || 0;
                
                return {
                    currentTime: position,
                    duration: duration,
                    percentage: duration ? (position / duration) * 100 : 0
                };
            } catch (error) {
                console.error('Error getting Spotify progress:', error);
                // Fall back to local audio
            }
        }
        
        // Local audio fallback
        return {
            currentTime: this.audioElement.currentTime,
            duration: this.audioElement.duration || 0,
            percentage: this.audioElement.duration ? (this.audioElement.currentTime / this.audioElement.duration) * 100 : 0
        };
    }
    
    getCurrentTrack() {
        return this.playlist[this.currentTrackIndex];
    }
    
    // Add a track to the playlist
    addTrack(track) {
        this.playlist.push(track);
        this.trigger('onPlaylistChanged', this.playlist);
    }
    
    // Remove a track from the playlist
    removeTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            // Adjust current track index if necessary
            if (index < this.currentTrackIndex) {
                this.currentTrackIndex--;
            } else if (index === this.currentTrackIndex) {
                // If removing current track, pause playback
                this.pause();
                // If it's the last track, go to the previous track
                if (index === this.playlist.length - 1) {
                    this.currentTrackIndex = Math.max(0, this.currentTrackIndex - 1);
                }
                // Otherwise stay at the same index (which will be the next track after removal)
            }
            
            this.playlist.splice(index, 1);
            this.trigger('onPlaylistChanged', this.playlist);
        }
    }
    
    // Create and return a new playlist
    createPlaylist(name, tracks = []) {
        return {
            name: name,
            tracks: [...tracks],
            id: Date.now().toString()
        };
    }
    
    // Add a track to a playlist
    addTrackToPlaylist(playlist, track) {
        if (playlist && track) {
            playlist.tracks.push(track);
            return true;
        }
        return false;
    }
    
    // Get information about Spotify connection status
    getSpotifyStatus() {
        return {
            isConnected: this.isSpotifyConnected,
            deviceId: this.deviceId
        };
    }
    
    // Search for tracks
    async searchTracks(query) {
        if (!query || query.trim() === '') return [];
        
        // If connected to Spotify, search using the API
        if (window.spotifyAPI && window.spotifyAPI.isTokenValid()) {
            try {
                const results = await window.spotifyAPI.search(query, ['track']);
                
                if (results && results.tracks && results.tracks.items) {
                    // Convert Spotify track objects to our format
                    return results.tracks.items.map(track => ({
                        id: track.id,
                        title: track.name,
                        artist: track.artists.map(a => a.name).join(', '),
                        album: track.album.name,
                        duration: track.duration_ms / 1000, // Convert ms to seconds
                        cover: track.album.images[0]?.url,
                        url: `spotify:track:${track.id}`,
                        color: '#1DB954' // Spotify green as fallback
                    }));
                }
            } catch (error) {
                console.error('Error searching tracks with Spotify:', error);
                // Fall back to local search
            }
        }
        
        // Local search fallback
        const normalizedQuery = query.toLowerCase();
        return this.playlist.filter(track => 
            track.title.toLowerCase().includes(normalizedQuery) ||
            track.artist.toLowerCase().includes(normalizedQuery) ||
            track.album.toLowerCase().includes(normalizedQuery)
        );
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Ensure sample tracks are loaded
    if (musicPlayer.playlist.length === 0) {
        musicPlayer.loadSampleTracks();
    }
}); 