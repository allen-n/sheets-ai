/**
 * UIManager class for handling all UI-related functionality
 */
export class UIManager {
  /**
   * Creates an HTML template from a file and evaluates it
   * @param filePath - Path to the HTML file
   * @param options - Additional options
   * @returns HtmlOutput
   */
  static createHtmlFromTemplate(
    filePath: string,
    options: {
      title?: string;
      width?: number;
      height?: number;
      sandbox?: boolean;
    } = {}
  ): GoogleAppsScript.HTML.HtmlOutput {
    const { title, width, height, sandbox } = options;
    let html = HtmlService.createTemplateFromFile(filePath).evaluate();

    if (title) {
      html.setTitle(title);
    }

    if (width) {
      html.setWidth(width);
    }

    if (height) {
      html.setHeight(height);
    }

    if (sandbox) {
      html.setSandboxMode(HtmlService.SandboxMode.IFRAME);
    }

    return html;
  }

  /**
   * Shows a sidebar with the given HTML content
   * @param htmlOutput - The HTML output to display
   */
  static showSidebar(htmlOutput: GoogleAppsScript.HTML.HtmlOutput): void {
    SpreadsheetApp.getUi().showSidebar(htmlOutput);
  }

  /**
   * Shows a modal dialog with the given HTML content
   * @param htmlOutput - The HTML output to display
   * @param title - The title of the modal
   */
  static showModalDialog(
    htmlOutput: GoogleAppsScript.HTML.HtmlOutput,
    title: string
  ): void {
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
  }

  /**
   * Shows a sidebar with help information
   */
  static showHelpSidebar(): void {
    const htmlOutput = this.createHtmlFromTemplate('ui/html/SideHelpBar.html', {
      title: 'SheetsAI Help',
      width: 300,
    });
    this.showSidebar(htmlOutput);
  }

  /**
   * Shows a modal dialog for setting LLM API keys
   */
  static showSetLLMApiKeysModal(): void {
    const htmlOutput = this.createHtmlFromTemplate(
      'ui/html/SetLLMProvider.html',
      {
        width: 600,
        height: 470,
      }
    );
    this.showModalDialog(htmlOutput, 'Set your LLM API Key(s)');
  }

  /**
   * Shows the test template in a modal dialog
   */
  static showTestTemplate(): void {
    const htmlOutput = this.createHtmlFromTemplate('ui/html/test.html', {
      width: 600,
      height: 500,
    });
    this.showModalDialog(htmlOutput, 'Template Test');
  }

  /**
   * Shows an alert message
   * @param title - The title of the alert
   * @param message - The message to display
   * @param buttons - The buttons to show (defaults to OK)
   * @returns The button that was clicked
   */
  static showAlert(
    title: string,
    message: string,
    buttons: GoogleAppsScript.Base.ButtonSet = SpreadsheetApp.getUi().ButtonSet
      .OK
  ): GoogleAppsScript.Base.Button {
    return SpreadsheetApp.getUi().alert(title, message, buttons);
  }
}
