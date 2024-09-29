const LAST_EDIT_TIME_KEY = 'lastEditTime';

namespace utils {
  export const SRC_SHEET_1 = 'In Process - Speciality';
  export const SRC_SHEET_2 = 'In Process - GLP1';
  export const SOURCE_SHEET_NAMES = [utils.SRC_SHEET_1, utils.SRC_SHEET_2];
  export const SOURCE_SHEET_NAMES_SET = new Set(utils.SOURCE_SHEET_NAMES);
  export const AUDIT_LOG_PREFIX = '_audit_log';

  export function deleteAllProperties() {
    const propertyService = PropertiesService.getDocumentProperties();
    propertyService.deleteAllProperties();
  }

  export function getRowEditKey(e: GoogleAppsScript.Events.SheetsOnEdit) {
    return `${LAST_EDIT_TIME_KEY}_${e.range
      .getSheet()
      .getName()}_${e.range.getRow()}`;
  }

  export function isSourceSheetEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
    return utils.SOURCE_SHEET_NAMES_SET.has(e.source.getSheetName());
  }

  export function getOrCreateFolder(
    folderName: string
  ): GoogleAppsScript.Drive.Folder {
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(folderName);
    }
  }

  export function getLatestSpreadsheet(
    folder: GoogleAppsScript.Drive.Folder,
    prefix: string
  ): GoogleAppsScript.Drive.File | null {
    const files = folder.getFiles();
    let latestFile: GoogleAppsScript.Drive.File | null = null;
    let latestTimestamp = 0;

    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      if (!name.startsWith(prefix)) {
        continue;
      }
      const timestamp = parseInt(name.split('_').pop() || '0', 10);

      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
        latestFile = file;
      }
    }

    return latestFile;
  }

  export function getOrCreateSpreadsheet(
    folder: GoogleAppsScript.Drive.Folder,
    prefix: string
  ): GoogleAppsScript.Spreadsheet.Spreadsheet {
    const latestFile = getLatestSpreadsheet(folder, prefix);
    if (latestFile) {
      const spreadsheet = SpreadsheetApp.open(latestFile);
      const sheet = spreadsheet.getActiveSheet();
      if (sheet.getLastRow() < 100000) {
        return spreadsheet;
      }
    }

    const timestamp = new Date().getTime();
    const newSpreadsheet = SpreadsheetApp.create(`${prefix}_${timestamp}`);
    const newFile = DriveApp.getFileById(newSpreadsheet.getId());
    folder.addFile(newFile);
    DriveApp.getRootFolder().removeFile(newFile); // Remove from root folder

    return newSpreadsheet;
  }

  export function getEditedRowData(
    e: GoogleAppsScript.Events.SheetsOnEdit,
    replaceOriginalValue: boolean = false
  ) {
    const sheet = e.source.getActiveSheet(); // Get the active sheet
    const range = e.range; // Get the range that was edited
    const row = range.getRow(); // Get the row number of the edited cell
    const rowData = sheet
      .getRange(row, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    if (replaceOriginalValue) {
      rowData[range.getColumn() - 1] = e.oldValue;
    }
    return rowData;
  }
}

export { utils };
