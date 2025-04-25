// Search page functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    const clearBtn = document.querySelector('.clear-btn');
    const browseSection = document.querySelector('.browse-all-section');
    
    // Clear button functionality
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.focus();
            toggleResultsSection(false);
        });
    }
    
    // Search input functionality
    if (searchInput) {
        // Handle showing/hiding clear button
        searchInput.addEventListener('input', function() {
            if (this.value.length > 0) {
                clearBtn.style.display = 'block';
                // After a small delay, show results section
                setTimeout(() => {
                    toggleResultsSection(true);
                }, 300);
            } else {
                clearBtn.style.display = 'none';
                toggleResultsSection(false);
            }
        });
        
        // Handle Enter key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && this.value.trim().length > 0) {
                performSearch(this.value.trim());
            }
        });
    }
    
    // Function to toggle between browse and results sections
    function toggleResultsSection(showResults) {
        if (showResults) {
            browseSection.style.display = 'none';
            
            // Check if results section exists, if not create it
            let resultsSection = document.querySelector('.search-results-section');
            if (!resultsSection) {
                resultsSection = createResultsSection();
                browseSection.parentNode.appendChild(resultsSection);
            }
            
            resultsSection.classList.add('active');
        } else {
            browseSection.style.display = 'block';
            const resultsSection = document.querySelector('.search-results-section');
            if (resultsSection) {
                resultsSection.classList.remove('active');
            }
        }
    }
    
    // Function to create a results section
    function createResultsSection() {
        const section = document.createElement('section');
        section.className = 'search-results-section';
        
        // Create the header with filter options
        const header = document.createElement('div');
        header.className = 'search-results-header';
        
        const typeList = document.createElement('div');
        typeList.className = 'results-type-list';
        
        const types = ['All', 'Songs', 'Artists', 'Playlists', 'Albums', 'Podcasts & Shows'];
        types.forEach((type, index) => {
            const btn = document.createElement('button');
            btn.className = 'results-type-btn' + (index === 0 ? ' active' : '');
            btn.textContent = type;
            
            btn.addEventListener('click', function() {
                // Update active state
                document.querySelectorAll('.results-type-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                
                // Here you would filter the results by type
                filterResultsByType(type.toLowerCase());
            });
            
            typeList.appendChild(btn);
        });
        
        header.appendChild(typeList);
        section.appendChild(header);
        
        // Create placeholder results
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'recommendation-grid';
        
        // Add placeholder results cards
        for (let i = 0; i < 5; i++) {
            const card = createResultCard();
            resultsGrid.appendChild(card);
        }
        
        section.appendChild(resultsGrid);
        
        return section;
    }
    
    // Function to create a result card
    function createResultCard() {
        const card = document.createElement('div');
        card.className = 'card';
        
        const imgContainer = document.createElement('div');
        imgContainer.className = 'card-img-container';
        
        const placeholderImg = document.createElement('div');
        placeholderImg.className = 'placeholder-img';
        placeholderImg.style.backgroundColor = getRandomColor();
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-music';
        placeholderImg.appendChild(icon);
        
        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        
        imgContainer.appendChild(placeholderImg);
        imgContainer.appendChild(playBtn);
        
        const title = document.createElement('h3');
        title.textContent = 'Search Result';
        
        const description = document.createElement('p');
        description.textContent = 'Artist • Album';
        
        card.appendChild(imgContainer);
        card.appendChild(title);
        card.appendChild(description);
        
        return card;
    }
    
    // Function to perform search
    function performSearch(query) {
        console.log(`Searching for: ${query}`);
        // In a real app, this would call an API to get search results
        // For this demo, we just show the results section
        toggleResultsSection(true);
        
        // Update the results section with the query
        const resultsSection = document.querySelector('.search-results-section');
        if (resultsSection) {
            const cardTitles = resultsSection.querySelectorAll('.card h3');
            cardTitles.forEach((title, index) => {
                title.textContent = `Result ${index + 1} for "${query}"`;
            });
        }
    }
    
    // Function to filter results by type
    function filterResultsByType(type) {
        console.log(`Filtering by type: ${type}`);
        // In a real app, this would filter the actual results
        // For this demo, we don't do anything
    }
    
    // Helper function to get random color
    function getRandomColor() {
        const colors = [
            '#1E3264', '#E61E32', '#8D67AB', '#E8115B', 
            '#148A08', '#BC5900', '#509BF5', '#BA5D07',
            '#7358FF', '#E51D32', '#7D4698'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}); 