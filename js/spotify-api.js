// Spotify API Integration
class SpotifyAPI {
    constructor() {
        // Spotify API credentials - these should be stored securely
        this.clientId = 'YOUR_CLIENT_ID'; // Replace with your Spotify app client ID
        this.redirectUri = window.location.origin;
        this.scope = 'user-read-private user-read-email user-library-read user-library-modify user-read-playback-state user-modify-playback-state playlist-read-private playlist-modify-private playlist-modify-public user-read-recently-played user-top-read';
        this.tokenKey = 'spotify_access_token';
        this.expiresKey = 'spotify_token_expires';
        this.refreshTokenKey = 'spotify_refresh_token';
    }

    // Initialize the API connection
    init() {
        // Check if we already have a valid token
        if (this.isTokenValid()) {
            return Promise.resolve(this.getToken());
        }

        // Check if we're returning from auth redirect with a code
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Exchange code for token
            return this.exchangeCodeForToken(code);
        }

        // No token and no code, need to authenticate
        return Promise.reject('Authentication required');
    }

    // Redirect to Spotify login
    authenticate() {
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', this.clientId);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', this.redirectUri);
        authUrl.searchParams.append('scope', this.scope);
        authUrl.searchParams.append('show_dialog', 'true');
        
        // Redirect to Spotify auth page
        window.location.href = authUrl.toString();
    }

    // Exchange authorization code for access token
    exchangeCodeForToken(code) {
        // In a real app, this would be done server-side to keep client_secret secure
        // This is a simplified example that would require a server component
        const tokenEndpoint = 'https://accounts.spotify.com/api/token';
        
        // This would be implemented with a server-side proxy
        console.log('Code received:', code);
        alert('In a real app, this code would be sent to a server to exchange for a token.');
        
        // Mock successful token exchange
        const mockToken = 'mock_access_token';
        const expiresIn = 3600;
        const refreshToken = 'mock_refresh_token';
        
        this.saveToken(mockToken, expiresIn, refreshToken);
        return Promise.resolve(mockToken);
    }

    // Save token to localStorage
    saveToken(token, expiresIn, refreshToken) {
        const expiresAt = Date.now() + (expiresIn * 1000);
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.expiresKey, expiresAt.toString());
        if (refreshToken) {
            localStorage.setItem(this.refreshTokenKey, refreshToken);
        }
    }

    // Get token from localStorage
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Check if token is still valid
    isTokenValid() {
        const token = localStorage.getItem(this.tokenKey);
        const expires = localStorage.getItem(this.expiresKey);
        
        if (!token || !expires) return false;
        
        // Check if token has expired
        return Date.now() < parseInt(expires);
    }

    // Clear authentication data
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.expiresKey);
        localStorage.removeItem(this.refreshTokenKey);
    }

    // Make authorized request to Spotify API
    async request(endpoint, method = 'GET', body = null) {
        // Ensure we have a valid token
        if (!this.isTokenValid()) {
            throw new Error('No valid token');
        }

        const url = endpoint.startsWith('https://') 
            ? endpoint 
            : `https://api.spotify.com/v1/${endpoint}`;
        
        const headers = {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
        };

        const options = {
            method,
            headers
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, attempt refresh or reauthenticate
                this.logout();
                throw new Error('Authentication expired');
            }
            throw new Error(`API request failed: ${response.statusText}`);
        }

        // Some endpoints return no content
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }

    // Get user profile
    async getUserProfile() {
        return await this.request('me');
    }

    // Get user's playlists
    async getUserPlaylists(limit = 50, offset = 0) {
        return await this.request(`me/playlists?limit=${limit}&offset=${offset}`);
    }

    // Get a playlist by ID
    async getPlaylist(playlistId) {
        return await this.request(`playlists/${playlistId}`);
    }

    // Get playlist tracks
    async getPlaylistTracks(playlistId, limit = 100, offset = 0) {
        return await this.request(`playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
    }

    // Create a new playlist
    async createPlaylist(userId, name, description = '', isPublic = true) {
        return await this.request(`users/${userId}/playlists`, 'POST', {
            name,
            description,
            public: isPublic
        });
    }

    // Add tracks to a playlist
    async addTracksToPlaylist(playlistId, uris) {
        return await this.request(`playlists/${playlistId}/tracks`, 'POST', {
            uris
        });
    }

    // Remove tracks from a playlist
    async removeTracksFromPlaylist(playlistId, uris) {
        return await this.request(`playlists/${playlistId}/tracks`, 'DELETE', {
            tracks: uris.map(uri => ({ uri }))
        });
    }

    // Search for items
    async search(query, types = ['track', 'artist', 'album', 'playlist'], limit = 20) {
        const typeString = types.join(',');
        return await this.request(`search?q=${encodeURIComponent(query)}&type=${typeString}&limit=${limit}`);
    }

    // Get recommendations based on seed entities
    async getRecommendations(seedArtists = [], seedTracks = [], seedGenres = [], limit = 20) {
        let params = `limit=${limit}`;
        
        if (seedArtists.length) {
            params += `&seed_artists=${seedArtists.join(',')}`;
        }
        
        if (seedTracks.length) {
            params += `&seed_tracks=${seedTracks.join(',')}`;
        }
        
        if (seedGenres.length) {
            params += `&seed_genres=${seedGenres.join(',')}`;
        }
        
        return await this.request(`recommendations?${params}`);
    }

    // Get user's top items
    async getUserTopItems(type, limit = 20, offset = 0, timeRange = 'medium_term') {
        return await this.request(`me/top/${type}?limit=${limit}&offset=${offset}&time_range=${timeRange}`);
    }

    // Get user's saved tracks
    async getSavedTracks(limit = 50, offset = 0) {
        return await this.request(`me/tracks?limit=${limit}&offset=${offset}`);
    }

    // Save tracks to user's library
    async saveTracks(trackIds) {
        return await this.request('me/tracks', 'PUT', {
            ids: trackIds
        });
    }

    // Remove tracks from user's library
    async removeSavedTracks(trackIds) {
        return await this.request('me/tracks', 'DELETE', {
            ids: trackIds
        });
    }

    // Check if tracks are saved in user's library
    async checkSavedTracks(trackIds) {
        return await this.request(`me/tracks/contains?ids=${trackIds.join(',')}`);
    }

    // Get available genres
    async getAvailableGenres() {
        return await this.request('recommendations/available-genre-seeds');
    }

    // Get new releases
    async getNewReleases(limit = 20, offset = 0, country = 'US') {
        return await this.request(`browse/new-releases?limit=${limit}&offset=${offset}&country=${country}`);
    }

    // Get featured playlists
    async getFeaturedPlaylists(limit = 20, offset = 0, country = 'US', locale = 'en_US') {
        return await this.request(`browse/featured-playlists?limit=${limit}&offset=${offset}&country=${country}&locale=${locale}`);
    }

    // Get several tracks
    async getTracks(trackIds) {
        return await this.request(`tracks?ids=${trackIds.join(',')}`);
    }
}

// Create a global instance
window.spotifyAPI = new SpotifyAPI();

// Export the class
export default SpotifyAPI; 