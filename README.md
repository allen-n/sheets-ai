# Google Sheets Add-on

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
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. **Install Dependencies**:
   Ensure you have Node.js and npm installed, then run:

   ```bash
   npm install
   ```

3. **Set Up Clasp**:
   Install `clasp` globally if you haven't already:

   ```bash
   npm install -g @google/clasp
   ```

4. **Authenticate Clasp**:
   Run the following command and follow the instructions to authenticate:

   ```bash
   clasp login
   ```

## Development

1. **Compile TypeScript**:
   Compile the TypeScript files to JavaScript:

   ```bash
   npm run build
   ```

2. **Push to Google Apps Script**:
   Use `clasp` to push your code to Google Apps Script:

   ```bash
   npm run push
   ```

3. **Open the Script Editor**:
   Open the Google Apps Script editor to view your project:

   ```bash
   clasp open
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
