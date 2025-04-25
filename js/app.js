// Spotify Clone - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Player elements
    const playPauseBtn = document.querySelector('.play-pause');
    const previousBtn = document.querySelector('.previous');
    const nextBtn = document.querySelector('.next');
    const shuffleBtn = document.querySelector('.shuffle');
    const repeatBtn = document.querySelector('.repeat');
    const volumeBar = document.querySelector('.volume-bar');
    const volumeLevel = document.querySelector('.volume-level');
    const volumeHandle = document.querySelector('.volume-handle');
    const progressBar = document.querySelector('.progress-bar');
    const progress = document.querySelector('.progress');
    const progressHandle = document.querySelector('.progress-handle');
    const currentTimeDisplay = document.querySelector('.current-time');
    const totalTimeDisplay = document.querySelector('.total-time');
    const likeBtn = document.querySelector('.like-btn');
    const trackNameDisplay = document.querySelector('.track-name');
    const artistNameDisplay = document.querySelector('.artist-name');
    const currentSongImg = document.querySelector('.current-song-img');
    
    // Cards and featured items with play buttons
    const cards = document.querySelectorAll('.card');
    const featuredItems = document.querySelectorAll('.featured-item');
    
    // Connect to the music player service
    initMusicPlayer();
    
    // Initialize connections to the music player service
    function initMusicPlayer() {
        if (!window.musicPlayer) {
            console.error('Music player service not found!');
            return;
        }

        const player = window.musicPlayer;
        
        // Set up event listeners for player controls
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', function() {
                player.togglePlay();
            });
        }
        
        if (previousBtn) {
            previousBtn.addEventListener('click', function() {
                player.previous();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                player.next();
            });
        }
        
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', function() {
                const isShuffled = player.toggleShuffle();
                this.classList.toggle('active', isShuffled);
            });
        }
        
        if (repeatBtn) {
            repeatBtn.addEventListener('click', function() {
                const repeatMode = player.toggleRepeat();
                
                // Update UI based on repeat mode
                this.classList.remove('mode-all', 'mode-one');
                if (repeatMode === 'all') {
                    this.classList.add('mode-all');
                    this.innerHTML = '<i class="fas fa-redo"></i>';
                } else if (repeatMode === 'one') {
                    this.classList.add('mode-one');
                    this.innerHTML = '<i class="fas fa-redo-alt"></i><span class="repeat-one">1</span>';
                } else {
                    this.innerHTML = '<i class="fas fa-redo"></i>';
                }
            });
        }
        
        // Volume control
        if (volumeBar) {
            volumeBar.addEventListener('click', function(e) {
                const rect = volumeBar.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.min(Math.max(x / rect.width, 0), 1);
                
                player.setVolume(percent);
            });
        }

        // Progress bar
        if (progressBar) {
            progressBar.addEventListener('click', function(e) {
                const rect = progressBar.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.min(Math.max(x / rect.width, 0), 1);
                
                const duration = player.getProgress().duration;
                player.seek(percent * duration);
            });
        }

        // Like button
        if (likeBtn) {
            likeBtn.addEventListener('click', function() {
                const icon = likeBtn.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    icon.style.color = '#1db954';
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    icon.style.color = '';
                }
            });
        }
        
        // Play button on cards hover effect
        cards.forEach((card, index) => {
            const playBtn = card.querySelector('.play-btn');
            
            if (playBtn) {
                playBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    player.play(index % player.playlist.length);
                });
            }
        });

        // Featured items play button
        featuredItems.forEach((item, index) => {
            const playBtn = item.querySelector('.play-btn');
            
            if (playBtn) {
                playBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    player.play(index % player.playlist.length);
                });
            }
        });
        
        // Register callbacks from the music player
        player.on('onPlayStateChanged', isPlaying => {
            if (playPauseBtn) {
                playPauseBtn.innerHTML = isPlaying 
                    ? '<i class="fas fa-pause"></i>' 
                    : '<i class="fas fa-play"></i>';
            }
        });
        
        player.on('onTrackChanged', track => {
            if (track) {
                if (trackNameDisplay) trackNameDisplay.textContent = track.title;
                if (artistNameDisplay) artistNameDisplay.textContent = track.artist;
                
                // Update current song image
                if (currentSongImg) {
                    // If it's a placeholder div with an icon
                    if (currentSongImg.classList.contains('placeholder-img')) {
                        currentSongImg.style.backgroundColor = track.color;
                    } 
                    // If it's an img element
                    else if (currentSongImg.tagName === 'IMG') {
                        currentSongImg.src = track.cover;
                    }
                }
                
                // Update total time display
                if (totalTimeDisplay) {
                    totalTimeDisplay.textContent = MusicPlayerService.formatTime(track.duration);
                }
            }
        });
        
        player.on('onVolumeChanged', volume => {
            if (volumeLevel) {
                volumeLevel.style.width = `${volume * 100}%`;
            }
        });
        
        player.on('onProgressChanged', progressData => {
            if (progress) {
                progress.style.width = `${progressData.percentage}%`;
            }
            
            if (currentTimeDisplay) {
                currentTimeDisplay.textContent = MusicPlayerService.formatTime(progressData.currentTime);
            }
        });
    }

    // Mobile navigation
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const sidebar = document.querySelector('.sidebar');
    
    function handleScreenSizeChange(e) {
        if (e.matches) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }
    
    mediaQuery.addEventListener('change', handleScreenSizeChange);
    handleScreenSizeChange(mediaQuery);
}); 