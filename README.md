# FlexXter Calculator

A JavaScript-based pricing calculator for FlexXter services integrated with Webflow.

## Overview

This calculator allows users to:

- Configure the number of licenses and staff members
- Select subscription length (monthly or yearly)
- Choose from predefined bundles with discounts (Architekt, Bauunternehmen, FlexXter Full)
- Add various add-on services with individual pricing
- See real-time price calculations with and without bundle discounts

## Implementation

The calculator is implemented as a single JavaScript file (`calc-flexxter.js`) that integrates with a Webflow form. It uses:

- Custom data attributes for element selection
- Real-time price calculation based on user selections
- Bundle configurations with preset add-ons and discount rates
- MutationObserver pattern to track UI changes and update pricing
- Webflow-specific CSS classes for visual updates

## Integration

To integrate this calculator with your Webflow site:

1. Add the form HTML with the appropriate custom attributes
2. Include the `calc-flexxter.js` file in your Webflow project
3. Test the calculator with different configurations

## Development

For local development:

1. Make changes to `calc-flexxter.js`
2. Format using Prettier: `prettier --write calc-flexxter.js`
3. Test changes by uploading to Webflow or using a local server

## License

© FlexXter - All rights reserved