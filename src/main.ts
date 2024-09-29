// Global variable to store the last time an edit occurred

const DELTA_TIME_S = 2;
const DELTA_TIME_MS = DELTA_TIME_S * 1000;
const DELAY_TIME_MS = DELTA_TIME_MS * 5;
const MAX_RUNTIME_MS = DELTA_TIME_MS * 10;

import { triggers } from '@/sheets/triggers';
import { utils } from '@/sheets/utils';
export type EditQueueItem = {
  key: string;
  e: GoogleAppsScript.Events.SheetsOnEdit;
  oldRowData: any[];
};
enum EditType {
  OLD = 'OLD',
  NEW = 'NEW',
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('SheetsGPT Menu');
  menu.addItem('Authorize', 'authorizeApp').addToUi();
  menu.addItem('Reset Triggers', 'resetTriggersUi').addToUi();
  menu.addItem('Open Audit Log Sheet', 'openAuditLogSheet').addToUi();
  menu.addItem('Open Audit Log Folder', 'openAuditLogFolder').addToUi();
}

function resetTriggers() {
  triggers.deleteAllTriggers();
  triggers.createTriggers();
}

function resetTriggersUi() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Reset Triggers',
    'Are you sure you want to reset triggers?',
    ui.ButtonSet.OK_CANCEL
  );

  if (response == ui.Button.OK) {
    resetTriggers();
    ui.alert('Triggers reset successfully!');
  }
}

function authorizeApp() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Authorization',
    'Please authorize the app to use the necessary permissions.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response == ui.Button.OK) {
    // Trigger a function that requires authorization to prompt the user
    try {
      // Example function that requires authorization
      PropertiesService.getDocumentProperties();
      resetTriggers();
      ui.alert('Authorization successful!');
    } catch (e) {
      ui.alert('Authorization failed. Please try again. Error: ' + e);
    }
  }
}

function openAuditLogSheet() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(DELAY_TIME_MS);
  const spreadsheetName = SpreadsheetApp.getActiveSpreadsheet().getName();
  const folder = utils.getOrCreateFolder(
    spreadsheetName + utils.AUDIT_LOG_PREFIX
  );
  const htmlOutputs: Array<string> = [];

  utils.SOURCE_SHEET_NAMES.forEach((s) => {
    const destinationSpreadsheet = utils.getOrCreateSpreadsheet(
      folder,
      s + utils.AUDIT_LOG_PREFIX
    );
    const url = destinationSpreadsheet.getUrl();
    const aElement = `<a href="${url}" target="_blank">Go to ${s} Audit Log Sheet</a>`;
    htmlOutputs.push(aElement);
  });

  const htmlOutput = HtmlService.createHtmlOutput(htmlOutputs.join('<br>'));
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Open Audit Log Sheet');
  lock.releaseLock();
}

function openAuditLogFolder() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(DELAY_TIME_MS);
  const spreadsheetName = SpreadsheetApp.getActiveSpreadsheet().getName();
  const folder = utils.getOrCreateFolder(
    spreadsheetName + utils.AUDIT_LOG_PREFIX
  );
  const url = folder.getUrl();
  const htmlOutput = HtmlService.createHtmlOutput(
    `<a href="${url}" target="_blank">Go to Audit Log Folder</a>`
  );
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Open Audit Log Folder');
  lock.releaseLock();
}

function onInstall(e: GoogleAppsScript.Events.AddonOnInstall) {
  onOpen();
}

function fireOnEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
  // Proceed only if the edited sheet is the source sheet
  if (!utils.isSourceSheetEdit(e)) {
    console.log('not source sheet edit, exiting');
    return;
  }

  // Store the current time
  const start = new Date();

  // Store the previous row value
  const oldRowData = utils.getEditedRowData(e, true);

  const propertyService = PropertiesService.getDocumentProperties();
  const rowEditKey = utils.getRowEditKey(e);

  const tempTime = propertyService.getProperty(rowEditKey);
  const debounceEndTime = tempTime ? new Date(tempTime) : null;

  // If lastEditTime is not null, increase the processing delay
  const updatedWaitTime = new Date(start.getTime() + DELAY_TIME_MS);

  propertyService.setProperty(rowEditKey, updatedWaitTime.toISOString());

  if (debounceEndTime != null) {
    // If there was an existing timer on this row, that one will capture the edits, so return
    return;
  }
  // Update lastEditTime to the current time

  // Wait for a max of 2 minutes for the user to finish editing the row

  for (let i = 0; i < 12; i++) {
    try {
      Utilities.sleep(DELTA_TIME_MS); // 10 seconds
      const finishTime = propertyService.getProperty(rowEditKey);
      const newNow = new Date();
      if (
        (finishTime && new Date(finishTime) >= newNow) ||
        newNow.getTime() - start.getTime() > MAX_RUNTIME_MS
      ) {
        break;
      }
    } catch (e) {
      console.error('Error setting property', e);
      break;
    }
  }

  propertyService.deleteProperty(rowEditKey);
  // Proceed with the copying logic
  copyRowWithTimestamp({
    key: rowEditKey,
    e: e,
    oldRowData: oldRowData,
  });
}

// TODO @allen: multiple edits in multiple rows playing back close together cause breakage, investigate
function copyRowWithTimestamp(item: EditQueueItem) {
  const e = item.e;
  const oldRowData = item.oldRowData;
  e.source.getSheetByName;
  const sheetName = e.source.getSheetName(); // Get the active sheet
  const range = e.range; // Get the range that was edited
  const row = range.getRow(); // Get the row number of the edited cell

  // Get the source and destination sheets
  const sourceSheet = e.source.getSheetByName(sheetName);

  // Acquire the lock before trying to create folders or make edits
  const lock = LockService.getDocumentLock();
  lock.waitLock(DELAY_TIME_MS);
  const folder = utils.getOrCreateFolder(
    SpreadsheetApp.getActiveSpreadsheet().getName() + utils.AUDIT_LOG_PREFIX
  );
  const destinationSpreadsheet = utils.getOrCreateSpreadsheet(
    folder,
    sheetName + utils.AUDIT_LOG_PREFIX
  );
  const destinationSheet = destinationSpreadsheet.getSheets()[0];

  if (!sourceSheet || !destinationSheet) {
    throw new Error('source or destination sheet not found');
  }

  // Check if the destination sheet is empty
  const isEmpty = destinationSheet.getLastRow() === 0;
  if (isEmpty) {
    // Copy everything from the source sheet to the destination sheet
    const allData = sourceSheet
      .getRange(1, 1, sourceSheet.getLastRow(), sourceSheet.getLastColumn())
      .getValues();

    // Add an empty column for timestamps
    const timestamp = new Date();
    for (let i = 0; i < allData.length; i++) {
      allData[i].unshift(EditType.OLD); // Insert type of edit at the beginning of each row
      allData[i].unshift(i + 1); // Insert original row number at the beginning of each row
      allData[i].unshift(timestamp); // Insert an empty string at the beginning of each row
    }

    // Set the data in the destination sheet
    destinationSheet
      .getRange(1, 1, allData.length, allData[0].length)
      .setValues(allData);

    // Add a header for the timestamp column if needed
    destinationSheet.getRange(1, 1).setValue('Timestamp');
    destinationSheet.getRange(1, 2).setValue('Original Row Number');
    destinationSheet.getRange(1, 3).setValue('Value Type');
  }

  // Get the entire row that was edited
  const rowData = sourceSheet
    .getRange(row, 1, 1, sourceSheet.getLastColumn())
    .getValues()[0];

  // Prepend the current timestamp to the row
  const timestamp = new Date();

  oldRowData.unshift(EditType.OLD);
  oldRowData.unshift(row);
  oldRowData.unshift(timestamp);

  rowData.unshift(EditType.NEW);
  rowData.unshift(row);
  rowData.unshift(timestamp);

  // Append the row data with the timestamp to the destination sheet
  destinationSheet.appendRow(oldRowData);
  destinationSheet.appendRow(rowData);
  lock.releaseLock();
}
