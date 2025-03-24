document.addEventListener("DOMContentLoaded", function () {
    // Deferred initialization pattern - only execute when elements are needed
    let stylesAdded = false;
    let initialized = false;
    
    // Main DOM elements - these will be null until initialized
    let priceTableRows;
    let bottomPriceSwitcher;
    let bottomYearlyText;
    let bottomMonthlyText;
    let topPriceSwitcher;
    let topYearlyText;
    let topMonthlyText;
    let monthlyCard;
    let yearlyCard;
    let syncInProgress = false;
    
    // Add a single initialization event listener to the document that will trigger on first scroll or user interaction
    function addInitListeners() {
        const initializeOnEvent = function() {
            if (!initialized) {
                initialize();
                document.removeEventListener('scroll', initializeOnEvent);
                document.removeEventListener('mousemove', initializeOnEvent);
                document.removeEventListener('click', initializeOnEvent);
                document.removeEventListener('touchstart', initializeOnEvent);
            }
        };
        
        // Add event listeners to initialize on user interaction or scroll
        document.addEventListener('scroll', initializeOnEvent, { passive: true });
        document.addEventListener('mousemove', initializeOnEvent, { passive: true });
        document.addEventListener('click', initializeOnEvent, { passive: true });
        document.addEventListener('touchstart', initializeOnEvent, { passive: true });
        
        // Fallback - initialize after a delay even if no user interaction
        setTimeout(initializeOnEvent, 2500);
    }
    
    // Check if any price table or switcher exists on the page - if not, don't even add listeners
    if (document.querySelector('.price_table-row') || 
        document.querySelector('.price_switcher._2cond') || 
        document.querySelector('.price_switcher.top-one')) {
        
        // Only add minimal styles immediately for visual stability
        addMinimalStyles();
        
        // Add event listeners for lazy initialization
        addInitListeners();
    }
    
    // Add minimal styles immediately to prevent layout shifts
    function addMinimalStyles() {
        if (stylesAdded) return;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Minimal styles for initial rendering */
            .price_table-row {
                grid-template-columns: 3fr 1fr;
            }
            .price_table-cell:nth-child(3) {
                display: none;
            }
        `;
        document.head.appendChild(styleElement);
        
        stylesAdded = true;
    }
    
    // Main initialization function - only called when needed
    function initialize() {
        if (initialized) return;
        
        // Add full CSS for animations and transitions
        addStyles();
        
        // Initialize all DOM references
        initDomReferences();
        
        // Set up price table switcher
        if (priceTableRows && priceTableRows.length > 0 && bottomPriceSwitcher) {
            initBottomSwitcher();
        }
        
        // Set up top price card switcher
        if (topPriceSwitcher && monthlyCard && yearlyCard) {
            initTopSwitcher();
        }
        
        initialized = true;
        console.log("Price switcher initialized");
    }
    
    // Initialize DOM references - only called when needed
    function initDomReferences() {
        priceTableRows = document.querySelectorAll('.price_table-row');
        bottomPriceSwitcher = document.querySelector('.price_switcher._2cond');
        
        if (bottomPriceSwitcher) {
            bottomYearlyText = bottomPriceSwitcher.previousElementSibling; // [switcher-text-1]
            bottomMonthlyText = bottomPriceSwitcher.nextElementSibling; // [switcher-text-2]
        }
        
        topPriceSwitcher = document.querySelector('.price_switcher.top-one');
        
        if (topPriceSwitcher) {
            topYearlyText = topPriceSwitcher.previousElementSibling; // [switcher-text-1]
            topMonthlyText = topPriceSwitcher.nextElementSibling; // [switcher-text-2]
        }
        
        monthlyCard = document.querySelector('.price_cards .price_left.monat');
        yearlyCard = document.querySelector('.price_cards .price_right.year');
    }
    
    // Add full styles for animations and transitions
    function addStyles() {
        if (stylesAdded) return;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Smooth transitions for price tables and cells */
            .price_table-row,
            .price_table-cell,
            .price_swithcer-grab {
                transition: all 0.3s ease-in-out;
            }
            
            /* Card animations */
            .price_left,
            .price_right {
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 1;
                transform: translateY(0);
            }
            
            .price_left.fade-out,
            .price_right.fade-out {
                opacity: 0;
                transform: translateY(10px);
            }
            
            .price_left.hidden,
            .price_right.hidden {
                display: none;
            }
            
            /* Animation helpers */
            .animate-card {
                animation: fadeInUp 0.3s forwards;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(styleElement);
        
        stylesAdded = true;
    }
    
    // Initialize bottom price table switcher
    function initBottomSwitcher() {
        let isYearly = true; // Start with yearly pricing
        
        // Set initial state
        bottomYearlyText.classList.add('text-color-blue');
        bottomYearlyText.classList.remove('text-color-gray');
        bottomMonthlyText.classList.add('text-color-gray');
        bottomMonthlyText.classList.remove('text-color-blue');
        
        // Initial position of grab element
        const grabElement = bottomPriceSwitcher.querySelector('.price_swithcer-grab');
        if (grabElement) {
            grabElement.style.transform = 'translateX(0)';
        }
        
        // Add click event to the switcher
        bottomPriceSwitcher.addEventListener('click', function() {
            isYearly = !isYearly;
            
            // Update switcher visuals
            if (isYearly) {
                // Yearly selected
                bottomYearlyText.classList.add('text-color-blue');
                bottomYearlyText.classList.remove('text-color-gray');
                bottomMonthlyText.classList.add('text-color-gray');
                bottomMonthlyText.classList.remove('text-color-blue');
                
                if (grabElement) {
                    grabElement.style.transform = 'translateX(0)';
                }
            } else {
                // Monthly selected
                bottomYearlyText.classList.add('text-color-gray');
                bottomYearlyText.classList.remove('text-color-blue');
                bottomMonthlyText.classList.add('text-color-blue');
                bottomMonthlyText.classList.remove('text-color-gray');
                
                if (grabElement) {
                    grabElement.style.transform = 'translateX(100%)';
                }
            }
            
            // Update price display - using requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                updatePriceDisplay(isYearly);
            });
            
            // Sync top switcher with bottom switcher state if it exists
            if (topPriceSwitcher && !syncInProgress) {
                syncInProgress = true;
                syncSwitchers(topPriceSwitcher, isYearly);
                syncInProgress = false;
            }
        });
        
        // Initialize to yearly pricing without toggling the state
        // First store the original monthly prices
        storePriceData();
        
        // Apply yearly prices by default
        updatePriceDisplay(true);
    }
    
    // Store original price data for later use
    function storePriceData() {
        priceTableRows.forEach(row => {
            const monthlyCellContent = row.querySelector('.price_table-cell.is-small.is-center .text-weight-semibold');
            if (monthlyCellContent && !monthlyCellContent.getAttribute('data-original')) {
                monthlyCellContent.setAttribute('data-original', monthlyCellContent.textContent);
            }
        });
    }
    
    // Update price display based on selected payment period
    function updatePriceDisplay(isYearly) {
        priceTableRows.forEach(row => {
            // Get both price cells
            const monthlyCellContent = row.querySelector('.price_table-cell.is-small.is-center .text-weight-semibold');
            const yearlyCellContent = row.querySelector('.price_table-cell.is-small:not(.is-center) .text-weight-bold');
            
            // Skip if this row doesn't have price content
            if (!monthlyCellContent || !yearlyCellContent) return;
            
            // Show the appropriate price based on selection
            if (isYearly) {
                // Show yearly price (discount price)
                monthlyCellContent.textContent = yearlyCellContent.textContent;
            } else {
                // Find the original monthly price from stored data
                const originalText = monthlyCellContent.getAttribute('data-original');
                if (originalText) {
                    monthlyCellContent.textContent = originalText;
                }
            }
        });
    }
    
    // Initialize top price card switcher
    function initTopSwitcher() {
        let isYearly = true; // Start with yearly pricing
        
        // Set initial state
        topYearlyText.classList.add('text-color-blue');
        topYearlyText.classList.remove('text-color-gray');
        topMonthlyText.classList.add('text-color-gray');
        topMonthlyText.classList.remove('text-color-blue');
        
        // Initial position of grab element
        const grabElement = topPriceSwitcher.querySelector('.price_swithcer-grab');
        if (grabElement) {
            grabElement.style.transform = 'translateX(0)';
        }
        
        // Set initial card visibility
        monthlyCard.classList.add('hidden');
        yearlyCard.classList.remove('hidden');
        yearlyCard.classList.add('animate-card');
        
        // Add click event to the switcher
        topPriceSwitcher.addEventListener('click', function() {
            isYearly = !isYearly;
            
            // Update switcher visuals with requestAnimationFrame for performance
            requestAnimationFrame(() => {
                updateTopSwitcherVisuals(isYearly, grabElement);
            });
            
            // Sync bottom switcher with top switcher state if it exists
            if (bottomPriceSwitcher && !syncInProgress) {
                syncInProgress = true;
                syncSwitchers(bottomPriceSwitcher, isYearly);
                syncInProgress = false;
            }
        });
    }
    
    // Update top switcher visuals based on selected payment period
    function updateTopSwitcherVisuals(isYearly, grabElement) {
        if (isYearly) {
            // Yearly selected
            topYearlyText.classList.add('text-color-blue');
            topYearlyText.classList.remove('text-color-gray');
            topMonthlyText.classList.add('text-color-gray');
            topMonthlyText.classList.remove('text-color-blue');
            
            if (grabElement) {
                grabElement.style.transform = 'translateX(0)';
            }
            
            // Show yearly card, hide monthly card with animation
            if (monthlyCard && yearlyCard) {
                // First remove any previous animation classes
                yearlyCard.classList.remove('animate-card');
                monthlyCard.classList.remove('animate-card');
                
                // Add fade-out class to monthly card
                monthlyCard.classList.add('fade-out');
                
                // After a short delay, hide monthly and show yearly with animation
                setTimeout(() => {
                    monthlyCard.classList.add('hidden');
                    monthlyCard.classList.remove('fade-out');
                    yearlyCard.classList.remove('hidden');
                    yearlyCard.classList.add('animate-card');
                }, 300);
            }
        } else {
            // Monthly selected
            topYearlyText.classList.add('text-color-gray');
            topYearlyText.classList.remove('text-color-blue');
            topMonthlyText.classList.add('text-color-blue');
            topMonthlyText.classList.remove('text-color-gray');
            
            if (grabElement) {
                grabElement.style.transform = 'translateX(100%)';
            }
            
            // Show monthly card, hide yearly card with animation
            if (monthlyCard && yearlyCard) {
                // First remove any previous animation classes
                yearlyCard.classList.remove('animate-card');
                monthlyCard.classList.remove('animate-card');
                
                // Add fade-out class to yearly card
                yearlyCard.classList.add('fade-out');
                
                // After a short delay, hide yearly and show monthly with animation
                setTimeout(() => {
                    yearlyCard.classList.add('hidden');
                    yearlyCard.classList.remove('fade-out');
                    monthlyCard.classList.remove('hidden');
                    monthlyCard.classList.add('animate-card');
                }, 300);
            }
        }
    }
    
    // Helper function to sync switchers
    function syncSwitchers(switcherToClick, targetState) {
        // Determine if we need to click
        const grabElement = switcherToClick.querySelector('.price_swithcer-grab');
        const isCurrentlyYearly = !grabElement || grabElement.style.transform === 'translateX(0px)' || grabElement.style.transform === '';
        
        // Only click if the states don't match
        if (isCurrentlyYearly !== targetState) {
            switcherToClick.click();
        }
    }
});