function updateStarterDictionariesPack(): void {
  const JapaneseFolder = DriveApp.getFolderById(JAPANESE_FOLDER_ID);
  const JapaneseStarterPack = DriveApp.getFolderById(JA_STARTER_PACK);

  const sourceFiles: GoogleAppsScript.Drive.File[] = [];
  const sourceFilesIterator = JapaneseFolder.getFiles();
  while (sourceFilesIterator.hasNext())
    sourceFiles.push(sourceFilesIterator.next());

  const fetchStarterPackFiles = () => {
    const arr: GoogleAppsScript.Drive.File[] = [];
    const it = JapaneseStarterPack.getFiles();
    while (it.hasNext()) arr.push(it.next());
    return arr;
  };

  let starterPackFiles = fetchStarterPackFiles();

  for (const dictionaryRegex of STARTER_DICTIONARIES_ORDER) {
    const matchingSourceFile = sourceFiles.find((file) =>
      file.getName().match(dictionaryRegex)
    );
    if (!matchingSourceFile) continue;

    const sourceFileName = matchingSourceFile.getName();
    const matchingStarterFiles = starterPackFiles.filter((starterFile) => {
      const baseStarterName = starterFile.getName().replace(/^\d{2}\s/, "");
      return baseStarterName.match(dictionaryRegex);
    });

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
      } catch (e: any) {
        shouldReplace = true;
        Logger.log(
          `Error reading file size for ${matchingStarterFiles[0].getName()}: ${
            e.message
          }; replacing.`
        );
      }
    } else {
      shouldReplace = true;
      Logger.log(
        `No existing starter pack file for ${sourceFileName}; adding.`
      );
    }

    if (shouldReplace) {
      removeFilesWithRegexBypassTrash(JA_STARTER_PACK, dictionaryRegex);
      matchingSourceFile.makeCopy(JapaneseStarterPack);
      Logger.log(`Copied ${sourceFileName} to starter pack`);
      starterPackFiles = fetchStarterPackFiles();
    }
  }

  // Re-fetch and rename with two-digit prefixes
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
