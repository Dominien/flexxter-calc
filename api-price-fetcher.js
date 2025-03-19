document.addEventListener("DOMContentLoaded", function () {
    // Configuration for the FlexXter API
    const API_CONFIG = {
        baseUrl: "https://www.flexxter.de/GetPrice/php",
        cacheTime: 1800000, // 30 minutes in milliseconds
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
            "foreman": "Poliere-Kolonenf-hrer"
        },
        // Reverse mapping for UI to API conversion
        reverseAddonMapping: {}
    };

    // Initialize reverse mapping
    for (const [apiKey, domId] of Object.entries(API_CONFIG.addonMapping)) {
        API_CONFIG.reverseAddonMapping[domId] = apiKey;
    }

    // Cache object to store fetched data
    const priceCache = {
        data: null,
        timestamp: 0,
        isFetching: false
    };

    // DOM elements references 
    const licencesInput = document.querySelector('[calculator-licences]');
    const staffInput = document.querySelector('[calculator-stuff]');
    const resultElement = document.querySelector('[calculator-result]');
    const yearlyRadio = document.querySelector('input[is-yearly]');
    const checkboxes = document.querySelectorAll('input[calculator-add]');
    const bundleSection = document.querySelector('.calculator_result-wrapper.bundle');
    const ohneBundlePrice = document.getElementById('ohne-bundle');
    
    // Price calculator initialization
    async function initializeCalculator() {
        try {
            // Show loading state
            displayLoadingState(true);
            
            // Get the pricing data
            const pricingData = await fetchPricingData();
            
            // Initialize calculator with fetched data
            setupCalculator(pricingData);
            
            // Hide loading state
            displayLoadingState(false);
            
            // Setup event listeners for UI updates
            setupEventListeners();
            
            // Initial calculation
            updateResult();
            
            console.log("Price calculator initialized with FlexXter API data");
        } catch (error) {
            handleApiError(error);
        }
    }

    // Function to fetch pricing data from the FlexXter API
    async function fetchPricingData() {
        // Check if we have cached data that's still valid
        const now = Date.now();
        if (
            priceCache.data !== null && 
            now - priceCache.timestamp < API_CONFIG.cacheTime &&
            !priceCache.isFetching
        ) {
            return priceCache.data;
        }

        // If already fetching, wait for it to complete
        if (priceCache.isFetching) {
            return new Promise((resolve, reject) => {
                const checkCache = setInterval(() => {
                    if (!priceCache.isFetching && priceCache.data !== null) {
                        clearInterval(checkCache);
                        resolve(priceCache.data);
                    } else if (!priceCache.isFetching && priceCache.data === null) {
                        clearInterval(checkCache);
                        reject(new Error("Failed to fetch pricing data"));
                    }
                }, 100);
            });
        }

        priceCache.isFetching = true;

        try {
            // Create a function to extract prices from HTML response
            const extractPriceData = (html) => {
                // Extract base price
                const basePriceMatch = html.match(/<span[^>]*id="gesamtpreis"[^>]*>([0-9,.]+)<\/span>/);
                const basePrice = basePriceMatch ? parseFloat(basePriceMatch[1].replace(',', '.')) : null;
                
                // Extract addon prices
                const addons = {};
                
                Object.keys(API_CONFIG.addonMapping).forEach(addonKey => {
                    // Look for addon price elements
                    const regex = new RegExp(`<span[^>]*data-addon="${addonKey}"[^>]*>([0-9,.]+)<\/span>`);
                    const match = html.match(regex);
                    
                    if (match) {
                        const price = parseFloat(match[1].replace(',', '.'));
                        addons[addonKey] = { price };
                    }
                });
                
                return {
                    base_price: basePrice,
                    addons
                };
            };
            
            // Create a function to extract bundle price
            const extractBundlePrice = (html) => {
                // Extract total price
                const totalPriceMatch = html.match(/<span[^>]*id="gesamtpreis"[^>]*>([0-9,.]+)<\/span>/);
                const totalPrice = totalPriceMatch ? parseFloat(totalPriceMatch[1].replace(',', '.')) : null;
                
                return { total_price: totalPrice };
            };
            
            // Define the add-ons we want to get prices for
            const allAddOns = Object.keys(API_CONFIG.addonMapping).join(',');
            
            // Fetch monthly pricing (lz=1)
            const monthlyUrl = `${API_CONFIG.baseUrl}?public=true&am=2&lz=1&licenses=1&addons=${allAddOns}`;
            
            // Fetch yearly pricing (lz=2)
            const yearlyUrl = `${API_CONFIG.baseUrl}?public=true&am=2&lz=2&licenses=1&addons=${allAddOns}`;
            
            // Define architect bundle addons
            const architectAddons = [
                'incidents', 'construction-diary', 'forms', 'flexxter-ai', 
                'custom-project-variables', 'project-baseplans', 'project-expanses', 'whatsapp'
            ].join(',');
            
            // Define construction bundle addons
            const constructionAddons = [
                'incidents', 'construction-diary', 'gangs', 'time-recording', 
                'forms', 'invoices', 'flexxter-ai', 'custom-project-variables', 
                'project-baseplans', 'project-expanses', 'whatsapp'
            ].join(',');
                
            // Fetch bundle data using addons parameter
            const architectBundleUrl = `${API_CONFIG.baseUrl}?public=true&am=2&lz=2&licenses=1&addons=${architectAddons}`;
            const constructionBundleUrl = `${API_CONFIG.baseUrl}?public=true&am=2&lz=2&licenses=1&addons=${constructionAddons}`;
            const completeUrl = `${API_CONFIG.baseUrl}?public=true&am=2&lz=2&licenses=1&addons=${allAddOns}`;
            
            console.log("API URLs:");
            console.log("Monthly: " + monthlyUrl);
            console.log("Yearly: " + yearlyUrl);
            
            // Fetch all data in parallel
            const [
                monthlyResponse,
                yearlyResponse,
                architectResponse,
                constructionResponse,
                completeResponse
            ] = await Promise.all([
                fetch(monthlyUrl),
                fetch(yearlyUrl),
                fetch(architectBundleUrl),
                fetch(constructionBundleUrl),
                fetch(completeUrl)
            ]);
            
            // Get HTML responses
            const monthlyHtml = await monthlyResponse.text();
            const yearlyHtml = await yearlyResponse.text();
            const architectHtml = await architectResponse.text();
            const constructionHtml = await constructionResponse.text();
            const completeHtml = await completeResponse.text();
            
            // Extract price data from HTML
            const monthlyData = extractPriceData(monthlyHtml);
            const yearlyData = extractPriceData(yearlyHtml);
            const architectData = extractBundlePrice(architectHtml);
            const constructionData = extractBundlePrice(constructionHtml);
            const completeData = extractBundlePrice(completeHtml);
            
            console.log("Extracted monthly data:", JSON.stringify(monthlyData).substring(0, 100) + "...");
            console.log("Extracted yearly data:", JSON.stringify(yearlyData).substring(0, 100) + "...");
            
            // If base prices are not found, use defaults
            if (!monthlyData.base_price) monthlyData.base_price = 59.9;
            if (!yearlyData.base_price) yearlyData.base_price = 49.9;
            if (!architectData.total_price) architectData.total_price = 99.9;
            if (!constructionData.total_price) constructionData.total_price = 129.9;
            if (!completeData.total_price) completeData.total_price = 199.9;
            
            // Process and combine the data
            const pricingData = processPricingData(
                monthlyData, 
                yearlyData, 
                architectData,
                constructionData,
                completeData
            );

            // Store in cache
            priceCache.data = pricingData;
            priceCache.timestamp = now;
            
            return pricingData;
        } catch (error) {
            console.error("Error fetching pricing data:", error);
            throw error;
        } finally {
            priceCache.isFetching = false;
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
        
        // Calculate bundle discount percentages by comparing bundle prices to individual prices
        const calculateDiscount = (bundleData, includedAddons) => {
            // Calculate total price of individual components
            const basePrice = parseFloat(yearlyData.base_price) || 49.90;
            
            let individualTotal = basePrice;
            for (const addon of includedAddons) {
                const apiKey = API_CONFIG.reverseAddonMapping[addon];
                if (apiKey && yearlyData.addons && yearlyData.addons[apiKey]) {
                    individualTotal += parseFloat(yearlyData.addons[apiKey].price) || 0;
                }
            }
            
            // Get bundle price
            const bundlePrice = parseFloat(bundleData.total_price) || individualTotal;
            
            // Calculate discount percentage
            const discount = (individualTotal - bundlePrice) / individualTotal;
            return Math.max(0, Math.min(discount, 0.99)); // Limit between 0 and 0.99
        };
        
        // Define bundle contents (will be used to calculate discounts)
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
        
        // Calculate bundle discounts
        const bundleDiscounts = {
            architekt: calculateDiscount(architectData, bundles.architekt.addons) || 0.25,
            baunternehmen: calculateDiscount(constructionData, bundles.baunternehmen.addons) || 0.30,
            flexxter_full: calculateDiscount(completeData, bundles.flexxter_full.addons) || 0.35
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
        
        // Try to get cached pricing from localStorage
        try {
            const cachedPricing = localStorage.getItem('flexxter_pricing');
            if (cachedPricing) {
                const parsedCache = JSON.parse(cachedPricing);
                // Check if the cached data has a valid timestamp and structure
                if (parsedCache && parsedCache.timestamp && 
                    Date.now() - parsedCache.timestamp < 86400000) { // 24 hours
                    console.log("Using cached pricing data from localStorage");
                    setupCalculator(parsedCache.data);
                    return;
                }
            }
        } catch (e) {
            console.error("Error accessing localStorage:", e);
        }
        
        // Fall back to default pricing constants
        console.log("Using default pricing constants");
        setupCalculator(defaultPricing);
    }

    // Setup calculator with the provided pricing data
    function setupCalculator(pricingData) {
        // Update pricingModel with data from API
        window.pricingModel = pricingData;
        
        // Save to localStorage as backup
        try {
            localStorage.setItem('flexxter_pricing', JSON.stringify({
                timestamp: Date.now(),
                data: pricingData
            }));
        } catch (e) {
            console.warn("Could not save pricing data to localStorage:", e);
        }
        
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
        // Listen for changes in licenses
        if (licencesInput) {
            const observer = new MutationObserver(updateResult);
            observer.observe(licencesInput, { childList: true, subtree: true, characterData: true });
        }
        
        // Listen for changes in staff if present
        if (staffInput) {
            const observer = new MutationObserver(updateResult);
            observer.observe(staffInput, { childList: true, subtree: true, characterData: true });
        }
        
        // Listen for changes in payment period (yearly/monthly)
        const radios = document.querySelectorAll('input[name="Laufzeit"]');
        radios.forEach(radio => {
            const visual = radio.closest('.form_radio').querySelector('.w-radio-input');
            const radioObserver = new MutationObserver(() => {
                updateResult();
                // Update displayed add-on prices
                if (window.pricingModel && window.pricingModel.addOns) {
                    updateAddOnPricesInDOM(window.pricingModel.addOns);
                }
            });
            radioObserver.observe(visual, { attributes: true, attributeFilter: ['class'] });
            
            radio.addEventListener("change", updateResult);
            radio.closest('.form_radio').addEventListener("click", updateResult);
        });
        
        // Listen for changes in add-ons
        checkboxes.forEach(checkbox => {
            const checkboxWrapper = checkbox.closest('.form_checkbox').querySelector('.w-checkbox-input');
            const checkboxObserver = new MutationObserver(updateResult);
            checkboxObserver.observe(checkboxWrapper, { attributes: true, attributeFilter: ['class'] });
            
            checkbox.addEventListener("change", updateResult);
        });
        
        // Listen for bundle selection
        const bundleCheckboxes = document.querySelectorAll('#architekt, #baunternehmen, #flexxter_full');
        bundleCheckboxes.forEach(bundleCheckbox => {
            const bundleName = bundleCheckbox.id;
            bundleCheckbox.addEventListener('change', () => handleBundleSelection(bundleName));
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
    
    // Apply selected bundle
    function applyBundle(bundleId) {
        if (!window.pricingModel || !window.pricingModel.bundles) return;
        
        const bundle = window.pricingModel.bundles[bundleId];
        if (!bundle) return;
        
        // Set licenses and staff values
        setSliderValue(licencesInput, bundle.licences);
        if (staffInput) {
            setSliderValue(staffInput, bundle.staff);
        }
        
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
        
        let licences = parseFloat(licencesInput.textContent) || 0;
        
        const isYearlyChecked = yearlyRadio.closest('.form_radio').querySelector('.w-radio-input')
            .classList.contains('w--redirected-checked');
        
        // Get base price from pricing model
        let basePrice = isYearlyChecked 
            ? window.pricingModel.basePrices.yearly
            : window.pricingModel.basePrices.monthly;
            
        let result = licences * basePrice;
        let bundleAddOns = [];
        let extraAddOns = 0;
        
        // Determine which bundle is selected and get its add-ons
        let selectedBundle = null;
        let selectedBundleDiscount = 0;
        
        const architektBundle = document.getElementById('architekt');
        const bauunternehmenBundle = document.getElementById('baunternehmen');
        const flexxterFullBundle = document.getElementById('flexxter_full');
        
        if (architektBundle.checked) {
            selectedBundle = 'architekt';
            selectedBundleDiscount = window.pricingModel.bundleDiscounts.architekt;
            bundleAddOns = window.pricingModel.bundles.architekt.addons;
        } else if (bauunternehmenBundle.checked) {
            selectedBundle = 'baunternehmen';
            selectedBundleDiscount = window.pricingModel.bundleDiscounts.baunternehmen;
            bundleAddOns = window.pricingModel.bundles.baunternehmen.addons;
        } else if (flexxterFullBundle.checked) {
            selectedBundle = 'flexxter_full';
            selectedBundleDiscount = window.pricingModel.bundleDiscounts.flexxter_full;
            bundleAddOns = window.pricingModel.bundles.flexxter_full.addons;
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
        let fullPrice = result + extraAddOns;
        
        // Apply bundle discount to only the bundle items
        let discountedPrice = 0;
        let savingsPercentage = 0;
        
        if (selectedBundle) {
            discountedPrice = result * (1 - selectedBundleDiscount);
            // Add the extra add-ons without discount
            result = discountedPrice + extraAddOns;
            
            // Calculate savings percentage (for the bundled items only)
            savingsPercentage = Math.round(selectedBundleDiscount * 100);
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
                    
                    // Update the savings text
                    savingsDiv.textContent = `(${savingsPercentage}% gespart)`;
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
    
    // Check for offline mode
    function isOfflineMode() {
        return !navigator.onLine;
    }
    
    // Retry mechanism with exponential backoff
    async function fetchWithRetry(url, options = {}, maxRetries = 3) {
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                const response = await fetch(url, options);
                
                // Check if response is ok
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return response;
            } catch (error) {
                retries++;
                if (retries >= maxRetries) throw error;
                
                // Exponential backoff
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                
                console.log(`Retry ${retries}/${maxRetries} for ${url}`);
            }
        }
    }

    // Initialize the calculator when the page loads
    initializeCalculator();
});