function downloadFromDirectUrl(dictionary: DirectDictionary): void {
  try {
    const response = UrlFetchApp.fetch(dictionary.downloadUrl);
    if (response.getResponseCode() !== 200) {
      throw new Error(
        `HTTP ${response.getResponseCode()}: ${response.getContentText()}`
      );
    }

    const fileBlob = response.getBlob();
    removeFilesWithRegexBypassTrash(
      dictionary.folderId,
      dictionary.removeNameRegex
    );

    const folder = DriveApp.getFolderById(dictionary.folderId);
    const createdFile = folder.createFile(fileBlob);

    const fileName = processFileName(
      dictionary.expectedFileName,
      dictionary.fileNamePrefix,
      !!dictionary.addDate,
      dictionary.addDate ? new Date().toISOString() : undefined
    );
    createdFile.setName(fileName);
    Logger.log(`Downloaded ${createdFile.getName()} to Google Drive.`);
  } catch (error: any) {
    Logger.log(
      `Error downloading file from ${dictionary.downloadUrl}: ${error.message}`
    );
  }
}
