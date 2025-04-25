# Spotify Clone

A frontend web application that replicates the core functionality and UI of Spotify, built with vanilla JavaScript, HTML, and CSS.

## Overview

This project is a responsive web-based Spotify clone that demonstrates modern web development practices. It includes features such as music playback, search functionality, playlist management, and user authentication, all with a clean and responsive UI that resembles the original Spotify web player.

## Features

- **Music Playback**: Play, pause, skip tracks, adjust volume, and control playback progress
- **Search**: Search for tracks, artists, albums, and playlists
- **Responsive Design**: Works across desktop and mobile devices
- **Playlist Management**: Create, view, and manage playlists 
- **User Authentication**: Login and user profile management
- **Spotify API Integration**: Connect with Spotify's Web API and Web Playback SDK (in demo mode)

## Tech Stack

- HTML5 
- CSS3 (with custom animations and transitions)
- Vanilla JavaScript (ES6+)
- Spotify Web API (demo mode)
- HTTP Server (Python Simple HTTP Server)

## Project Structure

```
spotify-clone/
├── assets/                # Static assets
│   ├── music/             # Sample music files
│   ├── images/            # Images for UI elements
│   └── icons/             # Icon files
├── css/                   # Stylesheets
│   ├── reset.css          # CSS reset
│   ├── style.css          # Main stylesheet
│   ├── search.css         # Search page styles
│   └── library.css        # Library page styles
├── js/                    # JavaScript files
│   ├── app.js             # Main application logic
│   ├── music-player.js    # Music player functionality
│   ├── spotify-api.js     # Spotify API integration
│   ├── search.js          # Search functionality
│   ├── user-auth.js       # User authentication
│   ├── playlist-manager.js # Playlist management
│   ├── library.js         # Library page functionality
│   └── debug.js           # Debugging utilities
├── index.html             # Home page
├── search.html            # Search page
├── library.html           # Library/playlists page
├── callback.html          # OAuth callback handler
└── README.md              # Project documentation
```

## Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spotify-clone.git
cd spotify-clone
```

2. Start a local server (requires Python):
```bash
# For Python 3
python3 -m http.server 8000

# For Python 2
python -m SimpleHTTPServer 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## Usage

- **Home Page**: Browse featured playlists and recommendations
- **Search**: Find tracks, artists, albums, and playlists
- **Player Controls**: Play, pause, skip, adjust volume at the bottom of the page
- **Create Playlist**: Add and organize tracks in custom playlists

## Demo Mode

The application runs in demo mode, where it simulates connections to the Spotify API without requiring actual authentication. This allows you to experience the full functionality without needing a Spotify account.

## Future Enhancements

- Implement full authentication with Spotify
- Add real-time data synchronization
- Enhance offline functionality
- Add social sharing features
- Improve accessibility features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Spotify for inspiration and web API documentation
- Font Awesome for icons
- SampleLib for providing sample audio files 