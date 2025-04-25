// User Authentication Module
class UserAuth {
    constructor() {
        this.isLoggedIn = false;
        this.userProfile = null;
        this.authButton = document.getElementById('auth-button');
        this.userInfoElement = document.getElementById('user-info');
        this.userMenuToggle = document.getElementById('user-menu-toggle');
        this.userMenu = document.getElementById('user-menu');
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Check if Spotify API is available
        if (!window.spotifyAPI) {
            console.warn('Spotify API not available. Authentication features will be limited.');
            this.updateUIForLoggedOutState();
            return;
        }
        
        try {
            // Try to initialize Spotify API connection
            await window.spotifyAPI.init();
            
            // If initialization succeeded, the user might be logged in
            if (window.spotifyAPI.isTokenValid()) {
                await this.fetchUserProfile();
            } else {
                this.updateUIForLoggedOutState();
            }
        } catch (error) {
            console.warn('Authentication required:', error);
            this.updateUIForLoggedOutState();
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Login/logout button
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
        if (this.userMenuToggle && this.userMenu) {
            this.userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.userMenu.classList.toggle('visible');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.userMenu && this.userMenu.classList.contains('visible')) {
                    if (!this.userMenu.contains(e.target) && e.target !== this.userMenuToggle) {
                        this.userMenu.classList.remove('visible');
                    }
                }
            });
        }
    }
    
    async login() {
        if (!window.spotifyAPI) {
            console.error('Spotify API not available');
            this.showAlert('Authentication service is not available');
            return;
        }
        
        try {
            // Redirect to Spotify authentication
            window.spotifyAPI.authenticate();
        } catch (error) {
            console.error('Authentication error:', error);
            this.showAlert('Authentication failed. Please try again.');
        }
    }
    
    logout() {
        if (window.spotifyAPI) {
            window.spotifyAPI.logout();
        }
        
        this.isLoggedIn = false;
        this.userProfile = null;
        this.updateUIForLoggedOutState();
        
        // Reload the page to clear any user-specific data
        // We could do a more sophisticated state clear without reload in a real app
        window.location.reload();
    }
    
    async fetchUserProfile() {
        try {
            const profile = await window.spotifyAPI.getUserProfile();
            
            if (profile) {
                this.userProfile = profile;
                this.isLoggedIn = true;
                this.updateUIForLoggedInState();
            } else {
                this.updateUIForLoggedOutState();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            this.updateUIForLoggedOutState();
        }
    }
    
    updateUIForLoggedInState() {
        document.body.classList.add('user-logged-in');
        
        if (this.authButton) {
            this.authButton.textContent = 'Log Out';
            this.authButton.classList.add('logged-in');
        }
        
        if (this.userInfoElement && this.userProfile) {
            // Display user info
            const userImage = this.userProfile.images && this.userProfile.images.length > 0
                ? `<img src="${this.userProfile.images[0].url}" alt="${this.userProfile.display_name}" class="user-avatar">`
                : `<div class="user-avatar-placeholder"><i class="fas fa-user"></i></div>`;
                
            this.userInfoElement.innerHTML = `
                ${userImage}
                <span class="user-name">${this.userProfile.display_name}</span>
            `;
            this.userInfoElement.style.display = 'flex';
        }
        
        if (this.userMenuToggle) {
            this.userMenuToggle.style.display = 'block';
        }
        
        // Update user menu if it exists
        if (this.userMenu) {
            const premiumStatus = this.userProfile.product === 'premium'
                ? '<span class="premium-badge">Premium</span>'
                : '';
                
            this.userMenu.innerHTML = `
                <div class="user-menu-header">
                    <div class="user-profile">
                        ${this.userProfile.images && this.userProfile.images.length > 0
                            ? `<img src="${this.userProfile.images[0].url}" alt="${this.userProfile.display_name}" class="user-avatar">`
                            : `<div class="user-avatar-placeholder"><i class="fas fa-user"></i></div>`
                        }
                        <div class="user-details">
                            <div class="user-name">${this.userProfile.display_name}</div>
                            <div class="user-email">${this.userProfile.email || ''}</div>
                            ${premiumStatus}
                        </div>
                    </div>
                </div>
                <div class="user-menu-options">
                    <a href="#" class="menu-option" id="view-profile">
                        <i class="fas fa-user"></i> View Profile
                    </a>
                    <a href="#" class="menu-option" id="account-settings">
                        <i class="fas fa-cog"></i> Account Settings
                    </a>
                    <a href="#" class="menu-option" id="logout">
                        <i class="fas fa-sign-out-alt"></i> Log Out
                    </a>
                </div>
            `;
            
            // Add event listener for menu options
            const logoutOption = this.userMenu.querySelector('#logout');
            if (logoutOption) {
                logoutOption.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        }
        
        // Dispatch login event
        this.dispatchAuthEvent('login', this.userProfile);
    }
    
    updateUIForLoggedOutState() {
        document.body.classList.remove('user-logged-in');
        
        if (this.authButton) {
            this.authButton.textContent = 'Log In';
            this.authButton.classList.remove('logged-in');
        }
        
        if (this.userInfoElement) {
            this.userInfoElement.style.display = 'none';
        }
        
        if (this.userMenuToggle) {
            this.userMenuToggle.style.display = 'none';
        }
        
        // Clear user menu if it exists
        if (this.userMenu) {
            this.userMenu.innerHTML = '';
        }
        
        // Dispatch logout event
        this.dispatchAuthEvent('logout');
    }
    
    showAlert(message) {
        // Create alert element
        const alertElement = document.createElement('div');
        alertElement.className = 'auth-alert';
        alertElement.textContent = message;
        
        // Add to body
        document.body.appendChild(alertElement);
        
        // Remove after a few seconds
        setTimeout(() => {
            alertElement.remove();
        }, 3000);
    }
    
    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: { user: data }
        });
        document.dispatchEvent(event);
    }
    
    // Check if user is logged in
    isAuthenticated() {
        return this.isLoggedIn;
    }
    
    // Get user profile
    getUserProfile() {
        return this.userProfile;
    }
    
    // Check if user has premium
    hasPremium() {
        return this.userProfile && this.userProfile.product === 'premium';
    }
}

// Create instance once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userAuth = new UserAuth();
}); 