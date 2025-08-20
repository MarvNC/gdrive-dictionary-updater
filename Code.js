// @ts-check

const getProperty = (propertyName) => {
  const propertyValue =
    PropertiesService.getScriptProperties().getProperty(propertyName);
  if (!propertyValue) {
    throw new Error(`${propertyName} not set`);
  }
  return propertyValue;
};

const JAPANESE_FOLDER_ID = getProperty("japaneseFolderId");
const MANDARIN_FOLDER_ID = getProperty("mandarinFolderId");
const CANTONESE_FOLDER_ID = getProperty("cantoneseFolderId");
const JA_STARTER_PACK = getProperty("jaStarterPack");
const GITHUB_ACCESS_TOKEN = getProperty("githubAccessToken");

function downloadAllRepos() {
  for (const repo of REPOS_TO_UPDATE) {
    try {
      downloadDictionaryLatestVersion(repo);
    } catch (error) {
      Logger.log(
        `Error downloading repo ${repo.githubApiUrl}: ${error.message}`
      );
    }
  }
  updateStarterDictionariesPack();
}

/** @type {import('./types').AutoUpdatingDictionary[]} */
const REPOS_TO_UPDATE = [
  {
    githubApiUrl:
      "https://api.github.com/repos/stephenmk/stephenmk.github.io/releases/latest",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /yomi/,
    removeNameRegex: /jitendex/,
    fileNamePrefix: "[JA-EN] ",
    addDate: true,
  },
  {
    githubApiUrl:
      "https://api.github.com/repos/yomidevs/jmdict-yomitan/releases/latest",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /JMnedict/,
    removeNameRegex: /JMnedict/,
    fileNamePrefix: "[JA-JA Names] ",
    addDate: true,
  },
  {
    githubApiUrl:
      "https://api.github.com/repos/yomidevs/jmdict-yomitan/releases/latest",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /KANJIDIC_english/,
    removeNameRegex: /KANJIDIC_english/,
    fileNamePrefix: "[Kanji] ",
    addDate: true,
  },
  {
    githubApiUrl:
      "https://api.github.com/repos/MarvNC/cc-cedict-yomitan/releases/latest",
    folderId: MANDARIN_FOLDER_ID,
    includedNameRegex: /CC\-CEDICT(?!\.Hanzi)/,
    removeNameRegex: /CC\-CEDICT(?!\.Hanzi)/,
    fileNamePrefix: "[ZH-EN] ",
    addDate: true,
  },
  {
    githubApiUrl:
      "https://api.github.com/repos/MarvNC/cc-cedict-yomitan/releases/latest",
    folderId: MANDARIN_FOLDER_ID,
    includedNameRegex: /CC\-CEDICT\.Hanzi/,
    removeNameRegex: /CC\-CEDICT\.Hanzi/,
    fileNamePrefix: "[Hanzi] ",
    addDate: true,
  },
  {
    githubApiUrl:
      "https://api.github.com/repos/MarvNC/wordshk-yomitan/releases/latest",
    folderId: CANTONESE_FOLDER_ID,
    includedNameRegex: /Words\.hk\.[\d-]+.zip$/,
    removeNameRegex: /Words\.hk\.[\d-]+.zip$/,
    fileNamePrefix: "[YUE-EN & YUE] ",
    addDate: false,
  },
  {
    githubApiUrl:
      "https://api.github.com/repos/MarvNC/wordshk-yomitan/releases/latest",
    folderId: CANTONESE_FOLDER_ID,
    includedNameRegex: /Words\.hk\.Honzi.[\d-]+.zip$/,
    removeNameRegex: /Words\.hk\.Honzi.[\d-]+.zip$/,
    fileNamePrefix: "[Honzi] ",
    addDate: false,
  },
  {
    githubApiUrl:
      "https://api.github.com/repos/MarvNC/pixiv-yomitan/releases/latest",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /^PixivLight_[\d\-]+\.zip$/,
    removeNameRegex: /PixivLight_[\d\-]+\.zip$/,
    fileNamePrefix: "[JA-JA Encyclopedia] ",
    addDate: false,
  },
];

/**
 * @type {RegExp[]}
 */
const STARTER_DICTIONARIES_ORDER = [
  // EN
  /\[JA-EN\] jitendex-yomitan.*/,
  /\[JA-EN\] 新和英.*/,
  // Names
  /\[JA-JA Names\] JMnedict.*/,
  // Grammar
  /\[JA-EN Grammar\] dojg-consolidated-v1_01.*/,
  // Differentiation
  /\[JA-JA Thesaurus\] 使い方の分かる 類語例解辞典.*/,
  /\[JA-JA\] 漢検漢字辞典　第二版.*/,
  // Mono
  /\[JA-JA\] 小学館例解学習国語 第十二版.*/,
  /\[JA-JA\] 大辞泉 第二版.*/,
  /\[JA-JA\] 実用日本語表現辞典.*/,
  /\[JA-JA Encyclopedia\] PixivLight.*/,
  // Kanji
  /\[Kanji\] KANJIDIC_english.*/,
  /\[Kanji\] JPDB Kanji.*/,
  // Freq
  /\[JA Freq\] JPDB_v2.*_Frequency_Kana.*/,
  /\[JA Freq\] Freq_CC100.*/,
  /\[JA Freq\] BCCWJ.*/,
  // Pitch
  /\[Pitch\] NHK2016.*/,
];

/**
 * Update the JA starter pack from the Japanese folder.
 * For each regex in `STARTER_DICTIONARIES_ORDER`:
 * - find the source file
 * - if >1 matches in starter pack or size differs, delete matches and copy
 * - if no match, copy the source file
 * Re-fetch files after changes and then add two-digit prefixes in `STARTER_DICTIONARIES_ORDER`.
 */
function updateStarterDictionariesPack() {
  const JapaneseFolder = DriveApp.getFolderById(JAPANESE_FOLDER_ID);
  const JapaneseStarterPack = DriveApp.getFolderById(JA_STARTER_PACK);

  // Get all files in both folders as arrays for easier manipulation
  const sourceFiles = [];
  const sourceFilesIterator = JapaneseFolder.getFiles();
  while (sourceFilesIterator.hasNext()) {
    sourceFiles.push(sourceFilesIterator.next());
  }

  // helper to fetch current starter pack files from Drive
  const fetchStarterPackFiles = () => {
    const arr = [];
    const it = JapaneseStarterPack.getFiles();
    while (it.hasNext()) arr.push(it.next());
    return arr;
  };

  // Escape a string for use in RegExp
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let starterPackFiles = fetchStarterPackFiles();

  // Copy dictionaries from STARTER_DICTIONARIES_ORDER that aren't already in starter pack
  for (const dictionaryRegex of STARTER_DICTIONARIES_ORDER) {
    // Find matching file in Japanese folder
    const matchingSourceFile = sourceFiles.find((file) =>
      file.getName().match(dictionaryRegex)
    );

    if (!matchingSourceFile) continue;

    const sourceFileName = matchingSourceFile.getName();

    // Find all starter files whose base name matches the dictionary regex
    const matchingStarterFiles = starterPackFiles.filter((starterFile) => {
      const baseStarterName = starterFile.getName().replace(/^\d{2}\s/, "");
      return baseStarterName.match(dictionaryRegex);
    });

    // If more than one matching starter file exists, or exactly one but size differs,
    // delete by dictionaryRegex and copy the source file over.
    let shouldReplace = false;

    if (matchingStarterFiles.length > 1) {
      shouldReplace = true;
      Logger.log(
        `Multiple (${matchingStarterFiles.length}) starter pack files match ${dictionaryRegex}; replacing with latest ${sourceFileName}`
      );
    } else if (matchingStarterFiles.length === 1) {
      try {
        const starterSize = matchingStarterFiles[0].getSize();
        const sourceSize = matchingSourceFile.getSize();
        if (starterSize !== sourceSize) {
          shouldReplace = true;
          Logger.log(
            `Starter pack file ${matchingStarterFiles[0].getName()} differs in size (${starterSize} != ${sourceSize}); replacing.`
          );
        }
      } catch (e) {
        // If we can't read size, replace to be safe
        shouldReplace = true;
        Logger.log(
          `Error reading file size for ${matchingStarterFiles[0].getName()}: ${
            e.message
          }; replacing.`
        );
      }
    } else {
      // no match -> copy
      shouldReplace = true;
      Logger.log(
        `No existing starter pack file for ${sourceFileName}; adding.`
      );
    }

    if (shouldReplace) {
      // remove existing matches by dictionary regex (permanent delete)
      removeFilesWithRegexBypassTrash(JA_STARTER_PACK, dictionaryRegex);
      // copy the latest
      matchingSourceFile.makeCopy(JapaneseStarterPack);
      Logger.log(`Copied ${sourceFileName} to starter pack`);
      // re-fetch starter pack files
      starterPackFiles = fetchStarterPackFiles();
    }
  }

  // Rename all files with two-digit prefixes based on STARTER_DICTIONARIES_ORDER
  starterPackFiles = fetchStarterPackFiles();

  for (let i = 0; i < STARTER_DICTIONARIES_ORDER.length; i++) {
    const dictionaryRegex = STARTER_DICTIONARIES_ORDER[i];
    const prefix = String(i + 1).padStart(2, "0");

    // Find matching file in starter pack
    const matchingFile = starterPackFiles.find((file) => {
      const baseFileName = file.getName().replace(/^\d{2}\s/, "");
      return baseFileName.match(dictionaryRegex);
    });

    if (matchingFile) {
      const currentName = matchingFile.getName();
      const baseFileName = currentName.replace(/^\d{2}\s/, "");
      const newName = `${prefix} ${baseFileName}`;

      if (currentName !== newName) {
        matchingFile.setName(newName);
        Logger.log(`Renamed ${currentName} to ${newName}`);
      }
    }
  }

  Logger.log("Starter dictionaries pack update completed");
}

/**
 * @param {import('./types').AutoUpdatingDictionary} githubRepo
 */
function downloadDictionaryLatestVersion(githubRepo) {
  const headers = {
    Authorization: "token " + GITHUB_ACCESS_TOKEN,
  };

  const options = {
    headers: headers,
  };

  /** @type {import('./types').GithubRelease} */
  let releaseData;
  try {
    const releaseInfo = UrlFetchApp.fetch(
      githubRepo.githubApiUrl,
      options
    ).getContentText();
    releaseData = JSON.parse(releaseInfo);
  } catch (error) {
    Logger.log(
      `Error fetching release data for ${githubRepo.githubApiUrl}: ${error.message}`
    );
    return;
  }

  const assets = releaseData.assets;

  // Find the asset containing the includedNameRegex in its name and download it
  const asset = assets.find(
    /** @type {import('./types').GithubAsset} */ (asset) =>
      asset.name.match(githubRepo.includedNameRegex) &&
      asset.name.endsWith(".zip")
  );

  // If asset is found, download it and save it to Google Drive
  if (asset?.browser_download_url && asset.browser_download_url !== "") {
    const response = UrlFetchApp.fetch(asset.browser_download_url);
    const fileBlob = response.getBlob();

    // Remove existing files for this dictionary
    removeFilesWithRegexBypassTrash(
      githubRepo.folderId,
      githubRepo.removeNameRegex
    );

    const folder = DriveApp.getFolderById(githubRepo.folderId);
    const createdFile = folder.createFile(fileBlob);
    // Prepend file with to follow naming convention
    let fileName = createdFile.getName();
    // add prefix
    fileName = githubRepo.fileNamePrefix + fileName;

    // Add date to file name if specified
    if (githubRepo.addDate) {
      const date = asset.created_at.split("T")[0];
      // Suffix before file extension
      fileName = fileName.replace(/(\.[\w\d_-]+)$/i, ` (${date})$1`);
    }

    createdFile.setName(fileName);

    Logger.log(`Downloaded ${createdFile.getName()} to Google Drive.`);
  } else {
    Logger.log(
      `No asset containing ${githubRepo.includedNameRegex} found in the latest release.`
    );
  }
}

/**
 * Remove existing files from a folder that match a regex
 * Uses the Google Drive API to delete files, so files will bypass the trash folder
 * @param {string} folderId
 * @param {RegExp} regexToRemove
 */
function removeFilesWithRegexBypassTrash(folderId, regexToRemove) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  Logger.log(
    `Removing files matching ${regexToRemove} from folder ${folderId}`
  );

  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().match(regexToRemove)) {
      // Get the access token
      const accessToken = ScriptApp.getOAuthToken();

      // Define the URL
      const url = `https://www.googleapis.com/drive/v3/files/${file.getId()}`;

      // Make the request
      const response = UrlFetchApp.fetch(url, {
        method: "delete",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        muteHttpExceptions: true,
      });

      // Log the response for debugging
      Logger.log(
        `Deleted ${file.getName()} from Google Drive. Response code: ${response.getResponseCode()}`
      );
    }
  }
}
