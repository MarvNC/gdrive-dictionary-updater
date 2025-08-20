function removeFilesWithRegexBypassTrash(
  folderId: string,
  regexToRemove: RegExp
): void {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  Logger.log(
    `Removing files matching ${regexToRemove} from folder ${folderId}`
  );

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
      Logger.log(
        `Deleted ${file.getName()} from Google Drive. Response code: ${response.getResponseCode()}`
      );
    }
  }
}
