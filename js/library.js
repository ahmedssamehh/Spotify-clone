// Library page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Filter buttons functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // In a real app, this would filter the library items
            filterLibrary(this.textContent.trim().toLowerCase());
        });
    });
    
    // Toggle grid view
    const gridViewBtn = document.querySelector('.grid-view-btn');
    const libraryGrid = document.querySelector('.library-grid');
    
    if (gridViewBtn && libraryGrid) {
        gridViewBtn.addEventListener('click', function() {
            libraryGrid.classList.toggle('grid-view');
            
            // Change icon based on view
            const icon = this.querySelector('i');
            if (libraryGrid.classList.contains('grid-view')) {
                icon.className = 'fas fa-list';
            } else {
                icon.className = 'fas fa-grip-horizontal';
            }
        });
    }
    
    // Search library functionality
    const searchLibraryBtn = document.querySelector('.search-library-btn');
    
    if (searchLibraryBtn) {
        searchLibraryBtn.addEventListener('click', function() {
            // Create a search input if it doesn't exist
            let searchInput = document.querySelector('.search-library-input');
            
            if (!searchInput) {
                // Create a search overlay
                const searchOverlay = document.createElement('div');
                searchOverlay.className = 'search-library-overlay';
                
                // Create search container
                const searchContainer = document.createElement('div');
                searchContainer.className = 'search-input-container';
                
                // Create search icon
                const searchIcon = document.createElement('i');
                searchIcon.className = 'fas fa-search';
                
                // Create input
                searchInput = document.createElement('input');
                searchInput.className = 'search-input search-library-input';
                searchInput.placeholder = 'Search in Your Library';
                
                // Create close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'clear-btn';
                closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                
                // Add all elements to the DOM
                searchContainer.appendChild(searchIcon);
                searchContainer.appendChild(searchInput);
                searchContainer.appendChild(closeBtn);
                searchOverlay.appendChild(searchContainer);
                
                // Add the overlay to the top bar
                const topBar = document.querySelector('.top-bar');
                topBar.appendChild(searchOverlay);
                
                // Slide in the overlay
                setTimeout(() => {
                    searchOverlay.style.opacity = '1';
                }, 10);
                
                // Auto focus the input
                searchInput.focus();
                
                // Handle close button
                closeBtn.addEventListener('click', function() {
                    searchOverlay.style.opacity = '0';
                    setTimeout(() => {
                        searchOverlay.remove();
                    }, 300);
                });
                
                // Handle search input
                searchInput.addEventListener('input', function() {
                    searchLibraryItems(this.value.trim().toLowerCase());
                });
            }
        });
    }
    
    // Sort by recents dropdown
    const recentsBtn = document.querySelector('.recents-btn');
    
    if (recentsBtn) {
        recentsBtn.addEventListener('click', function() {
            // Check if dropdown exists
            let sortDropdown = document.querySelector('.sort-dropdown');
            
            if (!sortDropdown) {
                // Create dropdown
                sortDropdown = document.createElement('div');
                sortDropdown.className = 'sort-dropdown';
                
                // Create options
                const options = ['Recents', 'Recently Added', 'Alphabetical', 'Creator'];
                
                options.forEach(option => {
                    const optionElem = document.createElement('button');
                    optionElem.className = 'sort-option';
                    optionElem.textContent = option;
                    
                    // Mark the current sort as selected
                    if (option === 'Recents') {
                        optionElem.classList.add('selected');
                    }
                    
                    // Handle option click
                    optionElem.addEventListener('click', function() {
                        // Update button text
                        recentsBtn.querySelector('span').textContent = option;
                        
                        // In a real app, this would sort the library items
                        sortLibrary(option.toLowerCase());
                        
                        // Close dropdown
                        sortDropdown.remove();
                    });
                    
                    sortDropdown.appendChild(optionElem);
                });
                
                // Position and show dropdown
                const rect = recentsBtn.getBoundingClientRect();
                sortDropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
                sortDropdown.style.left = `${rect.left + window.scrollX}px`;
                
                // Add to DOM
                document.body.appendChild(sortDropdown);
                
                // Close when clicking outside
                document.addEventListener('click', function closeDropdown(e) {
                    if (!sortDropdown.contains(e.target) && e.target !== recentsBtn) {
                        sortDropdown.remove();
                        document.removeEventListener('click', closeDropdown);
                    }
                });
            }
        });
    }
    
    // Functions for filtering, sorting, and searching
    function filterLibrary(type) {
        console.log(`Filtering library by: ${type}`);
        // This would filter the library items based on type
        // For this demo, we don't actually filter anything
    }
    
    function sortLibrary(by) {
        console.log(`Sorting library by: ${by}`);
        // This would sort the library items
        // For this demo, we don't actually sort anything
    }
    
    function searchLibraryItems(query) {
        console.log(`Searching library for: ${query}`);
        
        const libraryItems = document.querySelectorAll('.library-item');
        
        if (query === '') {
            // Show all items if search is empty
            libraryItems.forEach(item => {
                item.style.display = 'flex';
            });
            return;
        }
        
        // Simple search through titles
        libraryItems.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const description = item.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(query) || description.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
}); 