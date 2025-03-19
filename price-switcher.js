document.addEventListener("DOMContentLoaded", function () {
    // Add CSS for smooth animations
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Smooth transitions for price tables and cards */
        .price_table-row,
        .price_table-cell,
        .price_cards .price_left,
        .price_cards .price_right,
        .price_swithcer-grab {
            transition: all 0.3s ease-in-out;
        }
        
        /* Card transitions */
        .price_left,
        .price_right {
            opacity: 1;
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .price_left.hidden,
        .price_right.hidden {
            opacity: 0;
            transform: translateY(10px);
            pointer-events: none;
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
                    // Find the original monthly price (might need to store this somewhere)
                    // For now, we can parse from the current text if it contains a price
                    const originalText = monthlyCellContent.getAttribute('data-original');
                    if (originalText) {
                        monthlyCellContent.textContent = originalText;
                    }
                }
            });
            
            // Store original monthly prices on first click
            if (!document.querySelector('[data-original]')) {
                priceTableRows.forEach(row => {
                    const monthlyCellContent = row.querySelector('.price_table-cell.is-small.is-center .text-weight-semibold');
                    if (monthlyCellContent) {
                        monthlyCellContent.setAttribute('data-original', monthlyCellContent.textContent);
                    }
                });
            }
            
            // Sync top switcher with bottom switcher state if it exists
            if (topPriceSwitcher && !syncInProgress) {
                syncInProgress = true;
                syncSwitchers(topPriceSwitcher, isYearly);
                syncInProgress = false;
            }
        });
        
        // Initialize to yearly pricing without toggling the state
        // First store the original monthly prices
        priceTableRows.forEach(row => {
            const monthlyCellContent = row.querySelector('.price_table-cell.is-small.is-center .text-weight-semibold');
            const yearlyCellContent = row.querySelector('.price_table-cell.is-small:not(.is-center) .text-weight-bold');
            
            if (monthlyCellContent && yearlyCellContent) {
                monthlyCellContent.setAttribute('data-original', monthlyCellContent.textContent);
                // Apply yearly prices by default
                monthlyCellContent.textContent = yearlyCellContent.textContent;
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
                
                // Show yearly card, hide monthly card
                if (monthlyCard && yearlyCard) {
                    monthlyCard.classList.add('hidden');
                    yearlyCard.classList.remove('hidden');
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
                
                // Show monthly card, hide yearly card
                if (monthlyCard && yearlyCard) {
                    monthlyCard.classList.remove('hidden');
                    yearlyCard.classList.add('hidden');
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