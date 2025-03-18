document.addEventListener("DOMContentLoaded", function () {
    // Get references to bundle checkboxes
    const architektBundle = document.getElementById('architekt');
    const bauunternehmenBundle = document.getElementById('baunternehmen');
    const flexxterFullBundle = document.getElementById('flexxter_full');
    
    // Get reference to pricing elements
    const licencesInput = document.querySelector('[calculator-licences]');
    const staffInput = document.querySelector('[calculator-stuff]');
    const resultElement = document.querySelector('[calculator-result]');
    const yearlyRadio = document.querySelector('input[is-yearly]');
    const checkboxes = document.querySelectorAll('input[calculator-add]');
    const bundleSection = document.querySelector('.calculator_result-wrapper.bundle');
    const ohneBundlePrice = document.getElementById('ohne-bundle');
    
    // Bundle configurations
    const bundles = {
        'architekt': {
            licences: 2,
            staff: 0,
            discount: 0.25, // 25% discount
            addons: [
                'Tickets-und-M-ngel', 'Bautageb-cher', 'Mitarbeiter-Einsatzplanung',
                'Digitale-Formulare', 'K-nstliche-Intelligenz', 'Individuelle-Projektfelder', 
                'Basispl-ne-f-r-Bauzeitenpl-ne', 'Projektkosten', 'WhatsApp-Business'
            ]
        },
        'baunternehmen': {
            licences: 2,
            staff: 0,
            discount: 0.30, // 30% discount
            addons: [
                'Tickets-und-M-ngel', 'Bautageb-cher', 'Mitarbeiter-Einsatzplanung', 
                'Zeiterfassung', 'Zeiterfassung-mit-GPS', 'Digitale-Formulare', 
                'Auftragsmanagement', 'K-nstliche-Intelligenz', 'Individuelle-Projektfelder', 
                'Basispl-ne-f-r-Bauzeitenpl-ne', 'Projektkosten', 'WhatsApp-Business'
            ]
        },
        'flexxter_full': {
            licences: 2,
            staff: 0,
            discount: 0.35, // 35% discount
            // Include ALL add-ons for FlexXter Complete
            addons: [
                'Tickets-und-M-ngel', 
                'Bautageb-cher', 
                'Mitarbeiter-Einsatzplanung', 
                'Zeiterfassung', 
                'Zeiterfassung-mit-GPS', 
                'Zeiterfassung---DATEV-Export', 
                'Digitale-Formulare', 
                'Betriebsmittelverwaltung', 
                'Auftragsmanagement', 
                'K-nstliche-Intelligenz', 
                'Automatisierung-mit-Zapier', 
                'Individuelle-Projektfelder', 
                'BIM-Viewer', 
                'Basispl-ne-f-r-Bauzeitenpl-ne', 
                'Projektkosten', 
                'WhatsApp-Business', 
                'Lean-Construction', 
                'NFC-f-r-Tickets'
            ]
        }
    };
    
    // Add event listeners to bundle checkboxes
    architektBundle.addEventListener('change', () => handleBundleSelection('architekt'));
    bauunternehmenBundle.addEventListener('change', () => handleBundleSelection('baunternehmen'));
    flexxterFullBundle.addEventListener('change', () => handleBundleSelection('flexxter_full'));
    
    // Function to handle bundle selection
    function handleBundleSelection(bundleId) {
        // Uncheck other bundles
        if (bundleId === 'architekt') {
            bauunternehmenBundle.checked = false;
            flexxterFullBundle.checked = false;
            updateCheckboxVisual(bauunternehmenBundle, false);
            updateCheckboxVisual(flexxterFullBundle, false);
        } else if (bundleId === 'baunternehmen') {
            architektBundle.checked = false;
            flexxterFullBundle.checked = false;
            updateCheckboxVisual(architektBundle, false);
            updateCheckboxVisual(flexxterFullBundle, false);
        } else if (bundleId === 'flexxter_full') {
            architektBundle.checked = false;
            bauunternehmenBundle.checked = false;
            updateCheckboxVisual(architektBundle, false);
            updateCheckboxVisual(bauunternehmenBundle, false);
        }
        
        const isSelected = document.getElementById(bundleId).checked;
        
        if (isSelected) {
            applyBundle(bundleId);
            // Show "ohne Bundle" price section
            bundleSection.style.display = 'block';
        } else {
            resetBundleSelections();
            // Hide "ohne Bundle" price section
            bundleSection.style.display = 'none';
        }
        
        updateResult();
    }
    
    // Function to update checkbox visual state
    function updateCheckboxVisual(checkbox, isChecked) {
        const checkboxWrapper = checkbox.closest('.form_checkbox').querySelector('.w-checkbox-input');
        if (isChecked) {
            checkboxWrapper.classList.add('w--redirected-checked');
        } else {
            checkboxWrapper.classList.remove('w--redirected-checked');
        }
    }
    
    // Function to apply selected bundle
    function applyBundle(bundleId) {
        const bundle = bundles[bundleId];
        
        // Set licenses and staff values
        setSliderValue(licencesInput, bundle.licences);
        setSliderValue(staffInput, bundle.staff);
        
        // Force yearly subscription
        selectYearly();
        
        // Reset all add-ons first
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            updateCheckboxVisual(checkbox, false);
        });
        
        // Set selected add-ons
        checkboxes.forEach(checkbox => {
            if (bundle.addons.includes(checkbox.id)) {
                checkbox.checked = true;
                updateCheckboxVisual(checkbox, true);
            }
        });
    }
    
    // Function to reset all bundle selections
    function resetBundleSelections() {
        // Do not reset licenses, staff, or add-ons
        // Just make sure no discount is applied
    }
    
    // Set slider value and trigger UI update
    function setSliderValue(element, value) {
        if (!element) return;
        
        // Update the display value
        element.textContent = value;
        
        // Find the slider handle and update its position
        const rangeSlider = element.closest('[fs-rangeslider-element="wrapper"]');
        if (rangeSlider) {
            const handle = rangeSlider.querySelector('[fs-rangeslider-element="handle"]');
            const track = rangeSlider.querySelector('[fs-rangeslider-element="track"]');
            const fill = rangeSlider.querySelector('[fs-rangeslider-element="fill"]');
            
            if (handle && track && fill) {
                const min = parseInt(rangeSlider.getAttribute('fs-rangeslider-min')) || 0;
                const max = parseInt(rangeSlider.getAttribute('fs-rangeslider-max')) || 100;
                const trackWidth = track.offsetWidth;
                
                // Calculate the position percentage
                const percentage = (value - min) / (max - min);
                const position = percentage * trackWidth;
                
                // Update handle position
                handle.style.left = position + 'px';
                
                // Update fill width
                fill.style.width = position + 'px';
                
                // Update aria values
                handle.setAttribute('aria-valuenow', value);
            }
        }
    }
    
    // Force yearly subscription selection
    function selectYearly() {
        const yearlyWrapper = yearlyRadio.closest('.form_radio');
        const yearlyVisual = yearlyWrapper.querySelector('.w-radio-input');
        
        // Find monthly radio and its wrapper
        const monthlyRadio = document.querySelector('input[value="Monatlich"]');
        const monthlyWrapper = monthlyRadio.closest('.form_radio');
        const monthlyVisual = monthlyWrapper.querySelector('.w-radio-input');
        
        // Select yearly and deselect monthly
        yearlyRadio.checked = true;
        monthlyRadio.checked = false;
        
        yearlyVisual.classList.add('w--redirected-checked');
        monthlyVisual.classList.remove('w--redirected-checked');
    }
    
    // Modified updateResult function to handle bundle discounts and extra add-ons
    function updateResult() {
        let x = parseFloat(licencesInput.textContent) || 0;
        
        const isYearlyChecked = yearlyRadio.closest('.form_radio').querySelector('.w-radio-input').classList.contains('w--redirected-checked');
        
        let basePrice = isYearlyChecked ? 49.90 : 59.90;
        let result = x * basePrice;
        let bundleAddOns = [];
        let extraAddOns = 0;
        
        // Determine which bundle is selected and get its add-ons
        let selectedBundle = null;
        let selectedBundleDiscount = 0;
        
        if (architektBundle.checked) {
            selectedBundle = 'architekt';
            selectedBundleDiscount = bundles['architekt'].discount;
            bundleAddOns = bundles['architekt'].addons;
        } else if (bauunternehmenBundle.checked) {
            selectedBundle = 'baunternehmen';
            selectedBundleDiscount = bundles['baunternehmen'].discount;
            bundleAddOns = bundles['baunternehmen'].addons;
        } else if (flexxterFullBundle.checked) {
            selectedBundle = 'flexxter_full';
            selectedBundleDiscount = bundles['flexxter_full'].discount;
            bundleAddOns = bundles['flexxter_full'].addons;
        }
        
        // Calculate bundle price and extra add-ons separately
        checkboxes.forEach(checkbox => {
            const checkboxWrapper = checkbox.closest('.form_checkbox').querySelector('.w-checkbox-input');
            if (checkboxWrapper.classList.contains('w--redirected-checked')) {
                let addValue = isYearlyChecked 
                    ? parseFloat(checkbox.getAttribute('calculator-add-yearly')) || 0 
                    : parseFloat(checkbox.getAttribute('calculator-add')) || 0;
                
                // Add to the appropriate category
                if (selectedBundle && bundleAddOns.includes(checkbox.id)) {
                    // This add-on is part of the bundle and gets the discount
                    result += addValue * x;
                } else if (selectedBundle) {
                    // This is an extra add-on outside the bundle - track separately
                    extraAddOns += addValue * x;
                } else {
                    // No bundle selected, just add to the total
                    result += addValue * x;
                }
            }
        });
        
        // Store the "ohne Bundle" price for reference (before any discounts)
        let fullPrice = result + extraAddOns;
        
        // Apply bundle discount to only the bundle items
        if (selectedBundle) {
            result = result * (1 - selectedBundleDiscount);
            // Add the extra add-ons without discount
            result += extraAddOns;
        }
        
        // Update price displays
        resultElement.textContent = result.toFixed(2);
        
        // Update "ohne Bundle" price if visible
        if (bundleSection.style.display === 'block') {
            ohneBundlePrice.querySelector('span').textContent = fullPrice.toFixed(2);
        }
    }
    
    // Add the updateResult to the existing event listeners as in the original code
    // Make sure the bundle prices are updated when any calculator parameter changes
    const observer = new MutationObserver(updateResult);
    if (licencesInput) {
        observer.observe(licencesInput, { childList: true, subtree: true, characterData: true });
    }
    
    // Radio observation
    const radios = document.querySelectorAll('input[name="Laufzeit"]');
    radios.forEach(radio => {
        const visual = radio.closest('.form_radio').querySelector('.w-radio-input');
        const radioObserver = new MutationObserver(updateResult);
        radioObserver.observe(visual, { attributes: true, attributeFilter: ['class'] });
        
        radio.addEventListener("change", updateResult);
        radio.closest('.form_radio').addEventListener("click", updateResult);
    });
    
    // Checkboxes
    checkboxes.forEach(checkbox => {
        const checkboxWrapper = checkbox.closest('.form_checkbox').querySelector('.w-checkbox-input');
        const checkboxObserver = new MutationObserver(updateResult);
        checkboxObserver.observe(checkboxWrapper, { attributes: true, attributeFilter: ['class'] });
        
        checkbox.addEventListener("change", updateResult);
    });
    
    // Make bundle result section initially hidden
    if (bundleSection) {
        bundleSection.style.display = 'none';
    }
    
    // Initial calculation
    updateResult();
});