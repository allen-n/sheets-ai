# SheetsAI Analytics Integration

This document provides information about the PostHog analytics integration in SheetsAI.

## Overview

SheetsAI uses PostHog to collect anonymous usage data to improve the add-on. The analytics implementation follows these key principles:

- No sheet content, prompts, or raw user emails are collected
- Users can opt out at any time via the Settings UI
- Events are batched to respect Google Apps Script quotas
- All data is tied to a randomly generated UUID and, when available, a hashed email

## Deployment Steps

### 1. Setting up the PostHog Project Key

The PostHog project key must be manually set in the ScriptProperties once after deployment:

```javascript
// Run this script only once after deployment
function setPostHogKey() {
  PropertiesService.getScriptProperties().setProperty(
    'PH_PROJECT_KEY', 
    'YOUR_POSTHOG_PROJECT_KEY'
  );
}
```

### 2. Updating the Deployment Manifest

The deployment requires the following OAuth scopes in `appsscript.json`:
- `https://www.googleapis.com/auth/script.invocation` (for time-based triggers)
- `https://www.googleapis.com/auth/script.scriptapp` (for managing triggers)

### 3. Verifying the Setup

After deployment:
1. Install the add-on in a test environment
2. Open a spreadsheet to trigger the `onOpen` event
3. Verify in the PostHog dashboard that events are being received
4. Test the opt-out toggle in the Settings UI

## Consent Wording

The following text is used in the UI to inform users about analytics:

> **Anonymous usage analytics**
> 
> Helps improve SheetsAI by collecting anonymous usage data. No sheet content or prompts are collected.

## Granular Consent Requirements (May 2025)

Starting May 2025, Google Workspace Add-ons will require granular consent for data collection. To prepare for this:

1. The `analytics_opt_out` user property is already implemented
2. User consent is clearly indicated via the UI toggle
3. All analytics tracking respects this setting

## Collected Events

The following events are tracked:

- `addon_opened`: When the add-on is initialized
- `sidebar_opened`: When the help sidebar is opened
- `menu_action`: When a menu item is clicked
- `api_key_set`: When an API key is saved (key value is not collected)
- `function_call`: When the SHEETS_AI function is called (query content is not collected)
- `error`: When errors occur
- `analytics_opt_change`: When analytics opt-in/out status changes

## Testing

Test cases for the analytics implementation are available in `tests/analytics.test.ts`. These include:

- Verifying UUID persistence
- Testing hashed email functionality
- Confirming that opt-out settings are respected
- Validating batch payloads

## Security Considerations

- The PostHog project key is stored only in ScriptProperties
- Email addresses are hashed using SHA-256 before sending
- All network requests use HTTPS
- The PostHog instance is self-hosted at analytics.sheetsai.com

## Troubleshooting

If analytics events are not appearing in PostHog:

1. Check if the project key is correctly set in ScriptProperties
2. Verify that the time-based trigger is running (via Apps Script dashboard)
3. Check if the user has opted out via the Settings UI
4. Inspect the Stackdriver logs for any errors 