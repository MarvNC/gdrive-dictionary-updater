"use strict";
function getProperty(propertyName) {
    const propertyValue = PropertiesService.getScriptProperties().getProperty(propertyName);
    if (!propertyValue)
        throw new Error(`${propertyName} not set`);
    return propertyValue;
}
const JAPANESE_FOLDER_ID = getProperty("japaneseFolderId");
const MANDARIN_FOLDER_ID = getProperty("mandarinFolderId");
const CANTONESE_FOLDER_ID = getProperty("cantoneseFolderId");
const JA_STARTER_PACK = getProperty("jaStarterPack");
const GITHUB_ACCESS_TOKEN = getProperty("githubAccessToken");
const REPOS_TO_UPDATE = [
    {
        downloadUrl: "https://api.github.com/repos/stephenmk/stephenmk.github.io/releases/latest",
        downloadType: "github-api",
        folderId: JAPANESE_FOLDER_ID,
        includedNameRegex: /yomi/,
        removeNameRegex: /jitendex/,
        fileNamePrefix: "[JA-EN] ",
        addDate: true,
    },
    {
        downloadUrl: "https://api.github.com/repos/yomidevs/jmdict-yomitan/releases/latest",
        downloadType: "github-api",
        folderId: JAPANESE_FOLDER_ID,
        includedNameRegex: /JMnedict/,
        removeNameRegex: /JMnedict/,
        fileNamePrefix: "[JA-JA Names] ",
        addDate: true,
    },
    {
        downloadUrl: "https://api.github.com/repos/yomidevs/jmdict-yomitan/releases/latest",
        downloadType: "github-api",
        folderId: JAPANESE_FOLDER_ID,
        includedNameRegex: /KANJIDIC_english/,
        removeNameRegex: /KANJIDIC_english/,
        fileNamePrefix: "[Kanji] ",
        addDate: true,
    },
    {
        downloadUrl: "https://api.github.com/repos/MarvNC/cc-cedict-yomitan/releases/latest",
        downloadType: "github-api",
        folderId: MANDARIN_FOLDER_ID,
        includedNameRegex: /CC\-CEDICT(?!\.Hanzi)/,
        removeNameRegex: /CC\-CEDICT(?!\.Hanzi)/,
        fileNamePrefix: "[ZH-EN] ",
        addDate: true,
    },
    {
        downloadUrl: "https://api.github.com/repos/MarvNC/cc-cedict-yomitan/releases/latest",
        downloadType: "github-api",
        folderId: MANDARIN_FOLDER_ID,
        includedNameRegex: /CC\-CEDICT\.Hanzi/,
        removeNameRegex: /CC\-CEDICT\.Hanzi/,
        fileNamePrefix: "[Hanzi] ",
        addDate: true,
    },
    {
        downloadUrl: "https://api.github.com/repos/MarvNC/wordshk-yomitan/releases/latest",
        downloadType: "github-api",
        folderId: CANTONESE_FOLDER_ID,
        includedNameRegex: /Words\.hk\.[\d-]+.zip$/,
        removeNameRegex: /Words\.hk\.[\d-]+.zip$/,
        fileNamePrefix: "[YUE-EN & YUE] ",
        addDate: false,
    },
    {
        downloadUrl: "https://api.github.com/repos/MarvNC/wordshk-yomitan/releases/latest",
        downloadType: "github-api",
        folderId: CANTONESE_FOLDER_ID,
        includedNameRegex: /Words\.hk\.Honzi.[\d-]+.zip$/,
        removeNameRegex: /Words\.hk\.Honzi.[\d-]+.zip$/,
        fileNamePrefix: "[Honzi] ",
        addDate: false,
    },
    {
        downloadUrl: "https://api.github.com/repos/MarvNC/pixiv-yomitan/releases/latest",
        downloadType: "github-api",
        folderId: JAPANESE_FOLDER_ID,
        includedNameRegex: /^PixivLight_[\d\-]+\.zip$/,
        removeNameRegex: /PixivLight_[\d\-]+\.zip$/,
        fileNamePrefix: "[JA-JA Encyclopedia] ",
        addDate: false,
    },
    {
        downloadUrl: "https://api.jiten.moe/api/frequency-list/download?downloadType=yomitan",
        downloadType: "direct",
        folderId: JAPANESE_FOLDER_ID,
        removeNameRegex: /jiten_freq_global/,
        fileNamePrefix: "[JA Freq] ",
        addDate: true,
        expectedFileName: "jiten_freq_global.zip",
    },
];
const STARTER_DICTIONARIES_ORDER = [
    /\[JA-EN\] jitendex-yomitan.*/,
    /\[JA-EN\] 新和英.*/,
    /\[JA-JA Names\] JMnedict.*/,
    /\[JA-EN Grammar\] dojg-consolidated-v1_01.*/,
    /\[JA-JA Thesaurus\] 使い方の分かる 類語例解辞典.*/,
    /\[JA-JA\] 漢検漢字辞典　第二版.*/,
    /\[JA-JA\] 小学館例解学習国語 第十二版.*/,
    /\[JA-JA\] 大辞泉 第二版.*/,
    /\[JA-JA\] 実用日本語表現辞典.*/,
    /\[JA-JA Encyclopedia\] PixivLight.*/,
    /\[Kanji\] KANJIDIC_english.*/,
    /\[Kanji\] JPDB Kanji.*/,
    /\[JA Freq\] JPDB_v2.*_Frequency_Kana.*/,
    /\[JA Freq\] jiten_freq_global.*/,
    /\[JA Freq\] Freq_CC100.*/,
    /\[JA Freq\] BCCWJ.*/,
    /\[Pitch\] NHK2016.*/,
];
function removeFilesWithRegexBypassTrash(folderId, regexToRemove) {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    Logger.log(`Removing files matching ${regexToRemove} from folder ${folderId}`);
    while (files.hasNext()) {
        const file = files.next();
        if (file.getName().match(regexToRemove)) {
            const accessToken = ScriptApp.getOAuthToken();
            const url = `https://www.googleapis.com/drive/v3/files/${file.getId()}`;
            const response = UrlFetchApp.fetch(url, {
                method: "delete",
                headers: { Authorization: `Bearer ${accessToken}` },
                muteHttpExceptions: true,
            });
            Logger.log(`Deleted ${file.getName()} from Google Drive. Response code: ${response.getResponseCode()}`);
        }
    }
}
function processFileName(originalName, prefix, addDate, dateString) {
    if (!originalName || !prefix)
        throw new Error("originalName and prefix are required");
    let fileName = prefix + originalName;
    if (addDate) {
        try {
            const date = dateString
                ? dateString.split("T")[0]
                : new Date().toISOString().split("T")[0];
            fileName = fileName.replace(/(\.[\w\d_-]+)$/i, ` (${date})$1`);
        }
        catch (error) {
            Logger.log(`Error processing date for filename: ${error.message}`);
        }
    }
    return fileName;
}
function downloadFromGitHubAPI(dictionary) {
    const headers = { Authorization: "token " + GITHUB_ACCESS_TOKEN };
    let releaseData;
    try {
        const releaseInfo = UrlFetchApp.fetch(dictionary.downloadUrl, {
            headers,
        }).getContentText();
        releaseData = JSON.parse(releaseInfo);
    }
    catch (error) {
        Logger.log(`Error fetching release data for ${dictionary.downloadUrl}: ${error.message}`);
        return;
    }
    const asset = releaseData.assets.find((a) => a.name.match(dictionary.includedNameRegex) && a.name.endsWith(".zip"));
    if (!(asset === null || asset === void 0 ? void 0 : asset.browser_download_url)) {
        Logger.log(`No asset containing ${dictionary.includedNameRegex} found in the latest release.`);
        return;
    }
    try {
        const response = UrlFetchApp.fetch(asset.browser_download_url);
        const fileBlob = response.getBlob();
        removeFilesWithRegexBypassTrash(dictionary.folderId, dictionary.removeNameRegex);
        const folder = DriveApp.getFolderById(dictionary.folderId);
        const createdFile = folder.createFile(fileBlob);
        const fileName = processFileName(createdFile.getName(), dictionary.fileNamePrefix, !!dictionary.addDate, dictionary.addDate ? asset.created_at : undefined);
        createdFile.setName(fileName);
        Logger.log(`Downloaded ${createdFile.getName()} to Google Drive.`);
    }
    catch (error) {
        Logger.log(`Error downloading file from ${asset.browser_download_url}: ${error.message}`);
    }
}
function downloadFromDirectUrl(dictionary) {
    try {
        const response = UrlFetchApp.fetch(dictionary.downloadUrl);
        if (response.getResponseCode() !== 200) {
            throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
        }
        const fileBlob = response.getBlob();
        removeFilesWithRegexBypassTrash(dictionary.folderId, dictionary.removeNameRegex);
        const folder = DriveApp.getFolderById(dictionary.folderId);
        const createdFile = folder.createFile(fileBlob);
        const fileName = processFileName(dictionary.expectedFileName, dictionary.fileNamePrefix, !!dictionary.addDate, dictionary.addDate ? new Date().toISOString() : undefined);
        createdFile.setName(fileName);
        Logger.log(`Downloaded ${createdFile.getName()} to Google Drive.`);
    }
    catch (error) {
        Logger.log(`Error downloading file from ${dictionary.downloadUrl}: ${error.message}`);
    }
}
function updateStarterDictionariesPack() {
    const JapaneseFolder = DriveApp.getFolderById(JAPANESE_FOLDER_ID);
    const JapaneseStarterPack = DriveApp.getFolderById(JA_STARTER_PACK);
    const sourceFiles = [];
    const sourceFilesIterator = JapaneseFolder.getFiles();
    while (sourceFilesIterator.hasNext())
        sourceFiles.push(sourceFilesIterator.next());
    const fetchStarterPackFiles = () => {
        const arr = [];
        const it = JapaneseStarterPack.getFiles();
        while (it.hasNext())
            arr.push(it.next());
        return arr;
    };
    let starterPackFiles = fetchStarterPackFiles();
    for (const dictionaryRegex of STARTER_DICTIONARIES_ORDER) {
        const matchingSourceFile = sourceFiles.find((file) => file.getName().match(dictionaryRegex));
        if (!matchingSourceFile)
            continue;
        const sourceFileName = matchingSourceFile.getName();
        const matchingStarterFiles = starterPackFiles.filter((starterFile) => {
            const baseStarterName = starterFile.getName().replace(/^\d{2}\s/, "");
            return baseStarterName.match(dictionaryRegex);
        });
        let shouldReplace = false;
        if (matchingStarterFiles.length > 1) {
            shouldReplace = true;
            Logger.log(`Multiple (${matchingStarterFiles.length}) starter pack files match ${dictionaryRegex}; replacing with latest ${sourceFileName}`);
        }
        else if (matchingStarterFiles.length === 1) {
            try {
                const starterSize = matchingStarterFiles[0].getSize();
                const sourceSize = matchingSourceFile.getSize();
                if (starterSize !== sourceSize) {
                    shouldReplace = true;
                    Logger.log(`Starter pack file ${matchingStarterFiles[0].getName()} differs in size (${starterSize} != ${sourceSize}); replacing.`);
                }
            }
            catch (e) {
                shouldReplace = true;
                Logger.log(`Error reading file size for ${matchingStarterFiles[0].getName()}: ${e.message}; replacing.`);
            }
        }
        else {
            shouldReplace = true;
            Logger.log(`No existing starter pack file for ${sourceFileName}; adding.`);
        }
        if (shouldReplace) {
            removeFilesWithRegexBypassTrash(JA_STARTER_PACK, dictionaryRegex);
            matchingSourceFile.makeCopy(JapaneseStarterPack);
            Logger.log(`Copied ${sourceFileName} to starter pack`);
            starterPackFiles = fetchStarterPackFiles();
        }
    }
    starterPackFiles = fetchStarterPackFiles();
    for (let i = 0; i < STARTER_DICTIONARIES_ORDER.length; i++) {
        const dictionaryRegex = STARTER_DICTIONARIES_ORDER[i];
        const prefix = String(i + 1).padStart(2, "0");
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
function downloadDictionaryLatestVersion(dictionary) {
    if (!dictionary.downloadUrl ||
        !dictionary.folderId ||
        !dictionary.removeNameRegex ||
        !dictionary.fileNamePrefix) {
        throw new Error("Missing required dictionary configuration");
    }
    if (dictionary.downloadType === "github-api") {
        downloadFromGitHubAPI(dictionary);
    }
    else {
        downloadFromDirectUrl(dictionary);
    }
}
function downloadAllRepos() {
    Logger.log(`Starting download of ${REPOS_TO_UPDATE.length} dictionaries`);
    let successCount = 0;
    let errorCount = 0;
    for (const repo of REPOS_TO_UPDATE) {
        try {
            Logger.log(`Processing: ${repo.fileNamePrefix.trim()} (${repo.downloadType})`);
            downloadDictionaryLatestVersion(repo);
            successCount++;
        }
        catch (error) {
            errorCount++;
            Logger.log(`Error downloading from ${repo.downloadUrl}: ${error.message}`);
        }
    }
    Logger.log(`Download completed: ${successCount} successful, ${errorCount} failed`);
    updateStarterDictionariesPack();
}
