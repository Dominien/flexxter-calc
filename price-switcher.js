document.addEventListener("DOMContentLoaded", function () {
    // Add CSS for smooth animations immediately to prevent visual glitches
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

    //--------------------------------------------------
    // PRICE TABLE ADJUSTMENTS
    //--------------------------------------------------
    // Change grid template and hide yearly prices initially
    const priceTableRows = document.querySelectorAll('.price_table-row');
    priceTableRows.forEach(row => {
        row.style.gridTemplateColumns = '3fr 1fr';
        
        // Hide yearly price column (the third column)
        const yearlyPriceCell = row.querySelector('.price_table-cell:nth-child(3)');
        if (yearlyPriceCell) {
            yearlyPriceCell.style.display = 'none';
        }
    });
    
    // Bottom price switcher functionality (for the pricing table)
    const bottomPriceSwitcher = document.querySelector('.price_switcher._2cond');
    let bottomYearlyText, bottomMonthlyText;
    
    if (bottomPriceSwitcher) {
        bottomYearlyText = bottomPriceSwitcher.previousElementSibling; // [switcher-text-1]
        bottomMonthlyText = bottomPriceSwitcher.nextElementSibling; // [switcher-text-2]
        
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

        // Defer expensive operations to optimize initial load
        let tableDataInitialized = false;
        
        // Lazy initialization of event listeners using IntersectionObserver
        const setupEventListeners = () => {
            if (tableDataInitialized) return;
            
            // Store original monthly prices
            priceTableRows.forEach(row => {
                const monthlyCellContent = row.querySelector('.price_table-cell.is-small.is-center .text-weight-semibold');
                const yearlyCellContent = row.querySelector('.price_table-cell.is-small:not(.is-center) .text-weight-bold');
                
                if (monthlyCellContent && yearlyCellContent) {
                    monthlyCellContent.setAttribute('data-original', monthlyCellContent.textContent);
                    // Apply yearly prices by default
                    monthlyCellContent.textContent = yearlyCellContent.textContent;
                }
            });
            
            tableDataInitialized = true;
        };
        
        // Observe bottom switcher to initialize on visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setupEventListeners();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(bottomPriceSwitcher);
        
        // Fallback initialization after a delay even if not visible
        setTimeout(setupEventListeners, 2000);
        
        // Add click event to the switcher - this must be done immediately for functionality
        bottomPriceSwitcher.addEventListener('click', function() {
            // Ensure data is initialized when the user interacts
            setupEventListeners();
            
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
            
            // Update price display
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
            
            // Sync top switcher with bottom switcher state if it exists
            if (topPriceSwitcher && !syncInProgress) {
                syncInProgress = true;
                syncSwitchers(topPriceSwitcher, isYearly);
                syncInProgress = false;
            }
        });
    }
    
    //--------------------------------------------------
    // TOP PRICE CARD SWITCHER FUNCTIONALITY
    //--------------------------------------------------
    const topPriceSwitcher = document.querySelector('.price_switcher.top-one');
    let topYearlyText, topMonthlyText;
    const monthlyCard = document.querySelector('.price_cards .price_left.monat');
    const yearlyCard = document.querySelector('.price_cards .price_right.year');
    let syncInProgress = false;
    
    if (topPriceSwitcher) {
        topYearlyText = topPriceSwitcher.previousElementSibling; // [switcher-text-1]
        topMonthlyText = topPriceSwitcher.nextElementSibling; // [switcher-text-2]
        
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
        if (monthlyCard && yearlyCard) {
            monthlyCard.classList.add('hidden');
            yearlyCard.classList.remove('hidden');
            yearlyCard.classList.add('animate-card');
        }
        
        // Add click event to the switcher
        topPriceSwitcher.addEventListener('click', function() {
            isYearly = !isYearly;
            
            // Update switcher visuals
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
            
            // Sync bottom switcher with top switcher state if it exists
            if (bottomPriceSwitcher && !syncInProgress) {
                syncInProgress = true;
                syncSwitchers(bottomPriceSwitcher, isYearly);
                syncInProgress = false;
            }
        });
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