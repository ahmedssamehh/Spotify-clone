/**
 * Search module for Spotify Clone
 * Handles search functionality and results display
 */

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.resultsContainer = document.getElementById('results-container');
        this.spotifyAPI = window.spotifyAPI;
        this.debounceTimeout = null;
        this.lastQuery = '';
        
        this.init();
    }
    
    init() {
        // Initialize event listeners
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                }
            });
        }
    }
    
    handleSearchInput(query) {
        clearTimeout(this.debounceTimeout);
        
        if (query.trim().length < 2) {
            this.clearResults();
            return;
        }
        
        // Debounce search to prevent too many API calls
        this.debounceTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }
    
    async performSearch(query) {
        if (query === this.lastQuery) return;
        this.lastQuery = query;
        
        try {
            const results = await this.spotifyAPI.search(query, ['track', 'artist', 'album', 'playlist']);
            this.displayResults(results);
        } catch (error) {
            console.error('Search error:', error);
            this.displayError('An error occurred while searching. Please try again.');
        }
    }
    
    displayResults(results) {
        this.clearResults();
        
        if (!this.resultsContainer) {
            console.error('Results container not found');
            return;
        }
        
        // Show results container
        this.resultsContainer.classList.remove('hidden');
        
        // Check if we have results
        const hasResults = results && (
            (results.tracks && results.tracks.items.length > 0) ||
            (results.artists && results.artists.items.length > 0) ||
            (results.albums && results.albums.items.length > 0) ||
            (results.playlists && results.playlists.items.length > 0)
        );
        
        if (!hasResults) {
            this.displayNoResults();
            return;
        }
        
        // Create sections for each result type
        if (results.tracks && results.tracks.items.length > 0) {
            this.createResultSection('Tracks', results.tracks.items, this.renderTrackItem);
        }
        
        if (results.artists && results.artists.items.length > 0) {
            this.createResultSection('Artists', results.artists.items, this.renderArtistItem);
        }
        
        if (results.albums && results.albums.items.length > 0) {
            this.createResultSection('Albums', results.albums.items, this.renderAlbumItem);
        }
        
        if (results.playlists && results.playlists.items.length > 0) {
            this.createResultSection('Playlists', results.playlists.items, this.renderPlaylistItem);
        }
    }
    
    createResultSection(title, items, renderFunction) {
        const section = document.createElement('div');
        section.className = 'result-section';
        
        const sectionTitle = document.createElement('h2');
        sectionTitle.textContent = title;
        section.appendChild(sectionTitle);
        
        const grid = document.createElement('div');
        grid.className = 'result-grid';
        
        // Display up to 8 items per section
        const itemsToDisplay = items.slice(0, 8);
        itemsToDisplay.forEach(item => {
            const itemElement = renderFunction.call(this, item);
            grid.appendChild(itemElement);
        });
        
        section.appendChild(grid);
        this.searchResults.appendChild(section);
    }
    
    renderTrackItem(track) {
        const item = document.createElement('div');
        item.className = 'track-item search-result-item';
        item.dataset.uri = track.uri;
        item.dataset.id = track.id;
        
        const imgUrl = track.album.images && track.album.images.length > 0 
            ? track.album.images[0].url 
            : 'img/default-album.png';
        
        const artists = track.artists.map(artist => artist.name).join(', ');
        
        item.innerHTML = `
            <div class="item-img">
                <img src="${imgUrl}" alt="${track.name}">
                <button class="play-button" aria-label="Play ${track.name}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="item-info">
                <div class="item-title">${track.name}</div>
                <div class="item-description">${artists}</div>
            </div>
        `;
        
        item.querySelector('.play-button').addEventListener('click', (e) => {
            e.stopPropagation();
            window.musicPlayerService.playTrack(track);
        });
        
        return item;
    }
    
    renderArtistItem(artist) {
        const item = document.createElement('div');
        item.className = 'artist-item search-result-item';
        item.dataset.uri = artist.uri;
        item.dataset.id = artist.id;
        
        const imgUrl = artist.images && artist.images.length > 0 
            ? artist.images[0].url 
            : 'img/default-artist.png';
        
        item.innerHTML = `
            <div class="item-img rounded">
                <img src="${imgUrl}" alt="${artist.name}">
                <button class="play-button" aria-label="Play ${artist.name}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="item-info">
                <div class="item-title">${artist.name}</div>
                <div class="item-description">Artist</div>
            </div>
        `;
        
        item.querySelector('.play-button').addEventListener('click', (e) => {
            e.stopPropagation();
            window.musicPlayerService.playContext(artist.uri);
        });
        
        return item;
    }
    
    renderAlbumItem(album) {
        const item = document.createElement('div');
        item.className = 'album-item search-result-item';
        item.dataset.uri = album.uri;
        item.dataset.id = album.id;
        
        const imgUrl = album.images && album.images.length > 0 
            ? album.images[0].url 
            : 'img/default-album.png';
        
        const artists = album.artists.map(artist => artist.name).join(', ');
        
        item.innerHTML = `
            <div class="item-img">
                <img src="${imgUrl}" alt="${album.name}">
                <button class="play-button" aria-label="Play ${album.name}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="item-info">
                <div class="item-title">${album.name}</div>
                <div class="item-description">${artists}</div>
            </div>
        `;
        
        item.querySelector('.play-button').addEventListener('click', (e) => {
            e.stopPropagation();
            window.musicPlayerService.playContext(album.uri);
        });
        
        return item;
    }
    
    renderPlaylistItem(playlist) {
        const item = document.createElement('div');
        item.className = 'playlist-item search-result-item';
        item.dataset.uri = playlist.uri;
        item.dataset.id = playlist.id;
        
        const imgUrl = playlist.images && playlist.images.length > 0 
            ? playlist.images[0].url 
            : 'img/default-playlist.png';
        
        item.innerHTML = `
            <div class="item-img">
                <img src="${imgUrl}" alt="${playlist.name}">
                <button class="play-button" aria-label="Play ${playlist.name}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="item-info">
                <div class="item-title">${playlist.name}</div>
                <div class="item-description">Playlist • ${playlist.owner.display_name}</div>
            </div>
        `;
        
        item.querySelector('.play-button').addEventListener('click', (e) => {
            e.stopPropagation();
            window.musicPlayerService.playContext(playlist.uri);
        });
        
        return item;
    }
    
    displayNoResults() {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <p>No results found for "${this.lastQuery}"</p>
            <p>Check the spelling or try different keywords.</p>
        `;
        
        this.searchResults.appendChild(noResults);
    }
    
    displayError(message) {
        this.clearResults();
        
        const errorElement = document.createElement('div');
        errorElement.className = 'search-error';
        errorElement.textContent = message;
        
        this.searchResults.appendChild(errorElement);
    }
    
    clearResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
        }
    }
}

// Initialize search when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});
