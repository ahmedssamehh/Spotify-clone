// User Authentication
class UserAuthService {
    constructor() {
        this.isLoggedIn = false;
        this.userProfile = null;
        
        // DOM elements
        this.authButton = document.getElementById('auth-button');
        this.userInfo = document.getElementById('user-info');
        this.userMenuToggle = document.getElementById('user-menu-toggle');
        this.userMenu = document.getElementById('user-menu');
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Check if we're already logged in with Spotify
        if (window.spotifyAPI) {
            try {
                await window.spotifyAPI.init();
                
                if (window.spotifyAPI.isTokenValid()) {
                    // We have a valid token, fetch user profile
                    await this.loadUserProfile();
                } else {
                    // Not logged in
                    this.showLoggedOutState();
                }
            } catch (error) {
                console.warn('Not authenticated with Spotify:', error);
                this.showLoggedOutState();
            }
        } else {
            console.warn('Spotify API not available');
            this.showLoggedOutState();
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Auth button click
        if (this.authButton) {
            this.authButton.addEventListener('click', () => {
                if (this.isLoggedIn) {
                    this.logout();
                } else {
                    this.login();
                }
            });
        }
        
        // User menu toggle
        if (this.userMenuToggle) {
            this.userMenuToggle.addEventListener('click', () => {
                this.toggleUserMenu();
            });
            
            // Close menu when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!this.userMenuToggle.contains(e.target) && !this.userMenu.contains(e.target)) {
                    this.userMenu.classList.remove('active');
                }
            });
        }
    }
    
    async loadUserProfile() {
        try {
            // Get user profile from Spotify
            const profile = await window.spotifyAPI.getUserProfile();
            
            this.userProfile = profile;
            this.isLoggedIn = true;
            
            // Update UI
            this.showLoggedInState();
            
            return profile;
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showLoggedOutState();
            return null;
        }
    }
    
    showLoggedInState() {
        this.isLoggedIn = true;
        
        // Hide login button, show user info
        if (this.authButton) {
            this.authButton.style.display = 'none';
        }
        
        if (this.userInfo) {
            this.userInfo.style.display = 'flex';
            
            // Create user info content
            let userImgSrc = 'assets/images/default-profile.png';
            if (this.userProfile && this.userProfile.images && this.userProfile.images.length > 0) {
                userImgSrc = this.userProfile.images[0].url;
            }
            
            const userName = this.userProfile ? this.userProfile.display_name : 'User';
            
            this.userInfo.innerHTML = `
                <div class="profile-img-container">
                    <img src="${userImgSrc}" alt="${userName}" class="profile-img">
                </div>
                <span class="user-name">${userName}</span>
            `;
        }
        
        if (this.userMenuToggle) {
            this.userMenuToggle.style.display = 'flex';
        }
        
        // Create user menu content
        if (this.userMenu) {
            this.userMenu.innerHTML = `
                <ul>
                    <li><a href="#">Account</a></li>
                    <li><a href="#">Profile</a></li>
                    <li><a href="#">Settings</a></li>
                    <li class="divider"></li>
                    <li><a href="#" id="logout-btn">Log out</a></li>
                </ul>
            `;
            
            // Add logout event listener
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('user-authenticated', { 
            detail: { user: this.userProfile }
        }));
    }
    
    showLoggedOutState() {
        this.isLoggedIn = false;
        this.userProfile = null;
        
        // Show login button, hide user info
        if (this.authButton) {
            this.authButton.style.display = 'block';
            this.authButton.textContent = 'Log In';
        }
        
        if (this.userInfo) {
            this.userInfo.style.display = 'none';
            this.userInfo.innerHTML = '';
        }
        
        if (this.userMenuToggle) {
            this.userMenuToggle.style.display = 'none';
        }
        
        if (this.userMenu) {
            this.userMenu.classList.remove('active');
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('user-logged-out'));
    }
    
    login() {
        if (window.spotifyAPI) {
            window.spotifyAPI.authenticate();
        } else {
            alert('Login functionality not available');
        }
    }
    
    logout() {
        if (window.spotifyAPI) {
            window.spotifyAPI.logout();
        }
        
        this.showLoggedOutState();
    }
    
    toggleUserMenu() {
        if (this.userMenu) {
            this.userMenu.classList.toggle('active');
        }
    }
    
    isAuthenticated() {
        return this.isLoggedIn;
    }
    
    getUserProfile() {
        return this.userProfile;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userAuth = new UserAuthService();
}); 