# SheetsAI

[![CC BY-NC 4.0][cc-by-nc-shield]][cc-by-nc]

This project is a Google Sheets add-on developed using Google Apps Script and TypeScript. It provides access to LLMs providers conveniently inside of google sheets. Currently, it supports the following providers:

- OpenAI

## Table of Contents

- [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [Usage](#usage)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/allen-n/sheets-ai
   cd sheets-ai
   ```

2. **Install Dependencies**:
   Ensure you have Node.js and npm installed, then run:

   ```bash
   npm i pnpm -g
   pnpm install
   ```

3. **Authenticate Clasp**:
   Run the following command and follow the instructions to authenticate:

   ```bash
   pnpm clasp login
   ```

## Development

1. **Create your .clasp.json**:
   Create a `.clasp.json` at the top level of the directory that mirrors [example.clasp.json](./example.clasp.json).
2. **Replace the script ID with the ID of your Google Apps Script project**

   - Navigate to `https://docs.google.com/spreadsheets/` and open the sheet you want to develop the add-on in.
   - Click on `Extensions` -> `Apps Script`
   - Navigate to `Project Settings` (the gear icon.)
   - Copy the Script id listed on the settings page.

3. **Push to Google Apps Script**:
   Use `clasp` to push your code to Google Apps Script:

   ```bash
   pnpm clasp:push # single push
   pnpm clasp:watch # watch for changes and push
   ```

## Deployment

1. **Create a New Version**:
   Create a new version of your script:

   ```bash
   clasp version "Your version description"
   ```

2. **Deploy as an Add-on**:
   Follow the [Google Workspace Marketplace documentation](https://developers.google.com/workspace/marketplace) to deploy your add-on.

## Usage

- [TBD: Instructions on how to use the add-on once installed in Google Sheets.]

## Testing

- [TBD: Instructions on how to run tests, if applicable.]

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b yourUsername/YourFeature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin yourUsername/YourFeature`).
5. Open a pull request.

## License

This work is licensed under a
[Creative Commons Attribution-NonCommercial 4.0 International License][cc-by-nc].

[![CC BY-NC 4.0][cc-by-nc-image]][cc-by-nc]

[cc-by-nc]: https://creativecommons.org/licenses/by-nc/4.0/
[cc-by-nc-image]: https://licensebuttons.net/l/by-nc/4.0/88x31.png
[cc-by-nc-shield]: https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg
