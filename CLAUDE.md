# FlexXter Calc Project Guidelines

## Commands
- **Lint:** eslint calc-flexxter.js
- **Format:** prettier --write calc-flexxter.js
- **Test:** Open Webflow page in browser and test calculator functionality
- **Single Test:** Test specific feature by manipulating form elements directly

## Code Style
- **Formatting:** Use camelCase for variables and functions
- **DOM Selection:** Use querySelector/getElementById with data attributes (e.g., [calculator-licences])
- **Event Listeners:** Add at document load, use arrow functions for callbacks
- **Functions:** Pure functions where possible, descriptive naming
- **Error Handling:** Use defensive coding with existence checks (!element) before operations
- **Comments:** Document complex calculations, business logic, and bundle configurations
- **Constants:** Group related constants in objects (e.g., bundles configuration object)
- **HTML Integration:** Use custom data attributes for JS interactions
- **Organization:** Group related functionality together (bundle handling, UI updates)

## Project Structure
- Single JS file (calc-flexxter.js) controlling calculator functionality
- Web-based calculator for FlexXter pricing with bundle discounts
- Integrates with Webflow forms using custom attributes
- Relies on Webflow-specific CSS classes for visual updates (w--redirected-checked)
- Uses MutationObserver to track UI changes