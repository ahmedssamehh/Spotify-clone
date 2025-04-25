// Debug script for troubleshooting music playback
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded');
    
    // Check if necessary components are available
    console.log('Player Services:', {
        musicPlayer: !!window.musicPlayer,
        spotifyAPI: !!window.spotifyAPI,
        searchManager: !!window.searchManager
    });
    
    // Debug music files
    const testAudio = new Audio();
    testAudio.addEventListener('canplaythrough', function() {
        console.log('🟢 Audio file can be played:', testAudio.src);
    });
    
    testAudio.addEventListener('error', function() {
        console.error('🔴 Error loading audio file:', testAudio.src, testAudio.error);
    });
    
    // Test loading each sample
    setTimeout(() => {
        console.log('Attempting to load sample audio files:');
        ['assets/music/sample1.mp3', 'assets/music/sample2.mp3', 'assets/music/sample3.mp3', 
         'assets/music/sample4.mp3', 'assets/music/sample5.mp3'].forEach(src => {
            console.log('Testing:', src);
            testAudio.src = src;
            testAudio.load();
        });
    }, 2000);
    
    // Debug player functionality
    if (window.musicPlayer) {
        console.log('Music player playlist:', window.musicPlayer.playlist);
        
        // Add event logging
        window.musicPlayer.on('onPlayStateChanged', isPlaying => {
            console.log('Play state changed:', isPlaying);
        });
        
        window.musicPlayer.on('onTrackChanged', track => {
            console.log('Track changed:', track);
        });
        
        window.musicPlayer.on('onProgressChanged', progress => {
            // Log less frequently to avoid console spam
            if (Math.floor(progress.currentTime) % 5 === 0) {
                console.log('Progress:', progress);
            }
        });
        
        window.musicPlayer.on('onError', error => {
            console.error('Player error:', error);
        });
        
        // Replace the play button click with a debug version
        const playPauseBtn = document.querySelector('.play-pause');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', function(e) {
                console.log('Play/Pause button clicked');
                try {
                    window.musicPlayer.togglePlay();
                } catch (error) {
                    console.error('Error toggling play:', error);
                }
                e.stopPropagation();
            }, true);
        }
    }
}); 