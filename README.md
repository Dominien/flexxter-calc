# FlexXter Calculator

A JavaScript-based pricing calculator for FlexXter services integrated with Webflow.

## Overview

This calculator allows users to:

- Configure the number of licenses and staff members
- Select subscription length (monthly or yearly)
- Choose from predefined bundles with discounts (Architekt, Bauunternehmen, FlexXter Full)
- Add various add-on services with individual pricing
- See real-time price calculations with and without bundle discounts

## Implementation Details

The calculator is implemented as a single JavaScript file (`calc-flexxter.js`) that integrates with a Webflow form. Key features include:

### Bundle System
- Three pre-configured bundles with different discount rates:
  - Architekt: 25% discount on specified add-ons
  - Bauunternehmen: 30% discount on specified add-ons
  - FlexXter Full: 35% discount on all add-ons
- Bundle selection automatically checks appropriate add-ons
- Auto-enforces yearly subscription when a bundle is selected

### Advanced Pricing Logic
- Bundle discounts apply only to add-ons included in the selected bundle
- Extra add-ons selected outside the bundle are added at full price
- Dynamic comparison shows full price vs. discounted bundle price
- Prices adjust based on license count multiplier

### Technical Implementation
- Custom data attributes (e.g., `calculator-add-yearly`, `calculator-add`) for pricing
- Element ID-based add-on identification (matches bundle configuration)
- Slider components for license and staff count with visual feedback
- Real-time calculation using MutationObserver to track UI changes
- Webflow-specific CSS class manipulation for visual state management

### Code Organization
- Event-driven architecture with clearly separated concerns
- Bundle configurations stored as JavaScript objects
- Helper functions for UI manipulation (checkbox states, sliders)
- Smart price calculation with separate handling for bundled vs. extra add-ons

## Integration

To integrate this calculator with your Webflow site:

1. Add the form HTML with the appropriate custom attributes
2. Include the `calc-flexxter.js` file in your Webflow project
3. Ensure HTML element IDs match the bundle configuration
4. Test the calculator with different configurations

## Development

For local development:

1. Make changes to `calc-flexxter.js`
2. Format using Prettier: `prettier --write calc-flexxter.js`
3. Test changes by uploading to Webflow or using a local server

### Extending the Calculator

To add new add-ons or bundles:
1. Add the HTML elements with proper IDs and pricing attributes
2. Update the bundle configurations in the JavaScript
3. Test thoroughly with different combinations of selections

## License

© Flexxter - All rights reserved