document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing FlexXter calculator with API pricing...");
    
    // Additional event listener to immediately fix slider values when DOM loads
    setTimeout(() => {
        if (licencesInput && parseInt(licencesInput.textContent) < 1) {
            updateSliderUI(licencesInput, 1);
        }
        if (staffInput && parseInt(staffInput.textContent) < 1) {
            updateSliderUI(staffInput, 1);
        }
    }, 100); // Small delay to ensure sliders are fully initialized
    // Configuration for the FlexXter API
    const API_CONFIG = {
        baseUrl: "https://www.flexxter.de/GetPrice/php",
        // Mapping between API add-on keys and DOM element IDs
        addonMapping: {
            "incidents": "Tickets-und-M-ngel",
            "construction-diary": "Bautageb-cher",
            "gangs": "Mitarbeiter-Einsatzplanung",
            "time-recording": "Zeiterfassung",
            "timerecording-geolocation": "Zeiterfassung-mit-GPS",
            "datev-export": "Zeiterfassung---DATEV-Export",
            "forms": "Digitale-Formulare",
            "resources": "Betriebsmittelverwaltung",
            "invoices": "Auftragsmanagement",
            "flexxter-ai": "K-nstliche-Intelligenz",
            "open-api": "Automatisierung-mit-Zapier",
            "custom-project-variables": "Individuelle-Projektfelder",
            "bim-features": "BIM-Viewer",
            "project-baseplans": "Basispl-ne-f-r-Bauzeitenpl-ne",
            "project-expanses": "Projektkosten",
            "whatsapp": "WhatsApp-Business",
            "lean-construction": "Lean-Construction",
            "nfc": "NFC-f-r-Tickets",
            "gang-time-recording": "Poliere-Kolonenf-hrer"
        },
        // Reverse mapping for UI to API conversion
        reverseAddonMapping: {}
    };

    // Initialize reverse mapping
    for (const [apiKey, domId] of Object.entries(API_CONFIG.addonMapping)) {
        API_CONFIG.reverseAddonMapping[domId] = apiKey;
    }

    // No cache is used - all requests go directly to the API

    // DOM elements references 
    const licencesInput = document.querySelector('[calculator-licences]');
    const staffInput = document.querySelector('[calculator-stuff]');
    const resultElement = document.querySelector('[calculator-result]');
    const yearlyRadio = document.querySelector('input[is-yearly]');
    const checkboxes = document.querySelectorAll('input[calculator-add]');
    const bundleSection = document.querySelector('.calculator_result-wrapper.bundle');
    const ohneBundlePrice = document.getElementById('ohne-bundle');
    
    // Create and insert a direct script tag to force slider values to 1 immediately
    // and set yearly option checked by default
    const initScript = document.createElement('script');
    initScript.innerHTML = `
    // Execute immediately to set values before any other code runs
    (function() {
        // Find the slider elements
        const licencesInput = document.querySelector('[calculator-licences]');
        const staffInput = document.querySelector('[calculator-stuff]');
        
        // Set text contents to "1"
        if (licencesInput) licencesInput.textContent = "1";
        if (staffInput) staffInput.textContent = "1";
        
        // Force update of aria values too
        const updateSliderNow = function(element) {
            if (!element) return;
            const handle = element.closest('[fs-rangeslider-element="wrapper"]')?.querySelector('[fs-rangeslider-element="handle"]');
            if (handle) {
                handle.setAttribute('aria-valuenow', 1);
                const displayValue = handle.querySelector('[fs-rangeslider-element="display-value"]');
                if (displayValue) displayValue.textContent = "1";
            }
        };
        
        // Apply to both sliders
        updateSliderNow(licencesInput);
        updateSliderNow(staffInput);
        
        // Set yearly option checked by default
        const yearlyRadio = document.querySelector('input[is-yearly]');
        const monthlyRadio = document.querySelector('input[value="Monatlich"]');
        
        if (yearlyRadio && monthlyRadio) {
            // Set the yearly radio to checked
            yearlyRadio.checked = true;
            monthlyRadio.checked = false;
            
            // Update the visual state
            const yearlyVisual = yearlyRadio.closest('.form_radio').querySelector('.w-radio-input');
            const monthlyVisual = monthlyRadio.closest('.form_radio').querySelector('.w-radio-input');
            
            if (yearlyVisual && monthlyVisual) {
                yearlyVisual.classList.add('w--redirected-checked');
                monthlyVisual.classList.remove('w--redirected-checked');
            }
        }
        
        console.log("Immediate slider and yearly radio fix applied");
    })();
    `;
    document.head.appendChild(initScript);
    
    // Price calculator initialization
    async function initializeCalculator() {
        try {
            // Show loading state
            displayLoadingState(true);
            
            // Set initial values for licenses and staff to 1
            setInitialValues();
            
            // Setup event listeners first so they're ready when needed
            setupEventListeners();
            
            // Get the pricing data for initial state
            const pricingData = await fetchPricingData();
            
            // Initialize calculator with fetched data
            setupCalculator(pricingData);
            
            // Hide loading state
            displayLoadingState(false);
            
            // Initial calculation
            updateResult();
            
            console.log("Price calculator initialized with FlexXter API data");
        } catch (error) {
            handleApiError(error);
        }
    }
    
    // Function to set initial values for licenses and staff
    function setInitialValues() {
        // Set yearly option checked by default
        selectYearly();
        
        // Set licenses to 1
        if (licencesInput) {
            // Update the displayed text value
            licencesInput.textContent = "1";
            
            // Also update the slider visually
            updateSliderUI(licencesInput, 1);
        }
        
        // Set staff to 1
        if (staffInput) {
            // Update the displayed text value
            staffInput.textContent = "1";
            
            // Also update the slider visually
            updateSliderUI(staffInput, 1);
        }
    }
    
    // Helper function to update slider UI with proper positioning
    function updateSliderUI(element, value) {
        if (!element) return;
        
        console.log(`Updating slider for ${element.getAttribute('calculator-licences') ? 'licenses' : 'staff'} to ${value}`);
        
        // Make sure value is at least 1
        value = Math.max(1, value);
        
        // Update the text content first
        element.textContent = value.toString();
        
        // Find the slider elements
        const rangeSlider = element.closest('[fs-rangeslider-element="wrapper"]');
        if (!rangeSlider) return;
        
        const handle = rangeSlider.querySelector('[fs-rangeslider-element="handle"]');
        const track = rangeSlider.querySelector('[fs-rangeslider-element="track"]');
        const fill = rangeSlider.querySelector('[fs-rangeslider-element="fill"]');
        
        if (!handle || !track || !fill) return;
        
        // Get slider min/max values
        const min = parseInt(rangeSlider.getAttribute('fs-rangeslider-min')) || 0;
        const max = parseInt(rangeSlider.getAttribute('fs-rangeslider-max')) || 100;
        
        // Calculate position
        const trackWidth = track.offsetWidth || 100; // Fallback width if track has no width yet
        const percentage = (value - min) / (max - min);
        const position = Math.max(0, Math.min(trackWidth, percentage * trackWidth));
        
        // Update handle position
        handle.style.left = position + 'px';
        
        // Update fill width
        fill.style.width = position + 'px';
        
        // Update aria values and element text
        handle.setAttribute('aria-valuenow', value);
        
        // Direct DOM manipulation for Webflow's special cases
        if (handle.querySelector('[fs-rangeslider-element="display-value"]')) {
            handle.querySelector('[fs-rangeslider-element="display-value"]').textContent = value.toString();
        }
    }

    // Function to refresh pricing data based on UI selections
    async function refreshPricingData() {
        try {
            // Show loading state
            displayLoadingState(true);
            
            // Get fresh pricing data directly from API (no caching)
            const pricingData = await fetchPricingData(true); 
            
            // Initialize calculator with fetched data
            setupCalculator(pricingData);
            
            // Hide loading state
            displayLoadingState(false);
            
            // Update result display
            updateResult();
            
            console.log("Price calculator refreshed with new user selections");
        } catch (error) {
            handleApiError(error);
        }
    }

    // Function to fetch pricing data from the FlexXter API
    async function fetchPricingData(forceRefresh = false) {
        // No caching - always fetch fresh data

        try {
            // Function to extract JSON data from hidden field
            const extractJsonFromResponse = (html) => {
                // Extract the complete JSON string with a more precise regex
                const regex = /id=['"]succ-data-container['"].*?value=['"](\{.*?\})['"]/s;
                const match = html.match(regex);
                
                if (match && match[1]) {
                    // Get the full JSON string
                    const jsonString = match[1];
                    
                    try {
                        // Direct parse the complete JSON string
                        return JSON.parse(jsonString);
                    } catch (e) {
                        // Fallback with hardcoded response for testing
                        if (html.includes('"monthly_price":')) {
                            const monthlyMatch = html.match(/"monthly_price":(\d+)/);
                            if (monthlyMatch && monthlyMatch[1]) {
                                return { monthly_price: parseInt(monthlyMatch[1]), yearly_price: null };
                            }
                        }
                        return null;
                    }
                } else {
                    // Could not find container
                    return null;
                }
            };
            
            // Get selected add-ons from checkboxes
            function getSelectedAddOns() {
                const selected = [];
                
                checkboxes.forEach(checkbox => {
                    const checkboxWrapper = checkbox.closest('.form_checkbox').querySelector('.w-checkbox-input');
                    if (checkboxWrapper.classList.contains('w--redirected-checked')) {
                        const domId = checkbox.id;
                        const apiKey = API_CONFIG.reverseAddonMapping[domId];
                        if (apiKey) {
                            selected.push(apiKey);
                        }
                    }
                });
                
                return selected.join(',');
            }
            
            // Get current selected add-ons - only use what's actually selected
            const selectedAddOns = getSelectedAddOns();
            const addOnsParam = selectedAddOns;
            
            // Get number of licenses and payment term
            let licenses = parseInt(licencesInput?.textContent) || 1;
            
            // Ensure minimum of 1 license (and at least 2 if a bundle is selected)
            let minLicenses = 1;
            const hasBundle = document.getElementById('architekt')?.checked || 
                             document.getElementById('baunternehmen')?.checked || 
                             document.getElementById('flexxter_full')?.checked;
            
            if (hasBundle) {
                minLicenses = 2; // Bundles require at least 2 licenses
            }
            
            if (licenses < minLicenses) {
                licenses = minLicenses;
                if (licencesInput) {
                    updateSliderUI(licencesInput, minLicenses);
                }
            }
            
            // Also ensure staff is at least 1
            const staffCount = parseInt(staffInput?.textContent) || 0;
            if (staffCount < 1 && staffInput) {
                updateSliderUI(staffInput, 1);
            }
            
            const isYearly = yearlyRadio?.checked || false;
            const paymentTerm = isYearly ? 4 : 1; // 1 = monthly, 4 = yearly
            
            console.log("Fetching pricing data from FlexXter API with addons:", addOnsParam);
            
            // Build URL for monthly pricing with only selected addons
            // If no addons are selected, don't include the addons parameter
            const monthlyUrl = `${API_CONFIG.baseUrl}?public=true&am=2&lz=1&licenses=${licenses}${addOnsParam ? `&addons=${addOnsParam}` : ''}`;
            
            // Build URL for yearly pricing with only selected addons
            // If no addons are selected, don't include the addons parameter
            const yearlyUrl = `${API_CONFIG.baseUrl}?public=true&am=2&lz=4&licenses=${licenses}${addOnsParam ? `&addons=${addOnsParam}` : ''}`;
            
            console.log("API URLs:");
            console.log("Monthly: " + monthlyUrl);
            console.log("Yearly: " + yearlyUrl);
            
            // Fetch monthly and yearly pricing data
            const [monthlyResponse, yearlyResponse] = await Promise.all([
                fetch(monthlyUrl),
                fetch(yearlyUrl)
            ]);
            
            // Parse responses
            const monthlyHtml = await monthlyResponse.text();
            const yearlyHtml = await yearlyResponse.text();
            
            // Extract JSON data from responses
            const monthlyData = extractJsonFromResponse(monthlyHtml);
            const yearlyData = extractJsonFromResponse(yearlyHtml);
            
            console.log("API Response:", { 
                monthly: monthlyData,
                yearly: yearlyData
            });
            
            // Extract individual addon prices from the data
            if (monthlyData || yearlyData) {
                // Calculate individual addon prices
                const calculateAddonPrices = (data, paymentType) => {
                    const basePrice = paymentType === 'monthly' ? 59.90 : 49.90;
                    const totalPrice = data[`${paymentType}_price`] || 0;
                    
                    // If we have no addons selected, return empty object
                    if (totalPrice <= basePrice * licenses) {
                        return {};
                    }
                    
                    // Get selected add-ons count
                    const selectedAddOnsArray = addOnsParam ? addOnsParam.split(',') : [];
                    const addonCount = selectedAddOnsArray.length;
                    
                    // Estimate addon price (this is an approximation)
                    const addonTotalPrice = totalPrice - (basePrice * licenses);
                    const estimatedAddonPrice = addonTotalPrice / addonCount / licenses;
                    
                    // Create addon price object
                    const addonPrices = {};
                    
                    // Only create prices for the selected add-ons
                    if (selectedAddOnsArray.length > 0) {
                        selectedAddOnsArray.forEach(addonKey => {
                            if (addonKey && API_CONFIG.addonMapping[addonKey]) {
                                const domId = API_CONFIG.addonMapping[addonKey];
                                addonPrices[addonKey] = { 
                                    price: estimatedAddonPrice 
                                };
                            }
                        });
                    }
                    
                    return addonPrices;
                };
                
                // Create API response data structure
                const monthlyApiData = {
                    base_price: 59.90,
                    addons: calculateAddonPrices(monthlyData || {}, 'monthly')
                };
                
                const yearlyApiData = {
                    base_price: 49.90,
                    addons: calculateAddonPrices(yearlyData || {}, 'yearly')
                };
                
                // For bundles, we'll use the monthly_price from the yearly data directly
                // We'll apply the bundle discounts on the UI side
                const architectPrice = yearlyData ? yearlyData.monthly_price : null; // Will apply 25% discount in UI
                const constructionPrice = yearlyData ? yearlyData.monthly_price : null; // Will apply 30% discount in UI
                const completePrice = yearlyData ? yearlyData.monthly_price : null; // Will apply 35% discount in UI
                
                const architectData = { total_price: architectPrice || 99.9 };
                const constructionData = { total_price: constructionPrice || 129.9 };
                const completeData = { total_price: completePrice || 199.9 };
                
                // Process and combine the data
                const pricingData = processPricingData(
                    monthlyApiData, 
                    yearlyApiData, 
                    architectData,
                    constructionData,
                    completeData
                );
                
                // Store raw API response for direct price use
                pricingData.apiResponse = {
                    monthly: {
                        monthly_price: monthlyData?.monthly_price || null,
                        regular_monthly_price: monthlyData?.regular_monthly_price || monthlyData?.monthly_price || null,
                        yearly_price: monthlyData?.yearly_price || null
                    },
                    yearly: {
                        monthly_price: yearlyData?.monthly_price || null,
                        yearly_price: yearlyData?.yearly_price || null,
                        regular_monthly_price: yearlyData?.regular_monthly_price || yearlyData?.monthly_price || null,
                        regular_yearly_price: yearlyData?.regular_yearly_price || yearlyData?.yearly_price || null
                    }
                };
                
                return pricingData;
            } else {
                throw new Error("Failed to fetch pricing data from API");
            }
        } catch (error) {
            console.error("Error fetching pricing data:", error);
            throw error;
        }
    }
    
    // Process raw API response into usable pricing data
    function processPricingData(monthlyData, yearlyData, architectData, constructionData, completeData) {
        // Extract base prices (license price)
        const basePrices = {
            monthly: parseFloat(monthlyData.base_price) || 59.90,
            yearly: parseFloat(yearlyData.base_price) || 49.90
        };
        
        // Process add-on prices
        const addOns = {};
        
        // Get add-ons from API response
        if (monthlyData.addons && yearlyData.addons) {
            // Process each add-on in the mapping
            Object.entries(API_CONFIG.addonMapping).forEach(([apiKey, domId]) => {
                const monthlyPrice = parseFloat(monthlyData.addons[apiKey]?.price) || 0;
                const yearlyPrice = parseFloat(yearlyData.addons[apiKey]?.price) || 0;
                
                addOns[domId] = {
                    monthly: monthlyPrice,
                    yearly: yearlyPrice
                };
            });
        }
        
        // Bundle configurations
        const bundles = {
            architekt: {
                licences: 2,
                staff: 0,
                addons: [
                    'Tickets-und-M-ngel', 'Bautageb-cher',
                    'Digitale-Formulare', 'K-nstliche-Intelligenz', 'Individuelle-Projektfelder', 
                    'Basispl-ne-f-r-Bauzeitenpl-ne', 'Projektkosten', 'WhatsApp-Business'
                ]
            },
            baunternehmen: {
                licences: 2,
                staff: 0,
                addons: [
                    'Tickets-und-M-ngel', 'Bautageb-cher', 'Mitarbeiter-Einsatzplanung', 
                    'Zeiterfassung', 'Digitale-Formulare', 
                    'Auftragsmanagement', 'K-nstliche-Intelligenz', 'Individuelle-Projektfelder', 
                    'Basispl-ne-f-r-Bauzeitenpl-ne', 'Projektkosten', 'WhatsApp-Business'
                ]
            },
            flexxter_full: {
                licences: 2,
                staff: 0,
                addons: Object.values(API_CONFIG.addonMapping) // All add-ons
            }
        };
        
        // Bundle discounts (these are the displayed percentages in the bundle labels)
        const bundleDiscounts = {
            architekt: 0.25, // 25%
            baunternehmen: 0.30, // 30%
            flexxter_full: 0.35 // 35%
        };
        
        return {
            basePrices,
            bundleDiscounts,
            addOns,
            bundles
        };
    }

    // Function to display loading state
    function displayLoadingState(isLoading) {
        // Create or find loading indicator
        let loadingIndicator = document.querySelector('.calculator-loading');
        
        if (isLoading) {
            if (!loadingIndicator) {
                loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'calculator-loading';
                loadingIndicator.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading pricing data...</div>
                `;
                
                // Add styles for the loading indicator
                const styleEl = document.createElement('style');
                styleEl.textContent = `
                    .calculator-loading {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(255, 255, 255, 0.8);
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        z-index: 100;
                    }
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    .loading-text {
                        margin-top: 10px;
                        font-weight: bold;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(styleEl);
                
                // Find calculator element and append loading indicator
                const calculatorElement = document.querySelector('.calculator_component');
                if (calculatorElement) {
                    calculatorElement.style.position = 'relative';
                    calculatorElement.appendChild(loadingIndicator);
                }
            }
        } else if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // Function to handle API errors
    function handleApiError(error) {
        console.error("API Error:", error);
        
        // Display error message to user
        const calculatorElement = document.querySelector('.calculator_component');
        if (calculatorElement) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'calculator-error';
            errorMessage.innerHTML = `
                <div class="error-icon">⚠️</div>
                <div class="error-text">
                    <p>Sorry, we couldn't load the pricing data.</p>
                    <p>Please try again later or contact support.</p>
                    <button class="retry-button">Retry</button>
                </div>
            `;
            
            // Add styles for the error message
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                .calculator-error {
                    margin: 20px 0;
                    padding: 20px;
                    background-color: #ffeeee;
                    border: 1px solid #ff6666;
                    border-radius: 5px;
                    display: flex;
                    align-items: center;
                }
                .error-icon {
                    font-size: 24px;
                    margin-right: 15px;
                }
                .error-text {
                    flex: 1;
                }
                .retry-button {
                    background-color: #3498db;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                }
                .retry-button:hover {
                    background-color: #2980b9;
                }
            `;
            document.head.appendChild(styleEl);
            
            // Check if error message already exists, replace if it does
            const existingError = document.querySelector('.calculator-error');
            if (existingError) {
                existingError.replaceWith(errorMessage);
            } else {
                calculatorElement.prepend(errorMessage);
            }
            
            // Add event listener to retry button
            const retryButton = errorMessage.querySelector('.retry-button');
            retryButton.addEventListener('click', function() {
                errorMessage.remove();
                initializeCalculator();
            });
        }
        
        // Fall back to default prices from local storage or default constants
        tryFallbackData();
    }

    // Try to use fallback data if API fails
    function tryFallbackData() {
        // Default pricing data (same structure as processed API response)
        const defaultPricing = {
            basePrices: {
                monthly: 59.90,
                yearly: 49.90
            },
            bundleDiscounts: {
                architekt: 0.25,
                baunternehmen: 0.30,
                flexxter_full: 0.35
            },
            addOns: {
                // Add-on IDs and their prices
                "Tickets-und-M-ngel": { monthly: 10, yearly: 8 },
                "Bautageb-cher": { monthly: 10, yearly: 8 },
                "Mitarbeiter-Einsatzplanung": { monthly: 15, yearly: 12 },
                "Zeiterfassung": { monthly: 15, yearly: 12 },
                "Zeiterfassung-mit-GPS": { monthly: 5, yearly: 4 },
                "Zeiterfassung---DATEV-Export": { monthly: 5, yearly: 4 },
                "Digitale-Formulare": { monthly: 10, yearly: 8 },
                "Betriebsmittelverwaltung": { monthly: 10, yearly: 8 },
                "Auftragsmanagement": { monthly: 15, yearly: 12 },
                "K-nstliche-Intelligenz": { monthly: 10, yearly: 8 },
                "Automatisierung-mit-Zapier": { monthly: 5, yearly: 4 },
                "Individuelle-Projektfelder": { monthly: 5, yearly: 4 },
                "BIM-Viewer": { monthly: 15, yearly: 12 },
                "Basispl-ne-f-r-Bauzeitenpl-ne": { monthly: 10, yearly: 8 },
                "Projektkosten": { monthly: 10, yearly: 8 },
                "WhatsApp-Business": { monthly: 5, yearly: 4 },
                "Lean-Construction": { monthly: 10, yearly: 8 },
                "NFC-f-r-Tickets": { monthly: 5, yearly: 4 },
                "Poliere-Kolonenf-hrer": { monthly: 5, yearly: 4 }
            },
            bundles: {
                architekt: {
                    licences: 2,
                    staff: 0,
                    addons: [
                        'Tickets-und-M-ngel', 'Bautageb-cher',
                        'Digitale-Formulare', 'K-nstliche-Intelligenz', 'Individuelle-Projektfelder', 
                        'Basispl-ne-f-r-Bauzeitenpl-ne', 'Projektkosten', 'WhatsApp-Business'
                    ]
                },
                baunternehmen: {
                    licences: 2,
                    staff: 0,
                    addons: [
                        'Tickets-und-M-ngel', 'Bautageb-cher', 'Mitarbeiter-Einsatzplanung', 
                        'Zeiterfassung', 'Digitale-Formulare', 
                        'Auftragsmanagement', 'K-nstliche-Intelligenz', 'Individuelle-Projektfelder', 
                        'Basispl-ne-f-r-Bauzeitenpl-ne', 'Projektkosten', 'WhatsApp-Business'
                    ]
                },
                flexxter_full: {
                    licences: 2,
                    staff: 0,
                    addons: Object.values(API_CONFIG.addonMapping)
                }
            }
        };
        
        // No localStorage caching used
        
        // Fall back to default pricing constants
        console.log("Using default pricing constants");
        setupCalculator(defaultPricing);
    }

    // Setup calculator with the provided pricing data
    function setupCalculator(pricingData) {
        // Update pricingModel with data from API
        window.pricingModel = pricingData;
        
        // Apply add-on prices to the relevant DOM elements
        updateAddOnPricesInDOM(pricingData.addOns);
    }
    
    // Update add-on prices in DOM based on API data
    function updateAddOnPricesInDOM(addOns) {
        checkboxes.forEach(checkbox => {
            const addOnId = checkbox.id;
            if (addOns[addOnId]) {
                // Update the data attributes with prices from API
                checkbox.setAttribute('calculator-add', addOns[addOnId].monthly || 0);
                checkbox.setAttribute('calculator-add-yearly', addOns[addOnId].yearly || 0);
                
                // Update the displayed price text next to the checkbox if it exists
                const priceText = checkbox.closest('.form_checkbox')?.querySelector('.addon-price');
                if (priceText) {
                    const isYearly = yearlyRadio.checked;
                    const price = isYearly ? addOns[addOnId].yearly : addOns[addOnId].monthly;
                    priceText.textContent = `${price.toFixed(2)} €`;
                }
            }
        });
    }

    // Set up event listeners for calculator updates
    function setupEventListeners() {
        // Create a debounced version of refreshPricingData for slider changes
        const debouncedRefreshPricingForSliders = (function() {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    console.log("Executing debounced refresh pricing for sliders");
                    refreshPricingData();
                }, 300); // Longer timeout for sliders to reduce API calls during dragging
            };
        })();
        
        // Listen for changes in licenses
        if (licencesInput) {
            const observer = new MutationObserver(() => {
                // Only call the API if we're not currently applying a bundle
                if (!isApplyingBundle && !bundleOperationInProgress) {
                    // Use debounced refresh for slider changes
                    debouncedRefreshPricingForSliders();
                }
            });
            observer.observe(licencesInput, { childList: true, subtree: true, characterData: true });
        }
        
        // Listen for changes in staff if present
        if (staffInput) {
            const observer = new MutationObserver(updateResult);
            observer.observe(staffInput, { childList: true, subtree: true, characterData: true });
        }
        
        // Listen for changes in payment period (yearly/monthly)
        const radios = document.querySelectorAll('input[name="Laufzeit"]');
        const monthlyRadio = document.querySelector('input[value="Monatlich"]');
        
        // Get the bundle wrapper element
        const bundleWrapper = document.querySelector('.calc-bundle');
        const bundleHeader = bundleWrapper?.querySelector('.calculator_grid-header.top');
        
        // Create a warning message element for monthly selection
        const monthlyMessage = document.createElement('div');
        monthlyMessage.className = 'bundle-monthly-message';
        monthlyMessage.style.cssText = 'color: #e74c3c; font-size: 14px; font-weight: bold; margin-top: 8px; display: none;';
        monthlyMessage.textContent = 'Hinweis: Bundles sind nur bei jährlicher Zahlung verfügbar!';
        
        // Add the message after the bundle header if it exists
        if (bundleHeader) {
            bundleHeader.appendChild(monthlyMessage);
        }
        
        // Function to update bundle section based on payment period
        function updateBundleSection(isMonthly) {
            if (isMonthly) {
                // Show warning message for monthly billing
                monthlyMessage.style.display = 'block';
                
                // Disable bundle checkboxes
                const bundleCheckboxes = document.querySelectorAll('.flex-bundles.here .form_checkbox');
                bundleCheckboxes.forEach(checkbox => {
                    checkbox.style.opacity = '0.5';
                    checkbox.style.pointerEvents = 'none';
                });
                
                // Check if any bundle was selected and deselect it
                const architektBundle = document.getElementById('architekt');
                const bauunternehmenBundle = document.getElementById('baunternehmen');
                const flexxterFullBundle = document.getElementById('flexxter_full');
                const wasAnyBundleSelected = architektBundle?.checked || bauunternehmenBundle?.checked || flexxterFullBundle?.checked;
                
                // Only proceed if a bundle was selected and we're not in the middle of applying a bundle
                if (wasAnyBundleSelected && !isApplyingBundle) {
                    // Set flag to prevent multiple API calls
                    isApplyingBundle = true;
                    
                    try {
                        // Uncheck all bundle checkboxes
                        if (architektBundle) {
                            architektBundle.checked = false;
                            updateCheckboxVisual(architektBundle, false);
                        }
                        if (bauunternehmenBundle) {
                            bauunternehmenBundle.checked = false;
                            updateCheckboxVisual(bauunternehmenBundle, false);
                        }
                        if (flexxterFullBundle) {
                            flexxterFullBundle.checked = false;
                            updateCheckboxVisual(flexxterFullBundle, false);
                        }
                        
                        // Hide the bundle price display section
                        if (bundleSection) {
                            bundleSection.style.display = 'none';
                        }
                        
                        // Uncheck all add-ons
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = false;
                            updateCheckboxVisual(checkbox, false);
                        });
                    } finally {
                        // Reset flag after changes
                        isApplyingBundle = false;
                        
                        // Refresh pricing data with the new state
                        refreshPricingData();
                    }
                }
            } else {
                // Remove warning for yearly billing
                monthlyMessage.style.display = 'none';
                
                // Re-enable bundle checkboxes
                const bundleCheckboxes = document.querySelectorAll('.flex-bundles.here .form_checkbox');
                bundleCheckboxes.forEach(checkbox => {
                    checkbox.style.opacity = '1';
                    checkbox.style.pointerEvents = 'auto';
                });
            }
        }
        
        radios.forEach(radio => {
            const visual = radio.closest('.form_radio').querySelector('.w-radio-input');
            const radioObserver = new MutationObserver(() => {
                // Only update if not currently applying a bundle
                if (!isApplyingBundle) {
                    // Check if monthly is selected
                    const isMonthly = radio.value === "Monatlich" && radio.checked;
                    updateBundleSection(isMonthly);
                    
                    updateResult();
                    // Update displayed add-on prices
                    if (window.pricingModel && window.pricingModel.addOns) {
                        updateAddOnPricesInDOM(window.pricingModel.addOns);
                    }
                }
            });
            radioObserver.observe(visual, { attributes: true, attributeFilter: ['class'] });
            
            radio.addEventListener("change", function() {
                // Only update if not currently applying a bundle
                if (!isApplyingBundle) {
                    // Check if monthly is selected
                    const isMonthly = radio.value === "Monatlich" && radio.checked;
                    updateBundleSection(isMonthly);
                    
                    updateResult();
                }
            });
            
            radio.closest('.form_radio').addEventListener("click", function() {
                // Only update if not currently applying a bundle
                if (!isApplyingBundle) {
                    // Check if monthly is selected
                    const isMonthly = radio.value === "Monatlich" && radio.checked;
                    updateBundleSection(isMonthly);
                    
                    updateResult();
                }
            });
        });
        
        // Create a debounced version of refreshPricingData for addon checkboxes
        const debouncedRefreshPricingForAddons = (function() {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    console.log("Executing debounced refresh pricing for addons");
                    refreshPricingData();
                }, 200);
            };
        })();
        
        // Listen for changes in add-ons - consolidate to a single handler system
        checkboxes.forEach(checkbox => {
            const checkboxWrapper = checkbox.closest('.form_checkbox').querySelector('.w-checkbox-input');
            
            // Single function to handle both event types with the same logic
            const handleAddonChange = () => {
                // Only refresh pricing data if not currently applying a bundle
                if (!isApplyingBundle && !bundleOperationInProgress) {
                    bundleOperationInProgress = true;
                    
                    // Check if a bundle checkbox is selected (even if the bundle isn't currently valid)
                    const architektBundleSelected = document.getElementById('architekt')?.checked;
                    const bauunternehmenBundleSelected = document.getElementById('baunternehmen')?.checked;
                    const flexxterFullBundleSelected = document.getElementById('flexxter_full')?.checked;
                    const hasSelectedBundleCheckbox = architektBundleSelected || bauunternehmenBundleSelected || flexxterFullBundleSelected;
                    
                    // Determine which bundle is selected (if any)
                    let selectedBundle = null;
                    if (architektBundleSelected) selectedBundle = 'architekt';
                    else if (bauunternehmenBundleSelected) selectedBundle = 'baunternehmen';
                    else if (flexxterFullBundleSelected) selectedBundle = 'flexxter_full';
                    
                    if (selectedBundle && window.pricingModel?.bundles?.[selectedBundle]) {
                        const bundleAddons = window.pricingModel.bundles[selectedBundle].addons;
                        const isPartOfBundle = bundleAddons.includes(checkbox.id);
                        const isChecked = checkbox.checked;
                        
                        // Case 1: Addon is part of the bundle and being unchecked - invalidate the bundle
                        if (isPartOfBundle && !isChecked) {
                            console.log(`Deactivating bundle ${selectedBundle} because ${checkbox.id} was deselected`);
                            // Deselect the bundle
                            const bundleCheckbox = document.getElementById(selectedBundle);
                            if (bundleCheckbox) {
                                bundleCheckbox.checked = false;
                                updateCheckboxVisual(bundleCheckbox, false);
                                
                                // Also hide the bundle price section
                                if (bundleSection) {
                                    bundleSection.style.display = 'none';
                                }
                            }
                        } 
                        // Case 2: Check if checkbox was reselected and all bundle addons are now selected
                        else if (isPartOfBundle && isChecked) {
                            // Check if all required addons for this bundle are now selected
                            const allBundleAddonsSelected = bundleAddons.every(addonId => {
                                const addonCheckbox = document.getElementById(addonId);
                                return addonCheckbox && addonCheckbox.checked;
                            });
                            
                            if (allBundleAddonsSelected) {
                                console.log(`Reactivating bundle ${selectedBundle} because all required addons are now selected`);
                                
                                // Make sure the correct bundle is selected
                                const bundleCheckbox = document.getElementById(selectedBundle);
                                if (bundleCheckbox && !bundleCheckbox.checked) {
                                    // Only one bundle should be checked at a time, so uncheck others first
                                    const otherBundles = ['architekt', 'baunternehmen', 'flexxter_full'].filter(b => b !== selectedBundle);
                                    otherBundles.forEach(otherId => {
                                        const otherCheckbox = document.getElementById(otherId);
                                        if (otherCheckbox && otherCheckbox.checked) {
                                            otherCheckbox.checked = false;
                                            updateCheckboxVisual(otherCheckbox, false);
                                        }
                                    });
                                    
                                    // Now select the proper bundle checkbox
                                    bundleCheckbox.checked = true;
                                    updateCheckboxVisual(bundleCheckbox, true);
                                }
                                
                                // Apply bundle display section
                                if (bundleSection) {
                                    bundleSection.style.display = 'block';
                                }
                                
                                // Force yearly subscription for bundles
                                selectYearly();
                            }
                        }
                    } 
                    // Case 3: No bundle checkbox is selected, but check if all addons for a bundle are now selected
                    else if (!hasSelectedBundleCheckbox) {
                        // Get all currently selected addons
                        const selectedAddons = [];
                        checkboxes.forEach(cb => {
                            if (cb.checked) {
                                selectedAddons.push(cb.id);
                            }
                        });
                        
                        console.log("Currently selected addons:", selectedAddons);
                        
                        // Bundle selection logic prioritizing more specific matches
                        // Order matters: we check from most comprehensive to least
                        const bundlesToCheck = ['flexxter_full', 'baunternehmen', 'architekt'];
                        let bestMatchBundle = null;
                        let bestMatchScore = 0;
                        
                        for (const bundleId of bundlesToCheck) {
                            if (window.pricingModel?.bundles?.[bundleId]) {
                                const bundleAddons = window.pricingModel.bundles[bundleId].addons;
                                
                                // Check if all bundle addons are selected
                                const allBundleAddonsSelected = bundleAddons.every(addonId => {
                                    return selectedAddons.includes(addonId);
                                });
                                
                                if (allBundleAddonsSelected) {
                                    // Calculate how good a match this is
                                    // How many addons in the bundle vs. how many extra addons selected
                                    const bundleSize = bundleAddons.length;
                                    const selectedSize = selectedAddons.length;
                                    
                                    // Perfect match is better than partial match
                                    // Larger bundle with all required addons is better than smaller one
                                    const closenessScore = bundleSize * 100 - Math.abs(bundleSize - selectedSize);
                                    
                                    console.log(`Bundle ${bundleId} match score: ${closenessScore} (size: ${bundleSize}, selected: ${selectedSize})`);
                                    
                                    if (closenessScore > bestMatchScore) {
                                        bestMatchBundle = bundleId;
                                        bestMatchScore = closenessScore;
                                    }
                                } else {
                                    console.log(`Bundle ${bundleId} is missing some required addons`);
                                }
                            }
                        }
                        
                        // If we found a matching bundle, select it
                        if (bestMatchBundle) {
                            console.log(`Auto-selecting best matching bundle: ${bestMatchBundle} (score: ${bestMatchScore})`);
                            
                            // Auto-select the bundle
                            const bundleCheckbox = document.getElementById(bestMatchBundle);
                            if (bundleCheckbox && !bundleCheckbox.checked) {
                                // Select the bundle checkbox
                                bundleCheckbox.checked = true;
                                updateCheckboxVisual(bundleCheckbox, true);
                                
                                // Show the bundle price section
                                if (bundleSection) {
                                    bundleSection.style.display = 'block';
                                }
                                
                                // Force yearly subscription for bundles
                                selectYearly();
                            }
                        } else {
                            console.log("No matching bundle found for the current addon selection");
                        }
                    }
                    
                    // Use debounced refresh for all addon changes
                    debouncedRefreshPricingForAddons();
                    
                    // Reset flag after a short delay
                    setTimeout(() => {
                        bundleOperationInProgress = false;
                    }, 250);
                }
            };
            
            // Use a single MutationObserver for visual state changes
            const checkboxObserver = new MutationObserver(() => {
                if (!isApplyingBundle && !bundleOperationInProgress) {
                    // Only handle the checkbox if it's actually changed by the user
                    // and make sure there's no mismatch between visual and actual state
                    const visuallyChecked = checkboxWrapper.classList.contains('w--redirected-checked');
                    if (checkbox.checked !== visuallyChecked) {
                        checkbox.checked = visuallyChecked;
                        handleAddonChange();
                    }
                }
            });
            checkboxObserver.observe(checkboxWrapper, { attributes: true, attributeFilter: ['class'] });
            
            // Direct change event still needed for user interactions
            checkbox.addEventListener("change", handleAddonChange);
        });
        
        // Listen for bundle selection with a single handler to prevent cascading events
        const bundleCheckboxes = document.querySelectorAll('#architekt, #baunternehmen, #flexxter_full');
        
        // Create a debounced version of refreshPricingData
        const debouncedRefreshPricing = (function() {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    console.log("Executing debounced refresh pricing for bundle");
                    refreshPricingData();
                    bundleOperationInProgress = false;
                }, 100);
            };
        })();
        
        // Add event listeners to bundle checkboxes
        bundleCheckboxes.forEach(checkbox => {
            // Add event listener without replacing the checkbox
            checkbox.addEventListener('change', function() {
                // Prevent multiple simultaneous operations
                if (bundleOperationInProgress) return;
                bundleOperationInProgress = true;
                
                // Set global flag to disable other listeners
                isApplyingBundle = true;
                
                // Log for debugging
                console.log(`Bundle checkbox changed: ${checkbox.id}, checked: ${checkbox.checked}`);
                
                // First handle the bundle selection (which sets all checkboxes)
                handleBundleSelection(checkbox.id);
                
                // Force a refresh of pricing data after a short delay
                setTimeout(() => {
                    console.log("Forcing API refresh after bundle selection");
                    refreshPricingData();
                    
                    // Reset flags after completion
                    setTimeout(() => {
                        isApplyingBundle = false;
                        bundleOperationInProgress = false;
                    }, 200);
                }, 100);
            });
        });
    }

    // Function to handle bundle selection
    function handleBundleSelection(bundleId) {
        // Get all bundle checkboxes
        const architektBundle = document.getElementById('architekt');
        const bauunternehmenBundle = document.getElementById('baunternehmen');
        const flexxterFullBundle = document.getElementById('flexxter_full');
        
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
        
        // Don't call updateResult() here - refreshPricingData will be called via event listener
        // and that will trigger the appropriate API call and result update
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
    
    // Flags to prevent multiple API calls during operations
    let isApplyingBundle = false;
    let bundleOperationInProgress = false;
    
    // Apply selected bundle
    function applyBundle(bundleId) {
        if (!window.pricingModel || !window.pricingModel.bundles) return;
        
        const bundle = window.pricingModel.bundles[bundleId];
        if (!bundle) return;
        
        // We don't reset the isApplyingBundle flag here anymore - it's handled by the debounced function
        
        // Instead of disabling MutationObservers by changing classes, we'll use a different approach
        
        // Set licenses to at least 2 for bundles (bundles require at least 2 licenses)
        // Only set licenses to 2 if current value is less than 2, otherwise keep current value
        const currentLicenses = parseInt(licencesInput?.textContent) || 1;
        const licenseValue = (currentLicenses < 2) ? 2 : currentLicenses;
        updateSliderUI(licencesInput, licenseValue);
        
        // Set staff to at least 1
        if (staffInput) {
            const staffValue = Math.max(1, bundle.staff);
            updateSliderUI(staffInput, staffValue);
        }
        
        // Force yearly subscription
        selectYearly();

        // Get current state of checkboxes before changing anything
        const checkboxStates = new Map();
        checkboxes.forEach(checkbox => {
            checkboxStates.set(checkbox.id, checkbox.checked);
        });
        
        // First manually update the checked property without touching the DOM
        checkboxes.forEach(checkbox => {
            checkbox.checked = bundle.addons.includes(checkbox.id);
        });

        // Then update the visual state of all checkboxes at once
        // This batches all DOM updates together to minimize reflows
        checkboxes.forEach(checkbox => {
            // Only update checkboxes whose state has changed
            if (checkboxStates.get(checkbox.id) !== checkbox.checked) {
                updateCheckboxVisual(checkbox, checkbox.checked);
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
        
        // Use the updateSliderUI helper to ensure correct visual state
        updateSliderUI(element, value);
    }
    
    // Helper function to check if yearly plan is selected
    function isYearlyPlanSelected() {
        return yearlyRadio.checked;
    }
    
    // Force yearly subscription selection
    function selectYearly() {
        // Don't do anything if yearly is already selected
        if (isYearlyPlanSelected()) return;
        
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
    
    // Get current selected add-ons as a comma-separated string for API calls
    function getSelectedAddOns() {
        const selected = [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const domId = checkbox.id;
                const apiKey = API_CONFIG.reverseAddonMapping[domId];
                if (apiKey) {
                    selected.push(apiKey);
                }
            }
        });
        
        return selected.join(',');
    }
    
    // Updated result calculation using API pricing data
    function updateResult() {
        if (!window.pricingModel) return;
        
        let licences = parseFloat(licencesInput.textContent) || 1;
        
        // Ensure minimum of 1 license (and at least 2 if a bundle is selected)
        let minLicenses = 1;
        const hasBundle = document.getElementById('architekt')?.checked || 
                         document.getElementById('baunternehmen')?.checked || 
                         document.getElementById('flexxter_full')?.checked;
        
        if (hasBundle) {
            minLicenses = 2; // Bundles require at least 2 licenses
        }
        
        if (licences < minLicenses) {
            licences = minLicenses;
            updateSliderUI(licencesInput, minLicenses);
        }
        
        // Also ensure staff is at least 1
        const staffCount = parseInt(staffInput?.textContent) || 0;
        if (staffCount < 1 && staffInput) {
            updateSliderUI(staffInput, 1);
        }
        
        const isYearlyChecked = yearlyRadio.closest('.form_radio').querySelector('.w-radio-input')
            .classList.contains('w--redirected-checked');
        
        // Determine which bundle is selected
        let selectedBundle = null;
        let selectedBundleDiscount = 0;
        
        const architektBundle = document.getElementById('architekt');
        const bauunternehmenBundle = document.getElementById('baunternehmen');
        const flexxterFullBundle = document.getElementById('flexxter_full');
        
        if (architektBundle.checked) {
            selectedBundle = 'architekt';
            selectedBundleDiscount = window.pricingModel.bundleDiscounts.architekt;
        } else if (bauunternehmenBundle.checked) {
            selectedBundle = 'baunternehmen';
            selectedBundleDiscount = window.pricingModel.bundleDiscounts.baunternehmen;
        } else if (flexxterFullBundle.checked) {
            selectedBundle = 'flexxter_full';
            selectedBundleDiscount = window.pricingModel.bundleDiscounts.flexxter_full;
        }
        
        // Use the API direct price if available
        let result = 0;
        let fullPrice = 0;
        let savingsPercentage = 0;
        
        // Check if we have direct API price data
        if (window.pricingModel.apiResponse) {
            const apiData = window.pricingModel.apiResponse;
            // Always use the monthly price from the appropriate plan
            const directData = isYearlyChecked ? apiData.yearly : apiData.monthly;
            const directPrice = directData.monthly_price;
            
            if (directPrice !== null) {
                // Convert API value (cents) to euros for display
                result = directPrice / 100;
                console.log(`Using direct API price: ${result} € (${isYearlyChecked ? 'yearly plan, monthly payment' : 'monthly plan'})`);
                
                // If a bundle is selected, use the exact API prices from the API response
                if (selectedBundle) {
                    // Get discount percentage from bundle selection
                    if (selectedBundle === 'architekt') {
                        savingsPercentage = 25;
                    } else if (selectedBundle === 'baunternehmen') {
                        savingsPercentage = 30;
                    } else if (selectedBundle === 'flexxter_full') {
                        savingsPercentage = 35;
                    }
                    
                    // Use the regular_monthly_price from the API for "ohne Bundle" price if available
                    if (directData.regular_monthly_price) {
                        fullPrice = directData.regular_monthly_price / 100;
                        console.log(`Using API regular_monthly_price for ohne Bundle: ${fullPrice}€`);
                    } else {
                        // Fallback to calculating the full price based on the discount
                        fullPrice = result / (1 - (savingsPercentage / 100));
                        console.log(`Calculated ohne Bundle price: ${fullPrice}€`);
                    }
                    
                    // For bundles, the actual price is already discounted in the API response
                    // so we don't need to apply discount again
                    
                    console.log(`Bundle selected: ${selectedBundle}, Discount: ${savingsPercentage}%`);
                    console.log(`Full price: ${fullPrice}€, Discounted price: ${result}€`);
                } else {
                    // For non-bundle selection, use the regular_monthly_price if available
                    // This ensures consistent pricing when switching between bundle and non-bundle
                    if (directData.regular_monthly_price) {
                        result = directData.regular_monthly_price / 100;
                        console.log(`Using API regular_monthly_price for standard pricing: ${result}€`);
                    }
                    fullPrice = result;
                    savingsPercentage = 0;
                }
            } else {
                // Fall back to the calculation method if direct price is not available
                calculateFromAddonPrices();
            }
        } else {
            // If no direct pricing available, use calculation
            calculateFromAddonPrices();
        }
        
        // Calculate price based on individual addon prices (fallback method)
        function calculateFromAddonPrices() {
            console.log("Using calculated addon prices");
            
            // Get base price from pricing model
            let basePrice = isYearlyChecked 
                ? window.pricingModel.basePrices.yearly
                : window.pricingModel.basePrices.monthly;
                
            result = licences * basePrice;
            let bundleAddOns = [];
            let extraAddOns = 0;
            
            // Get bundle addons if a bundle is selected
            if (selectedBundle) {
                bundleAddOns = window.pricingModel.bundles[selectedBundle].addons;
            }
            
            // Validate that all bundle add-ons are actually selected
            // If any bundle add-on is missing, the bundle should no longer be valid
            if (selectedBundle && bundleAddOns.length > 0) {
                let allBundleAddonsSelected = true;
                
                // Check if all add-ons in the bundle are still selected
                for (const addonId of bundleAddOns) {
                    const addon = document.getElementById(addonId);
                    if (addon && !addon.checked) {
                        allBundleAddonsSelected = false;
                        console.log(`Bundle ${selectedBundle} validation failed: ${addonId} is not selected`);
                        break;
                    }
                }
                
                // If not all bundle add-ons are selected, invalidate the bundle
                if (!allBundleAddonsSelected) {
                    console.log(`Invalidating bundle ${selectedBundle} during price calculation`);
                    selectedBundle = null;
                    bundleAddOns = [];
                    
                    // This needs to be done outside the current function to avoid UI update issues
                    setTimeout(() => {
                        const bundleCheckboxes = ['architekt', 'baunternehmen', 'flexxter_full'];
                        bundleCheckboxes.forEach(id => {
                            const bundleCheckbox = document.getElementById(id);
                            if (bundleCheckbox && bundleCheckbox.checked) {
                                bundleCheckbox.checked = false;
                                updateCheckboxVisual(bundleCheckbox, false);
                            }
                        });
                        
                        // Hide the bundle price section
                        if (bundleSection) {
                            bundleSection.style.display = 'none';
                        }
                    }, 50);
                } else if (selectedBundle) {
                    // Make sure bundle price section is displayed if all conditions are met
                    if (bundleSection && bundleSection.style.display !== 'block') {
                        bundleSection.style.display = 'block';
                    }
                }
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
                        result += addValue * licences;
                    } else if (selectedBundle) {
                        // This is an extra add-on outside the bundle - track separately
                        extraAddOns += addValue * licences;
                    } else {
                        // No bundle selected, just add to the total
                        result += addValue * licences;
                    }
                }
            });
            
            // Store the "ohne Bundle" price for reference (before any discounts)
            fullPrice = result + extraAddOns;
            
            // Apply bundle discount based on the label percentages
            if (selectedBundle) {
                // Get discount percentage from bundle selection
                if (selectedBundle === 'architekt') {
                    savingsPercentage = 25;
                } else if (selectedBundle === 'baunternehmen') {
                    savingsPercentage = 30;
                } else if (selectedBundle === 'flexxter_full') {
                    savingsPercentage = 35;
                }
                
                // The full price without discount (we'll show this in "ohne Bundle")
                fullPrice = result + extraAddOns;
                
                // IMPORTANT: We don't apply any discount here in the fallback method
                // The API already gives us the correct prices, including discounts for bundles
                // Just add any extra add-ons (those not part of the bundle) to the result
                result = result + extraAddOns;
                
                console.log(`Calculated bundle price (no additional discount applied): Full: ${fullPrice}€, Final: ${result}€`);
            }
        }
        
        // Update price displays
        if (resultElement) {
            // First update the result element's text content
            resultElement.textContent = result.toFixed(2);
            
            // Get parent div that contains the price
            const priceDiv = resultElement.parentElement;
            if (priceDiv) {
                // Check if savings info already exists
                let savingsDiv = priceDiv.querySelector('.savings-info');
                
                if (selectedBundle) {
                    // If savings div doesn't exist, create it
                    if (!savingsDiv) {
                        savingsDiv = document.createElement('div');
                        savingsDiv.className = 'savings-info';
                        savingsDiv.style.cssText = 'color: #64bc2d; font-weight: bold; font-size: 14px; margin-top: 4px; text-align: center;';
                        priceDiv.appendChild(savingsDiv);
                    }
                    
                    // Calculate the amount saved in euros
                    const savedAmount = fullPrice - result;
                    
                    // Update the savings text to show the saved amount in euros
                    savingsDiv.textContent = `(${savedAmount.toFixed(2)} € gespart)`;
                } else {
                    // Remove savings div if exists and no bundle is selected
                    if (savingsDiv) {
                        savingsDiv.remove();
                    }
                }
            }
        }
        
        // Update "ohne Bundle" price if visible
        if (bundleSection.style.display === 'block') {
            // Find the price text element
            const priceElement = bundleSection.querySelector('.calculator_price:first-child');
            const ohneBundleSpan = ohneBundlePrice.querySelector('span');
            
            // Format the full price with strikethrough
            if (selectedBundle) {
                // Update the label text (without savings percentage now)
                if (priceElement) {
                    priceElement.textContent = 'Preis pro Monat ohne Bundle:';
                }
                
                // Display the original price with strikethrough
                if (ohneBundleSpan) {
                    ohneBundleSpan.innerHTML = `<span style="text-decoration: line-through;">${fullPrice.toFixed(2)}</span>`;
                }
            } else {
                // Regular display without bundle
                if (priceElement) {
                    priceElement.textContent = 'Preis pro Monat ohne Bundle:';
                }
                if (ohneBundleSpan) {
                    ohneBundleSpan.textContent = fullPrice.toFixed(2);
                }
            }
        }
    }
    
    // Initialize the calculator when the page loads
    initializeCalculator();
    
    // Extra enforcement for slider values
    setTimeout(() => {
        console.log("Extra slider position enforcement");
        if (licencesInput) updateSliderUI(licencesInput, Math.max(1, parseInt(licencesInput.textContent) || 0));
        if (staffInput) updateSliderUI(staffInput, Math.max(1, parseInt(staffInput.textContent) || 0));
        
        // Initialize bundle section based on current payment selection
        const monthlyRadio = document.querySelector('input[value="Monatlich"]');
        if (monthlyRadio && typeof updateBundleSection === 'function') {
            const isMonthly = monthlyRadio.checked;
            updateBundleSection(isMonthly);
        }
    }, 500);
});