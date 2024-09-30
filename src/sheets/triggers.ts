// https://developers.google.com/apps-script/guides/triggers/installable#manage_triggers_programmatically

export class TriggerService {
  constructor(private triggers: GoogleAppsScript.Script.Trigger[]) {
    this.triggers = ScriptApp.getProjectTriggers();
  }

  /**
   * Deletes a trigger.
   * @param {string} triggerId The Trigger ID.
   * @see https://developers.google.com/apps-script/guides/triggers/installable
   */
  deleteAllTriggers() {
    // Loop over all triggers.
    const allTriggers = ScriptApp.getProjectTriggers();
    allTriggers.forEach((trigger) => {
      // Delete the trigger.
      ScriptApp.deleteTrigger(trigger);
    });
  }

  createTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    if (triggers.length === 0) {
      ScriptApp.newTrigger('fireOnEdit')
        .forSpreadsheet(SpreadsheetApp.getActive())
        .onEdit()
        .create();
    }
  }
}
