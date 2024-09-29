// https://developers.google.com/apps-script/guides/triggers/installable#manage_triggers_programmatically
namespace triggers {
  /**
   * Deletes a trigger.
   * @param {string} triggerId The Trigger ID.
   * @see https://developers.google.com/apps-script/guides/triggers/installable
   */
  export function deleteAllTriggers() {
    // Loop over all triggers.
    const allTriggers = ScriptApp.getProjectTriggers();
    allTriggers.forEach((trigger) => {
      // Delete the trigger.
      ScriptApp.deleteTrigger(trigger);
    });
  }

  export function createTriggers() {
    const triggers = ScriptApp.getProjectTriggers();
    if (triggers.length === 0) {
      ScriptApp.newTrigger('fireOnEdit')
        .forSpreadsheet(SpreadsheetApp.getActive())
        .onEdit()
        .create();
    }
  }
}

export { triggers };
