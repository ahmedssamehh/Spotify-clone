// Playlist Management Module
class PlaylistManager {
    constructor() {
        this.playlists = [];
        this.userPlaylists = [];
        
        // DOM elements
        this.playlistList = document.querySelector('.playlist-list');
        this.createPlaylistBtn = document.querySelector('.create-playlist-btn');
        this.playlistModal = document.getElementById('playlist-modal');
        this.playlistForm = document.getElementById('playlist-form');
        this.closeModalBtn = document.getElementById('close-modal');
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Load user playlists from localStorage (fallback)
        this.loadLocalPlaylists();
        
        // If Spotify API is available, try to load user playlists
        if (window.spotifyAPI && window.spotifyAPI.isTokenValid()) {
            await this.loadSpotifyPlaylists();
        }
        
        // Update the playlist list in the UI
        this.renderPlaylists();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Listen for authentication events
        document.addEventListener('auth:login', () => this.handleUserLogin());
        document.addEventListener('auth:logout', () => this.handleUserLogout());
    }
    
    setupEventListeners() {
        // Create playlist button
        if (this.createPlaylistBtn) {
            this.createPlaylistBtn.addEventListener('click', () => this.showCreatePlaylistModal());
        }
        
        // Close modal button
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.hidePlaylistModal());
        }
        
        // Submit form for creating/editing playlist
        if (this.playlistForm) {
            this.playlistForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePlaylistFormSubmit();
            });
        }
        
        // Close modal when clicking outside
        if (this.playlistModal) {
            this.playlistModal.addEventListener('click', (e) => {
                if (e.target === this.playlistModal) {
                    this.hidePlaylistModal();
                }
            });
        }
    }
    
    // Load playlists from localStorage (fallback)
    loadLocalPlaylists() {
        try {
            const savedPlaylists = localStorage.getItem('user_playlists');
            if (savedPlaylists) {
                this.playlists = JSON.parse(savedPlaylists);
            }
        } catch (error) {
            console.error('Error loading local playlists:', error);
            this.playlists = [];
        }
    }
    
    // Save playlists to localStorage (fallback)
    saveLocalPlaylists() {
        try {
            localStorage.setItem('user_playlists', JSON.stringify(this.playlists));
        } catch (error) {
            console.error('Error saving local playlists:', error);
        }
    }
    
    // Load playlists from Spotify API
    async loadSpotifyPlaylists() {
        try {
            const response = await window.spotifyAPI.getUserPlaylists();
            
            if (response && response.items) {
                this.userPlaylists = response.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description || '',
                    public: item.public,
                    collaborative: item.collaborative,
                    tracks: item.tracks.total,
                    images: item.images,
                    spotifyUrl: item.external_urls.spotify,
                    owner: item.owner.display_name,
                    ownerId: item.owner.id,
                    isRemote: true // Flag to indicate this is from Spotify API
                }));
                
                // Merge with local playlists
                this.playlists = [
                    ...this.userPlaylists,
                    ...this.playlists.filter(p => !p.isRemote)
                ];
            }
        } catch (error) {
            console.error('Error loading Spotify playlists:', error);
        }
    }
    
    // Render playlists in the sidebar
    renderPlaylists() {
        if (!this.playlistList) return;
        
        // Clear existing playlists
        this.playlistList.innerHTML = '';
        
        // Create playlist items
        this.playlists.forEach(playlist => {
            const playlistItem = document.createElement('li');
            playlistItem.innerHTML = `<a href="#" data-playlist-id="${playlist.id}">${playlist.name}</a>`;
            
            // Add click handler
            const playlistLink = playlistItem.querySelector('a');
            if (playlistLink) {
                playlistLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadPlaylist(playlist.id);
                });
            }
            
            this.playlistList.appendChild(playlistItem);
        });
    }
    
    // Show create playlist modal
    showCreatePlaylistModal(playlistId = null) {
        if (!this.playlistModal || !this.playlistForm) return;
        
        // Reset form
        this.playlistForm.reset();
        
        // Check if editing an existing playlist
        const isEditing = playlistId !== null;
        const modalTitle = document.getElementById('playlist-modal-title');
        const submitButton = this.playlistForm.querySelector('button[type="submit"]');
        
        if (isEditing) {
            // Find the playlist
            const playlist = this.playlists.find(p => p.id === playlistId);
            if (!playlist) return;
            
            // Fill form with playlist data
            const nameInput = this.playlistForm.querySelector('#playlist-name');
            const descInput = this.playlistForm.querySelector('#playlist-description');
            const publicInput = this.playlistForm.querySelector('#playlist-public');
            
            if (nameInput) nameInput.value = playlist.name;
            if (descInput) descInput.value = playlist.description || '';
            if (publicInput) publicInput.checked = playlist.public !== false;
            
            // Update modal title and button text
            if (modalTitle) modalTitle.textContent = 'Edit Playlist';
            if (submitButton) submitButton.textContent = 'Save Changes';
            
            // Add playlist ID to form
            this.playlistForm.dataset.playlistId = playlistId;
        } else {
            // Creating new playlist
            if (modalTitle) modalTitle.textContent = 'Create Playlist';
            if (submitButton) submitButton.textContent = 'Create';
            
            // Reset playlist ID
            delete this.playlistForm.dataset.playlistId;
        }
        
        // Show modal
        this.playlistModal.classList.add('visible');
    }
    
    // Hide playlist modal
    hidePlaylistModal() {
        if (this.playlistModal) {
            this.playlistModal.classList.remove('visible');
        }
    }
    
    // Handle playlist form submission
    async handlePlaylistFormSubmit() {
        const nameInput = this.playlistForm.querySelector('#playlist-name');
        const descInput = this.playlistForm.querySelector('#playlist-description');
        const publicInput = this.playlistForm.querySelector('#playlist-public');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const description = descInput ? descInput.value.trim() : '';
        const isPublic = publicInput ? publicInput.checked : true;
        
        // Validate name
        if (!name) {
            this.showFormError('Please enter a playlist name');
            return;
        }
        
        // Check if editing or creating
        const playlistId = this.playlistForm.dataset.playlistId;
        const isEditing = !!playlistId;
        
        if (isEditing) {
            await this.updatePlaylist(playlistId, { name, description, public: isPublic });
        } else {
            await this.createPlaylist(name, description, isPublic);
        }
        
        // Hide modal
        this.hidePlaylistModal();
    }
    
    // Show form error
    showFormError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.textContent = message;
        
        // Add to form
        this.playlistForm.prepend(errorElement);
        
        // Remove after a few seconds
        setTimeout(() => {
            errorElement.remove();
        }, 3000);
    }
    
    // Create a new playlist
    async createPlaylist(name, description = '', isPublic = true) {
        // Check if user is authenticated and Spotify API is available
        if (window.spotifyAPI && window.spotifyAPI.isTokenValid() && window.userAuth && window.userAuth.isAuthenticated()) {
            try {
                const userProfile = window.userAuth.getUserProfile();
                const response = await window.spotifyAPI.createPlaylist(
                    userProfile.id,
                    name,
                    description,
                    isPublic
                );
                
                if (response) {
                    // Add new playlist to the list
                    const newPlaylist = {
                        id: response.id,
                        name: response.name,
                        description: response.description,
                        public: response.public,
                        collaborative: response.collaborative,
                        tracks: response.tracks.total,
                        images: response.images,
                        spotifyUrl: response.external_urls.spotify,
                        owner: response.owner.display_name,
                        ownerId: response.owner.id,
                        isRemote: true
                    };
                    
                    this.playlists.unshift(newPlaylist);
                    this.renderPlaylists();
                    this.showSuccess(`Playlist "${name}" created successfully`);
                }
            } catch (error) {
                console.error('Error creating Spotify playlist:', error);
                // Fallback to local playlist
                this.createLocalPlaylist(name, description, isPublic);
            }
        } else {
            // Create local playlist if not authenticated
            this.createLocalPlaylist(name, description, isPublic);
        }
    }
    
    // Create a local playlist (fallback)
    createLocalPlaylist(name, description = '', isPublic = true) {
        const newPlaylist = {
            id: 'local_' + Date.now(),
            name,
            description,
            public: isPublic,
            collaborative: false,
            tracks: 0,
            images: [],
            isRemote: false,
            createdAt: new Date().toISOString(),
            trackList: []
        };
        
        this.playlists.unshift(newPlaylist);
        this.saveLocalPlaylists();
        this.renderPlaylists();
        this.showSuccess(`Playlist "${name}" created successfully`);
    }
    
    // Update an existing playlist
    async updatePlaylist(playlistId, updates) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        if (playlist.isRemote && window.spotifyAPI && window.spotifyAPI.isTokenValid()) {
            try {
                // Update remote playlist
                await window.spotifyAPI.request(
                    `playlists/${playlistId}`,
                    'PUT',
                    {
                        name: updates.name,
                        description: updates.description,
                        public: updates.public
                    }
                );
                
                // Update local copy
                Object.assign(playlist, updates);
                this.renderPlaylists();
                this.showSuccess(`Playlist "${updates.name}" updated successfully`);
            } catch (error) {
                console.error('Error updating Spotify playlist:', error);
                this.showError('Failed to update playlist. Please try again.');
            }
        } else {
            // Update local playlist
            Object.assign(playlist, updates);
            this.saveLocalPlaylists();
            this.renderPlaylists();
            this.showSuccess(`Playlist "${updates.name}" updated successfully`);
        }
    }
    
    // Load a playlist
    async loadPlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // If this is a remote playlist, load tracks from Spotify
        if (playlist.isRemote && window.spotifyAPI && window.spotifyAPI.isTokenValid()) {
            try {
                const response = await window.spotifyAPI.getPlaylistTracks(playlistId);
                
                if (response && response.items) {
                    // Convert tracks to our format
                    const tracks = response.items
                        .filter(item => item.track) // Ensure track exists
                        .map(item => ({
                            id: item.track.id,
                            title: item.track.name,
                            artist: item.track.artists.map(a => a.name).join(', '),
                            album: item.track.album.name,
                            duration: item.track.duration_ms / 1000,
                            cover: item.track.album.images[0]?.url,
                            url: `spotify:track:${item.track.id}`,
                            color: '#1DB954',
                            addedAt: item.added_at,
                            addedBy: item.added_by?.id
                        }));
                    
                    // Update music player with these tracks
                    if (window.musicPlayer) {
                        window.musicPlayer.playlist = tracks;
                        window.musicPlayer.currentTrackIndex = 0;
                        window.musicPlayer.trigger('onPlaylistChanged', window.musicPlayer.playlist);
                        
                        // If there are tracks, we could play the first one
                        if (tracks.length > 0 && confirm(`Start playing playlist "${playlist.name}"?`)) {
                            window.musicPlayer.play(0);
                        }
                    }
                    
                    // Here we would also update the main view to show the playlist
                    this.displayPlaylistDetails(playlist, tracks);
                }
            } catch (error) {
                console.error('Error loading Spotify playlist tracks:', error);
                this.showError('Failed to load playlist tracks. Please try again.');
            }
        } else if (!playlist.isRemote) {
            // Load local playlist
            const tracks = playlist.trackList || [];
            
            // Update music player with these tracks
            if (window.musicPlayer) {
                window.musicPlayer.playlist = tracks;
                window.musicPlayer.currentTrackIndex = 0;
                window.musicPlayer.trigger('onPlaylistChanged', window.musicPlayer.playlist);
                
                // If there are tracks, we could play the first one
                if (tracks.length > 0 && confirm(`Start playing playlist "${playlist.name}"?`)) {
                    window.musicPlayer.play(0);
                }
            }
            
            // Update the main view to show the playlist
            this.displayPlaylistDetails(playlist, tracks);
        }
    }
    
    // Add a track to a playlist
    async addTrackToPlaylist(playlistId, track) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        if (playlist.isRemote && window.spotifyAPI && window.spotifyAPI.isTokenValid()) {
            try {
                // Add track to remote playlist
                await window.spotifyAPI.addTracksToPlaylist(playlistId, [track.url]);
                
                // Show success message
                this.showSuccess(`Added "${track.title}" to "${playlist.name}"`);
                return true;
            } catch (error) {
                console.error('Error adding track to Spotify playlist:', error);
                this.showError('Failed to add track to playlist. Please try again.');
                return false;
            }
        } else if (!playlist.isRemote) {
            // Add track to local playlist
            if (!playlist.trackList) playlist.trackList = [];
            playlist.trackList.push(track);
            playlist.tracks = playlist.trackList.length;
            
            this.saveLocalPlaylists();
            this.renderPlaylists();
            
            // Show success message
            this.showSuccess(`Added "${track.title}" to "${playlist.name}"`);
            return true;
        }
        
        return false;
    }
    
    // Remove a track from a playlist
    async removeTrackFromPlaylist(playlistId, trackIndex, trackUri) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        if (playlist.isRemote && window.spotifyAPI && window.spotifyAPI.isTokenValid()) {
            try {
                // Remove track from remote playlist
                await window.spotifyAPI.removeTracksFromPlaylist(playlistId, [trackUri]);
                
                // Show success message
                this.showSuccess(`Removed track from "${playlist.name}"`);
                return true;
            } catch (error) {
                console.error('Error removing track from Spotify playlist:', error);
                this.showError('Failed to remove track from playlist. Please try again.');
                return false;
            }
        } else if (!playlist.isRemote) {
            // Remove track from local playlist
            if (playlist.trackList && trackIndex >= 0 && trackIndex < playlist.trackList.length) {
                playlist.trackList.splice(trackIndex, 1);
                playlist.tracks = playlist.trackList.length;
                
                this.saveLocalPlaylists();
                this.renderPlaylists();
                
                // Show success message
                this.showSuccess(`Removed track from "${playlist.name}"`);
                return true;
            }
        }
        
        return false;
    }
    
    // Display playlist details in the main view
    displayPlaylistDetails(playlist, tracks) {
        // Get main content area
        const contentArea = document.querySelector('.content-container');
        if (!contentArea) return;
        
        // Create playlist view
        const playlistHeader = this.createPlaylistHeader(playlist);
        const trackList = this.createTrackList(tracks, playlist);
        
        // Update content
        contentArea.innerHTML = '';
        contentArea.appendChild(playlistHeader);
        contentArea.appendChild(trackList);
    }
    
    // Create playlist header for detail view
    createPlaylistHeader(playlist) {
        const header = document.createElement('div');
        header.className = 'playlist-header';
        
        const playlistImage = playlist.images && playlist.images.length > 0
            ? `<img src="${playlist.images[0].url}" alt="${playlist.name}" class="playlist-cover">`
            : `<div class="playlist-cover placeholder-img" style="background-color: #1E3264">
                <i class="fas fa-music"></i>
               </div>`;
        
        header.innerHTML = `
            <div class="playlist-cover-container">
                ${playlistImage}
            </div>
            <div class="playlist-info">
                <div class="playlist-type">PLAYLIST</div>
                <h1 class="playlist-title">${playlist.name}</h1>
                <div class="playlist-description">${playlist.description || ''}</div>
                <div class="playlist-meta">
                    <span class="playlist-owner">${playlist.owner || 'Your Library'}</span>
                    <span class="playlist-tracks">${playlist.tracks || 0} songs</span>
                </div>
            </div>
        `;
        
        return header;
    }
    
    // Create track list for detail view
    createTrackList(tracks, playlist) {
        const trackListContainer = document.createElement('div');
        trackListContainer.className = 'playlist-tracks-container';
        
        const trackListHeader = document.createElement('div');
        trackListHeader.className = 'track-list-header';
        trackListHeader.innerHTML = `
            <div class="track-list-row">
                <div class="track-column track-number">#</div>
                <div class="track-column track-title">TITLE</div>
                <div class="track-column track-album">ALBUM</div>
                <div class="track-column track-date-added">DATE ADDED</div>
                <div class="track-column track-duration">
                    <i class="far fa-clock"></i>
                </div>
            </div>
        `;
        
        const trackListContent = document.createElement('div');
        trackListContent.className = 'track-list-content';
        
        if (tracks.length === 0) {
            trackListContent.innerHTML = `
                <div class="empty-playlist">
                    <p>This playlist is empty</p>
                    <button class="add-songs-btn">Add Songs</button>
                </div>
            `;
            
            // Add event listener to add songs button
            const addSongsBtn = trackListContent.querySelector('.add-songs-btn');
            if (addSongsBtn) {
                addSongsBtn.addEventListener('click', () => {
                    window.location.href = 'search.html?action=add-to-playlist&id=' + playlist.id;
                });
            }
        } else {
            tracks.forEach((track, index) => {
                const trackRow = document.createElement('div');
                trackRow.className = 'track-list-row';
                
                const formattedDate = track.addedAt 
                    ? new Date(track.addedAt).toLocaleDateString() 
                    : '';
                
                const trackCover = track.cover 
                    ? `<img src="${track.cover}" alt="${track.title}" class="track-cover">` 
                    : `<div class="track-cover placeholder-img" style="background-color: ${track.color || '#1E3264'}">
                        <i class="fas fa-music"></i>
                       </div>`;
                
                trackRow.innerHTML = `
                    <div class="track-column track-number">${index + 1}</div>
                    <div class="track-column track-title">
                        <div class="track-title-flex">
                            ${trackCover}
                            <div class="track-text">
                                <div class="track-name">${track.title}</div>
                                <div class="track-artist">${track.artist}</div>
                            </div>
                        </div>
                    </div>
                    <div class="track-column track-album">${track.album}</div>
                    <div class="track-column track-date-added">${formattedDate}</div>
                    <div class="track-column track-duration">${window.musicPlayer.constructor.formatTime(track.duration)}</div>
                    <div class="track-actions">
                        <button class="track-action-btn track-play">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="track-action-btn track-remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Add play functionality
                const playBtn = trackRow.querySelector('.track-play');
                if (playBtn) {
                    playBtn.addEventListener('click', () => {
                        // Find track in playlist
                        if (window.musicPlayer) {
                            window.musicPlayer.play(index);
                        }
                    });
                }
                
                // Add remove functionality
                const removeBtn = trackRow.querySelector('.track-remove');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        if (confirm(`Remove "${track.title}" from this playlist?`)) {
                            this.removeTrackFromPlaylist(playlist.id, index, track.url);
                            trackRow.remove();
                        }
                    });
                }
                
                trackListContent.appendChild(trackRow);
            });
        }
        
        trackListContainer.appendChild(trackListHeader);
        trackListContainer.appendChild(trackListContent);
        
        return trackListContainer;
    }
    
    // Handle user login event
    async handleUserLogin() {
        // Reload playlists from Spotify
        await this.loadSpotifyPlaylists();
        this.renderPlaylists();
    }
    
    // Handle user logout event
    handleUserLogout() {
        // Remove remote playlists
        this.playlists = this.playlists.filter(p => !p.isRemote);
        this.renderPlaylists();
    }
    
    // Show success message
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Show error message
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Create instance once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.playlistManager = new PlaylistManager();
}); 