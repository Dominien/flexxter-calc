document.addEventListener("DOMContentLoaded", function () {
    // Price table adjustments
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
    
    // Price switcher functionality
    const priceSwitcher = document.querySelector('.price_switcher._2cond');
    const yearlyText = document.querySelector('[switcher-text-1]');
    const monthlyText = document.querySelector('[switcher-text-2]');
    
    if (priceSwitcher) {
        let isYearly = true; // Start with yearly pricing
        
        // Set initial state
        yearlyText.classList.add('text-color-blue');
        yearlyText.classList.remove('text-color-gray');
        monthlyText.classList.add('text-color-gray');
        monthlyText.classList.remove('text-color-blue');
        
        // Initial position of grab element
        const grabElement = priceSwitcher.querySelector('.price_swithcer-grab');
        if (grabElement) {
            grabElement.style.transform = 'translateX(0)';
        }
        
        // Add click event to the switcher
        priceSwitcher.addEventListener('click', function() {
            isYearly = !isYearly;
            
            // Update switcher visuals
            if (isYearly) {
                // Yearly selected
                yearlyText.classList.add('text-color-blue');
                yearlyText.classList.remove('text-color-gray');
                monthlyText.classList.add('text-color-gray');
                monthlyText.classList.remove('text-color-blue');
                
                if (grabElement) {
                    grabElement.style.transform = 'translateX(0)';
                }
            } else {
                // Monthly selected
                yearlyText.classList.add('text-color-gray');
                yearlyText.classList.remove('text-color-blue');
                monthlyText.classList.add('text-color-blue');
                monthlyText.classList.remove('text-color-gray');
                
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
});