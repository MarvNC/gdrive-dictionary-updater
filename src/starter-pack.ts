function updateStarterDictionariesPack(): void {
  const japaneseSourceFolder = DriveApp.getFolderById(JAPANESE_FOLDER_ID);
  const starterPackFolder = DriveApp.getFolderById(JA_STARTER_PACK);

  const sourceFilesList: GoogleAppsScript.Drive.File[] = [];
  const sourceFilesIterator = japaneseSourceFolder.getFiles();
  while (sourceFilesIterator.hasNext())
    sourceFilesList.push(sourceFilesIterator.next());

  const fetchStarterPackFiles = () => {
    const files: GoogleAppsScript.Drive.File[] = [];
    const starterPackIterator = starterPackFolder.getFiles();
    while (starterPackIterator.hasNext())
      files.push(starterPackIterator.next());
    return files;
  };

  let starterPackFilesList = fetchStarterPackFiles();

  for (const dictionaryRegex of STARTER_DICTIONARIES_ORDER) {
    const matchingSourceFile = sourceFilesList.find((file) =>
      file.getName().match(dictionaryRegex)
    );
    if (!matchingSourceFile) continue;

    const sourceFileName = matchingSourceFile.getName();
    const matchingStarterPackFiles = starterPackFilesList.filter(
      (starterFile) => {
        const baseStarterName = starterFile.getName().replace(/^\d{2}\s/, "");
        return baseStarterName.match(dictionaryRegex);
      }
    );

    let shouldReplaceFile = false;
    if (matchingStarterPackFiles.length > 1) {
      shouldReplaceFile = true;
      Logger.log(
        `Multiple (${matchingStarterPackFiles.length}) starter pack files match ${dictionaryRegex}; replacing with latest ${sourceFileName}`
      );
    } else if (matchingStarterPackFiles.length === 1) {
      try {
        const starterFileSize = matchingStarterPackFiles[0].getSize();
        const sourceFileSize = matchingSourceFile.getSize();
        if (starterFileSize !== sourceFileSize) {
          shouldReplaceFile = true;
          Logger.log(
            `Starter pack file ${matchingStarterPackFiles[0].getName()} differs in size (${starterFileSize} != ${sourceFileSize}); replacing.`
          );
        }
      } catch (e: any) {
        shouldReplaceFile = true;
        Logger.log(
          `Error reading file size for ${matchingStarterPackFiles[0].getName()}: ${
            e.message
          }; replacing.`
        );
      }
    } else {
      shouldReplaceFile = true;
      Logger.log(
        `No existing starter pack file for ${sourceFileName}; adding.`
      );
    }

    if (shouldReplaceFile) {
      removeFilesWithRegexBypassTrash(JA_STARTER_PACK, dictionaryRegex);
      matchingSourceFile.makeCopy(starterPackFolder);
      Logger.log(`Copied ${sourceFileName} to starter pack`);
      starterPackFilesList = fetchStarterPackFiles();
    }
  }

  // Re-fetch and rename with two-digit prefixes
  starterPackFilesList = fetchStarterPackFiles();

  for (let i = 0; i < STARTER_DICTIONARIES_ORDER.length; i++) {
    const dictionaryRegex = STARTER_DICTIONARIES_ORDER[i];
    const indexPrefix = String(i + 1).padStart(2, "0");

    const matchedStarterFile = starterPackFilesList.find((file) => {
      const baseFileName = file.getName().replace(/^\d{2}\s/, "");
      return baseFileName.match(dictionaryRegex);
    });

    if (matchedStarterFile) {
      const currentFileName = matchedStarterFile.getName();
      const baseFileName = currentFileName.replace(/^\d{2}\s/, "");
      const newFileName = `${indexPrefix} ${baseFileName}`;
      if (currentFileName !== newFileName) {
        matchedStarterFile.setName(newFileName);
        Logger.log(`Renamed ${currentFileName} to ${newFileName}`);
      }
    }
  }

  Logger.log("Starter dictionaries pack update completed");
}
