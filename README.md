# gdrive-updater

This project automates the update of [Yomitan](https://github.com/yomidevs/yomitan) dictionaries in a Google drive folder, fetching them from GitHub.

## Setup Instructions

1. **Set up clasp**:

   - Install clasp globally if you haven't already:
     ```
     <bun/npm/pnpm/etc> install -g @google/clasp
     ```
   - Authenticate with your Google account:
     ```
     clasp login
     ```

2. **Deploy the project**:
   ```
   clasp push
   ```
