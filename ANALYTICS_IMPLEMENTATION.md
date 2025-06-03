# PostHog Analytics Implementation

This document provides an overview of the PostHog analytics integration implemented in the SheetsAI Google Apps Script add-on.

## Files Created/Modified

### New Files

1. **`src/analytics/constants.ts`**
   - Event names, property keys, API endpoints, and configuration values

2. **`src/analytics/queue.ts`**
   - Implementation of event queue with in-memory + CacheService persistence
   - Handles batching of events before sending to PostHog

3. **`src/analytics/posthog.ts`**
   - Main PostHog analytics implementation
   - Provides methods for tracking events, user identification, and queue management
   - Implements UUID generation, email hashing, and trigger management

4. **`src/ui/settingsCard.ts`**
   - CardService UI for analytics opt-out toggle
   - Handles user consent management

5. **`tests/analytics.test.ts`**
   - Unit tests for the analytics implementation
   - Mock for UrlFetchApp to test batching and payload structure

6. **`README_ANALYTICS.md`**
   - Documentation for deployment steps and consent wording

### Modified Files

1. **`src/appsscript.json`**
   - Added OAuth scopes for script.invocation (for triggers)
   - Added analytics.sheetsai.com to URL whitelist

2. **`src/main.ts`**
   - Added analytics tracking in key user flows
   - Added trigger handler function for queue flushing
   - Added Settings menu option

3. **`src/ui/UIManager.ts`**
   - Added method to display the settings card

## Key Features Implemented

1. **Anonymous User Identification**
   - Generated UUID stored in UserProperties
   - SHA-256 hashing of user email when available

2. **Event Batching**
   - In-memory queue with CacheService backup
   - Time-based trigger for periodic flush
   - Batch submission to respect quotas

3. **User Consent**
   - Opt-out toggle in settings UI
   - Persistence of user preference
   - All tracking respects this setting

4. **Security Considerations**
   - No prompt or sheet data collection
   - Project key stored in ScriptProperties
   - Email hashing for privacy

## Event Tracking

The following events are tracked:

- `addon_opened`: When SheetsAI is initialized
- `sidebar_opened`: When the help sidebar is displayed
- `menu_action`: When menu items are clicked
- `api_key_set`: When API keys are saved (without the key itself)
- `function_call`: When SHEETS_AI function is called (without query content)
- `analytics_opt_change`: When analytics opt-in/out status changes

## Deployment Instructions

1. Deploy the add-on normally
2. Set the PostHog project key in ScriptProperties:
   ```javascript
   function setPostHogKey() {
     PropertiesService.getScriptProperties().setProperty(
       'PH_PROJECT_KEY', 
       'YOUR_POSTHOG_PROJECT_KEY'
     );
   }
   ```
3. Install the add-on in a test environment to verify events are being received

## Testing

The implementation includes unit tests that verify:
- UUID persistence
- Email hashing
- Opt-out functionality
- Proper event batching
- Trigger management

## Future Considerations

1. **Granular Consent (May 2025)**
   - The implementation already follows the Workspace add-on granular consent rules that will be required by May 2025

2. **Event Enrichment**
   - Additional contextual properties could be added to events to provide more insights

3. **Error Monitoring**
   - Integration with error tracking to understand failure patterns 