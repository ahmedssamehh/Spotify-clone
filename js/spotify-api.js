// Spotify API Integration
class SpotifyAPI {
    constructor() {
        // Spotify API credentials - these should be stored securely
        this.clientId = '2b8710ad60dc41359bab9a276e4cfd17'; // Spotify client ID
        this.redirectUri = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/callback.html');
        this.scope = 'user-read-private user-read-email user-library-read user-library-modify user-read-playback-state user-modify-playback-state playlist-read-private playlist-modify-private playlist-modify-public user-read-recently-played user-top-read streaming';
        this.tokenKey = 'spotify_access_token';
        this.expiresKey = 'spotify_token_expires';
        this.refreshTokenKey = 'spotify_refresh_token';
        this.proxyEndpoint = 'https://spotify-auth-proxy.herokuapp.com/token'; // Example proxy server
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
        const state = this.generateRandomString(16);
        localStorage.setItem('spotify_auth_state', state);

        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', this.clientId);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', this.redirectUri);
        authUrl.searchParams.append('scope', this.scope);
        authUrl.searchParams.append('state', state);
        
        // Redirect to Spotify auth page
        window.location.href = authUrl.toString();
    }

    // Generate a random string for state parameter
    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    // Exchange authorization code for access token
    async exchangeCodeForToken(code) {
        try {
            // In a production app, this should be done server-side to keep client_secret secure
            // Here we're simulating a server endpoint that would handle the token exchange
            
            // Use the client credentials flow for demo purposes
            const response = await fetch(this.proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                    client_id: this.clientId
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to exchange code for token');
            }
            
            const data = await response.json();
            this.saveToken(data.access_token, data.expires_in, data.refresh_token);
            
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return data.access_token;
        } catch (error) {
            console.error('Error exchanging code for token:', error);
            
            // For demo purposes, generate a fake token to allow the app to function
            console.warn('Using demo mode with simulated authentication');
            this.simulateDemoAuthentication();
            return this.getToken();
        }
    }

    // For demo purposes - creates a simulated token
    simulateDemoAuthentication() {
        const mockToken = 'spotify-clone-demo-token-' + Date.now();
        const expiresIn = 3600; // 1 hour
        const refreshToken = 'demo-refresh-token';
        
        this.saveToken(mockToken, expiresIn, refreshToken);
        console.log('Demo mode activated with simulated token');
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

    // Refresh token
    async refreshToken() {
        const refreshToken = localStorage.getItem(this.refreshTokenKey);
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(this.proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: this.clientId
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }
            
            const data = await response.json();
            this.saveToken(data.access_token, data.expires_in, data.refresh_token || refreshToken);
            return data.access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.logout();
            throw error;
        }
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
            try {
                await this.refreshToken();
            } catch (error) {
                throw new Error('Authentication required');
            }
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

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired, attempt refresh
                    await this.refreshToken();
                    // Retry the request with the new token
                    return this.request(endpoint, method, body);
                }
                
                // For demo mode, return mock data instead of throwing an error
                if (this.isDemoMode()) {
                    return this.getMockData(endpoint);
                }
                
                throw new Error(`API request failed: ${response.statusText}`);
            }

            // Some endpoints return no content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            
            // For demo purposes, return mock data
            if (this.isDemoMode()) {
                return this.getMockData(endpoint);
            }
            
            throw error;
        }
    }

    // Check if we're in demo mode
    isDemoMode() {
        const token = this.getToken();
        return token && token.startsWith('spotify-clone-demo');
    }

    // Mock data for demo mode
    getMockData(endpoint) {
        console.log('Using mock data for endpoint:', endpoint);
        
        // Mock search results
        if (endpoint.startsWith('search')) {
            return this.getMockSearchResults(endpoint);
        }
        
        // Mock user profile
        if (endpoint === 'me') {
            return {
                id: 'demo_user',
                display_name: 'Demo User',
                email: 'demo@example.com',
                images: [{ url: 'https://via.placeholder.com/300?text=Demo+User' }]
            };
        }
        
        // Mock saved tracks
        if (endpoint.startsWith('me/tracks')) {
            return this.getMockSavedTracks();
        }
        
        // Mock playlists
        if (endpoint.startsWith('me/playlists')) {
            return {
                items: [
                    {
                        id: 'demo_playlist_1',
                        name: 'My Favorite Songs',
                        description: 'A demo playlist',
                        images: [{ url: 'https://via.placeholder.com/300?text=Playlist' }],
                        tracks: { total: 5 }
                    },
                    {
                        id: 'demo_playlist_2',
                        name: 'Workout Mix',
                        description: 'Energy boosting tracks',
                        images: [{ url: 'https://via.placeholder.com/300?text=Workout' }],
                        tracks: { total: 10 }
                    }
                ]
            };
        }
        
        // Default empty response
        return {};
    }

    // Mock search results
    getMockSearchResults(endpoint) {
        const query = decodeURIComponent(endpoint.match(/q=([^&]+)/)[1]);
        console.log('Mock search for:', query);
        
        return {
            tracks: {
                items: [
                    {
                        id: 'track_1',
                        name: `${query} Hit Song`,
                        artists: [{ name: 'Popular Artist' }],
                        album: { 
                            name: 'Greatest Hits', 
                            images: [{ url: `https://via.placeholder.com/300?text=${encodeURIComponent(query)}` }]
                        },
                        duration_ms: 210000
                    },
                    {
                        id: 'track_2',
                        name: `The ${query} Experience`,
                        artists: [{ name: 'Indie Band' }],
                        album: { 
                            name: 'New Album', 
                            images: [{ url: `https://via.placeholder.com/300?text=${encodeURIComponent(query)}+2` }]
                        },
                        duration_ms: 180000
                    },
                    {
                        id: 'track_3',
                        name: `${query} Remix`,
                        artists: [{ name: 'DJ Producer' }],
                        album: { 
                            name: 'Remixes', 
                            images: [{ url: `https://via.placeholder.com/300?text=${encodeURIComponent(query)}+Remix` }]
                        },
                        duration_ms: 240000
                    }
                ]
            },
            artists: {
                items: [
                    {
                        id: 'artist_1',
                        name: `The ${query} Band`,
                        images: [{ url: `https://via.placeholder.com/300?text=${encodeURIComponent(query)}+Artist` }]
                    }
                ]
            },
            albums: {
                items: [
                    {
                        id: 'album_1',
                        name: `The ${query} Album`,
                        artists: [{ name: 'Album Artist' }],
                        images: [{ url: `https://via.placeholder.com/300?text=${encodeURIComponent(query)}+Album` }]
                    }
                ]
            },
            playlists: {
                items: [
                    {
                        id: 'playlist_1',
                        name: `Top ${query} Playlist`,
                        owner: { display_name: 'Playlist Creator' },
                        images: [{ url: `https://via.placeholder.com/300?text=${encodeURIComponent(query)}+Playlist` }]
                    }
                ]
            }
        };
    }

    // Mock saved tracks
    getMockSavedTracks() {
        return {
            items: [
                {
                    track: {
                        id: 'saved_track_1',
                        name: 'Blinding Lights',
                        artists: [{ name: 'The Weeknd' }],
                        album: {
                            name: 'After Hours',
                            images: [{ url: 'https://via.placeholder.com/300?text=Blinding+Lights' }]
                        },
                        duration_ms: 201000
                    }
                },
                {
                    track: {
                        id: 'saved_track_2',
                        name: 'Bad Guy',
                        artists: [{ name: 'Billie Eilish' }],
                        album: {
                            name: 'When We All Fall Asleep, Where Do We Go?',
                            images: [{ url: 'https://via.placeholder.com/300?text=Bad+Guy' }]
                        },
                        duration_ms: 194000
                    }
                },
                {
                    track: {
                        id: 'saved_track_3',
                        name: 'Shape of You',
                        artists: [{ name: 'Ed Sheeran' }],
                        album: {
                            name: '÷ (Divide)',
                            images: [{ url: 'https://via.placeholder.com/300?text=Shape+of+You' }]
                        },
                        duration_ms: 234000
                    }
                }
            ]
        };
    }

    // Get user profile
    async getUserProfile() {
        return await this.request('me');
    }

    // Get user's playlists
    async getUserPlaylists(limit = 50, offset = 0) {
        try {
            const response = await this.request(`me/playlists?limit=${limit}&offset=${offset}`);
            return response;
        } catch (error) {
            console.error('Error fetching user playlists:', error);
            // For demo mode, return mock data
            if (this.isDemoMode()) {
                return this.getMockPlaylists();
            }
            throw error;
        }
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
        try {
            const response = await this.request(`me/tracks?limit=${limit}&offset=${offset}`);
            return response;
        } catch (error) {
            console.error('Error fetching saved tracks:', error);
            // For demo mode, return mock data
            if (this.isDemoMode()) {
                return this.getMockSavedTracks();
            }
            throw error;
        }
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

    // Get track by ID
    async getTracks(trackIds) {
        return await this.request(`tracks?ids=${trackIds.join(',')}`);
    }

    // Start/Resume playback
    async startPlayback(deviceId, contextUri = null, uris = null, offset = null, position = null) {
        const body = {};
        
        if (contextUri) {
            body.context_uri = contextUri;
        } else if (uris) {
            body.uris = uris;
        }
        
        if (offset !== null) {
            body.offset = typeof offset === 'number' ? { position: offset } : offset;
        }
        
        if (position !== null) {
            body.position_ms = position;
        }
        
        const endpoint = deviceId ? `me/player/play?device_id=${deviceId}` : 'me/player/play';
        return await this.request(endpoint, 'PUT', body);
    }

    // Pause playback
    async pausePlayback(deviceId = null) {
        const endpoint = deviceId ? `me/player/pause?device_id=${deviceId}` : 'me/player/pause';
        return await this.request(endpoint, 'PUT');
    }

    // Skip to next track
    async skipToNext(deviceId = null) {
        const endpoint = deviceId ? `me/player/next?device_id=${deviceId}` : 'me/player/next';
        return await this.request(endpoint, 'POST');
    }

    // Skip to previous track
    async skipToPrevious(deviceId = null) {
        const endpoint = deviceId ? `me/player/previous?device_id=${deviceId}` : 'me/player/previous';
        return await this.request(endpoint, 'POST');
    }

    // Seek to position
    async seekToPosition(positionMs, deviceId = null) {
        const endpoint = deviceId 
            ? `me/player/seek?position_ms=${positionMs}&device_id=${deviceId}` 
            : `me/player/seek?position_ms=${positionMs}`;
        return await this.request(endpoint, 'PUT');
    }

    // Set volume
    async setVolume(volumePercent, deviceId = null) {
        const endpoint = deviceId 
            ? `me/player/volume?volume_percent=${volumePercent}&device_id=${deviceId}` 
            : `me/player/volume?volume_percent=${volumePercent}`;
        return await this.request(endpoint, 'PUT');
    }

    // Toggle shuffle
    async setShuffle(state, deviceId = null) {
        const endpoint = deviceId 
            ? `me/player/shuffle?state=${state}&device_id=${deviceId}` 
            : `me/player/shuffle?state=${state}`;
        return await this.request(endpoint, 'PUT');
    }

    // Set repeat mode
    async setRepeatMode(state, deviceId = null) {
        const endpoint = deviceId 
            ? `me/player/repeat?state=${state}&device_id=${deviceId}` 
            : `me/player/repeat?state=${state}`;
        return await this.request(endpoint, 'PUT');
    }

    // Get current playback state
    async getPlaybackState(additionalTypes = null) {
        let endpoint = 'me/player';
        if (additionalTypes) {
            endpoint += `?additional_types=${additionalTypes}`;
        }
        return await this.request(endpoint);
    }

    // Get available devices
    async getAvailableDevices() {
        return await this.request('me/player/devices');
    }

    // Check if user is authenticated with Spotify
    isLoggedIn() {
        return this.isTokenValid();
    }
    
    // Transfer playback to specified device
    async transferPlayback(deviceId, play = false) {
        if (!deviceId) {
            throw new Error('Device ID is required to transfer playback');
        }
        
        try {
            await this.request('me/player', 'PUT', {
                device_ids: [deviceId],
                play: play
            });
            return true;
        } catch (error) {
            console.error('Error transferring playback:', error);
            // For demo mode, simulate success
            if (this.isDemoMode()) {
                console.log('Demo mode: Simulating successful playback transfer');
                return true;
            }
            throw error;
        }
    }
    
    // Start playback on a specific device
    async startPlaybackOnDevice(deviceId, contextUri = null, uris = null, offset = null, position = null) {
        const body = {};
        
        if (contextUri) {
            body.context_uri = contextUri;
        } else if (uris) {
            body.uris = uris;
        }
        
        if (offset !== null) {
            body.offset = typeof offset === 'number' ? { position: offset } : offset;
        }
        
        if (position !== null) {
            body.position_ms = position;
        }
        
        const endpoint = deviceId ? `me/player/play?device_id=${deviceId}` : 'me/player/play';
        return await this.request(endpoint, 'PUT', body);
    }

    // Get recommendations based on seed tracks
    async getRecommendations(seedTracks, limit = 20) {
        if (!seedTracks || !seedTracks.length) {
            throw new Error('Seed tracks are required for recommendations');
        }
        
        try {
            const seedTracksParam = seedTracks.slice(0, 5).join(','); // Spotify allows max 5 seed tracks
            const response = await this.request(`recommendations?seed_tracks=${seedTracksParam}&limit=${limit}`);
            return response;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            // For demo mode, return mock data
            if (this.isDemoMode()) {
                return this.getMockRecommendations();
            }
            throw error;
        }
    }
}

// Create and export a singleton instance
if (typeof window !== 'undefined' && !window.spotifyAPI) {
    window.spotifyAPI = new SpotifyAPI();
}

// Mock data for demo mode
SpotifyAPI.prototype.getMockPlaylists = function() {
    return {
        href: "https://api.spotify.com/v1/me/playlists",
        items: [
            {
                collaborative: false,
                description: "Your top songs from the last month",
                external_urls: {
                    spotify: "https://open.spotify.com/playlist/37i9dQZF1EP6f9tcYMcYqP"
                },
                href: "https://api.spotify.com/v1/playlists/37i9dQZF1EP6f9tcYMcYqP",
                id: "37i9dQZF1EP6f9tcYMcYqP",
                images: [
                    {
                        height: 300,
                        url: "https://i.scdn.co/image/ab67706f00000003e0dde4b5df2055f0b3b49154",
                        width: 300
                    }
                ],
                name: "Your Top Songs 2023",
                owner: {
                    display_name: "Spotify",
                    id: "spotify"
                },
                public: false,
                tracks: {
                    href: "https://api.spotify.com/v1/playlists/37i9dQZF1EP6f9tcYMcYqP/tracks",
                    total: 100
                },
                type: "playlist",
                uri: "spotify:playlist:37i9dQZF1EP6f9tcYMcYqP"
            },
            {
                collaborative: false,
                description: "Chill vibes for relaxing moments",
                external_urls: {
                    spotify: "https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6"
                },
                href: "https://api.spotify.com/v1/playlists/37i9dQZF1DX4WYpdgoIcn6",
                id: "37i9dQZF1DX4WYpdgoIcn6",
                images: [
                    {
                        height: 300,
                        url: "https://i.scdn.co/image/ab67706f000000034cb8e4be74f5672e5958a976",
                        width: 300
                    }
                ],
                name: "Chill Lofi Study Beats",
                owner: {
                    display_name: "Spotify",
                    id: "spotify"
                },
                public: true,
                tracks: {
                    href: "https://api.spotify.com/v1/playlists/37i9dQZF1DX4WYpdgoIcn6/tracks",
                    total: 75
                },
                type: "playlist",
                uri: "spotify:playlist:37i9dQZF1DX4WYpdgoIcn6"
            },
            {
                collaborative: false,
                description: "Your favorite workout tunes",
                external_urls: {
                    spotify: "https://open.spotify.com/playlist/37i9dQZF1DX76Nv1c13tAM"
                },
                href: "https://api.spotify.com/v1/playlists/37i9dQZF1DX76Nv1c13tAM",
                id: "37i9dQZF1DX76Nv1c13tAM",
                images: [
                    {
                        height: 300,
                        url: "https://i.scdn.co/image/ab67706f000000036eb0b9e7a34f97ea08b70b48",
                        width: 300
                    }
                ],
                name: "Workout Mix",
                owner: {
                    display_name: "User",
                    id: "user123"
                },
                public: true,
                tracks: {
                    href: "https://api.spotify.com/v1/playlists/37i9dQZF1DX76Nv1c13tAM/tracks",
                    total: 50
                },
                type: "playlist",
                uri: "spotify:playlist:37i9dQZF1DX76Nv1c13tAM"
            }
        ],
        limit: 50,
        next: null,
        offset: 0,
        previous: null,
        total: 3
    };
};

SpotifyAPI.prototype.getMockSavedTracks = function() {
    return {
        href: "https://api.spotify.com/v1/me/tracks",
        items: [
            {
                added_at: "2023-12-10T23:59:59Z",
                track: {
                    album: {
                        album_type: "album",
                        artists: [{
                            id: "0TnOYISbd1XYRBk9myaseg",
                            name: "Pitbull"
                        }],
                        id: "5T4UQeJ7Cu9K27surIaEUz",
                        images: [{
                            height: 640,
                            url: "https://i.scdn.co/image/ab67616d0000b273f7b7e1c981a6e3d532799ba5",
                            width: 640
                        }],
                        name: "Global Warming"
                    },
                    artists: [{
                        id: "0TnOYISbd1XYRBk9myaseg",
                        name: "Pitbull"
                    }, {
                        id: "2DlGxzQSjYe5N6G9nkYA9h",
                        name: "Christina Aguilera"
                    }],
                    duration_ms: 229400,
                    id: "0Hf4aIJpsN4Os2f0y0VqWl",
                    name: "Feel This Moment",
                    popularity: 74,
                    preview_url: "https://p.scdn.co/mp3-preview/7b145ee6e77735894fa17de2e7e90bdf480fe8c0",
                    uri: "spotify:track:0Hf4aIJpsN4Os2f0y0VqWl"
                }
            },
            {
                added_at: "2023-11-25T14:30:45Z",
                track: {
                    album: {
                        album_type: "single",
                        artists: [{
                            id: "6sFIWsNpZYqfjUpaCgueju",
                            name: "Carly Rae Jepsen"
                        }],
                        id: "0tIOaDdYzKbhZtPXUHaQ1x",
                        images: [{
                            height: 640,
                            url: "https://i.scdn.co/image/ab67616d0000b27382e5927438c97a31e0b312b6",
                            width: 640
                        }],
                        name: "Call Me Maybe"
                    },
                    artists: [{
                        id: "6sFIWsNpZYqfjUpaCgueju",
                        name: "Carly Rae Jepsen"
                    }],
                    duration_ms: 193400,
                    id: "20I6sIOMTCkB6w7ryavxtO",
                    name: "Call Me Maybe",
                    popularity: 82,
                    preview_url: "https://p.scdn.co/mp3-preview/0452cba3024647318c909e4bf1b3e732c7cbedf9",
                    uri: "spotify:track:20I6sIOMTCkB6w7ryavxtO"
                }
            },
            {
                added_at: "2023-10-15T09:12:33Z",
                track: {
                    album: {
                        album_type: "album",
                        artists: [{
                            id: "4tZwfgrHOc3mvqYlEYSvVi",
                            name: "Daft Punk"
                        }],
                        id: "4m2880jivSbbyEGAKfITCa",
                        images: [{
                            height: 640,
                            url: "https://i.scdn.co/image/ab67616d0000b27326f7f19c7f0381e56156c94a",
                            width: 640
                        }],
                        name: "Random Access Memories"
                    },
                    artists: [{
                        id: "4tZwfgrHOc3mvqYlEYSvVi",
                        name: "Daft Punk"
                    }, {
                        id: "2RdwBSPQiwcmiDo9kixcl8",
                        name: "Pharrell Williams"
                    }],
                    duration_ms: 369626,
                    id: "5CMjjywI0eZMixPeqNd75R",
                    name: "Get Lucky",
                    popularity: 86,
                    preview_url: "https://p.scdn.co/mp3-preview/2c9a12e756008a3afb227595c1c15feb1de0fe1c",
                    uri: "spotify:track:5CMjjywI0eZMixPeqNd75R"
                }
            }
        ],
        limit: 50,
        next: null,
        offset: 0,
        previous: null,
        total: 3
    };
};

SpotifyAPI.prototype.getMockRecommendations = function() {
    return {
        tracks: [
            {
                album: {
                    album_type: "album",
                    artists: [{
                        id: "0du5cEVh5yTK9QJze8zA0C",
                        name: "Bruno Mars"
                    }],
                    id: "6FF5bSCpnGLs1J9zGbKgr2",
                    images: [{
                        height: 640,
                        url: "https://i.scdn.co/image/ab67616d0000b273c36dd9953610e959c2e12c6d",
                        width: 640
                    }],
                    name: "24K Magic"
                },
                artists: [{
                    id: "0du5cEVh5yTK9QJze8zA0C",
                    name: "Bruno Mars"
                }],
                duration_ms: 226066,
                id: "6b8Be6ljOzmkOmFslEb23P",
                name: "24K Magic",
                popularity: 84,
                preview_url: "https://p.scdn.co/mp3-preview/7c4d809d4751d0fac2c55c42df0f2c597a3fbdbc",
                uri: "spotify:track:6b8Be6ljOzmkOmFslEb23P"
            },
            {
                album: {
                    album_type: "album",
                    artists: [{
                        id: "0hCNtLu0JehylgoiP8L4Gh",
                        name: "Nicki Minaj"
                    }],
                    id: "1FZKIm3JVDCxTchXDo5jOV",
                    images: [{
                        height: 640,
                        url: "https://i.scdn.co/image/ab67616d0000b2731e6b3b16af6fd61c91b78a33",
                        width: 640
                    }],
                    name: "Pink Friday: Roman Reloaded"
                },
                artists: [{
                    id: "0hCNtLu0JehylgoiP8L4Gh",
                    name: "Nicki Minaj"
                }],
                duration_ms: 248373,
                id: "5jrdCoLpJSvHHorevXBATy",
                name: "Starships",
                popularity: 78,
                preview_url: "https://p.scdn.co/mp3-preview/dd235a0f9901c12bc2a8eca30615dfe9c38e7f04",
                uri: "spotify:track:5jrdCoLpJSvHHorevXBATy"
            },
            {
                album: {
                    album_type: "album",
                    artists: [{
                        id: "6vWDO969PvNqNYHIOW5v0m",
                        name: "Beyoncé"
                    }],
                    id: "6oxVabMIqCMJRYN1GqR3Vf",
                    images: [{
                        height: 640,
                        url: "https://i.scdn.co/image/ab67616d0000b2734ac97e069d5c35f74602fff0",
                        width: 640
                    }],
                    name: "RENAISSANCE"
                },
                artists: [{
                    id: "6vWDO969PvNqNYHIOW5v0m",
                    name: "Beyoncé"
                }],
                duration_ms: 278507,
                id: "0QHgepMTRRD3s8fhXdGNyy",
                name: "BREAK MY SOUL",
                popularity: 80,
                preview_url: "https://p.scdn.co/mp3-preview/2a56d5eb99e6cb7eba0446dfd414b1b725c64b03",
                uri: "spotify:track:0QHgepMTRRD3s8fhXdGNyy"
            }
        ],
        seeds: [
            {
                id: "0Hf4aIJpsN4Os2f0y0VqWl",
                type: "TRACK",
                href: "https://api.spotify.com/v1/tracks/0Hf4aIJpsN4Os2f0y0VqWl"
            },
            {
                id: "20I6sIOMTCkB6w7ryavxtO",
                type: "TRACK",
                href: "https://api.spotify.com/v1/tracks/20I6sIOMTCkB6w7ryavxtO"
            }
        ]
    };
}; 