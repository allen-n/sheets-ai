import { PostHogAnalytics } from '@/analytics/posthog';
import { getLogoUrl } from '@/common/utils';

/**
 * Creates a settings card with various user configuration options
 * @returns CardService.Card The settings card
 */
export function createSettingsCard(): GoogleAppsScript.Card_Service.Card {
  const analytics = PostHogAnalytics.getInstance();
  const card = CardService.newCardBuilder();

  // Add a header
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Settings')
      .setImageStyle(CardService.ImageStyle.CIRCLE)
      .setImageUrl(getLogoUrl())
  );

  // Create a section for analytics settings
  const analyticsSection =
    CardService.newCardSection().setHeader('Privacy Settings');

  // Add analytics opt-out toggle
  const analyticsSwitch = CardService.newSwitch()
    .setFieldName('analytics_enabled')
    .setValue('true')
    .setSelected(!analytics.isOptedOut())
    .setOnChangeAction(
      CardService.newAction().setFunctionName('handleAnalyticsToggle')
    )
    .setControlType(CardService.SwitchControlType.SWITCH);

  const analyticsSwitchDecoration = CardService.newDecoratedText()
    .setText('Anonymous usage analytics')
    .setWrapText(true)
    .setBottomLabel(
      'Helps improve SheetsAI by collecting anonymous usage data. No sheet content or prompts are collected.'
    )
    .setSwitchControl(analyticsSwitch);

  analyticsSection.addWidget(analyticsSwitchDecoration);

  // Add a divider
  analyticsSection.addWidget(CardService.newDivider());

  // Add a button for resetting preferences
  const resetButton = CardService.newTextButton()
    .setText('Reset All Settings')
    .setOnClickAction(
      CardService.newAction().setFunctionName('resetAllSettings')
    );

  analyticsSection.addWidget(resetButton);

  // Add the section to the card
  card.addSection(analyticsSection);

  return card.build();
}

/**
 * Handles the analytics toggle change
 * @param e The event object from CardService
 * @returns CardService.ActionResponse The action response
 */
export function handleAnalyticsToggle(
  e: any
): GoogleAppsScript.Card_Service.ActionResponse {
  const analytics = PostHogAnalytics.getInstance();
  const isEnabled = e.formInput.analytics_enabled === 'true';

  // Update the opt-out setting (true = opted out, false = opted in)
  analytics.setOptOut(!isEnabled);

  // If enabling analytics, ensure triggers are set up
  if (isEnabled) {
    analytics.ensureTriggers();
  } else {
    analytics.removeTriggers();
  }

  // Return an action response that doesn't navigate away
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText(
        `Analytics ${isEnabled ? 'enabled' : 'disabled'}`
      )
    )
    .build();
}

/**
 * Resets all user settings to defaults
 * @returns CardService.ActionResponse The action response
 */
export function resetAllSettings(): GoogleAppsScript.Card_Service.ActionResponse {
  // Clear all user properties
  PropertiesService.getUserProperties().deleteAllProperties();

  // Re-enable analytics by default
  const analytics = PostHogAnalytics.getInstance();
  analytics.setOptOut(false);
  analytics.ensureTriggers();

  // Return an action response that reloads the card
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText(
        'All settings have been reset to defaults'
      )
    )
    .setNavigation(
      CardService.newNavigation().popToRoot().updateCard(createSettingsCard())
    )
    .build();
}
