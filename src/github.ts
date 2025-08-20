function downloadFromGitHubAPI(dictionary: GithubApiDictionary): void {
  const headers = { Authorization: "token " + GITHUB_ACCESS_TOKEN };
  let releaseData: GithubRelease;

  try {
    const releaseInfo = UrlFetchApp.fetch(dictionary.downloadUrl, {
      headers,
    }).getContentText();
    releaseData = JSON.parse(releaseInfo);
  } catch (error: any) {
    Logger.log(
      `Error fetching release data for ${dictionary.downloadUrl}: ${error.message}`
    );
    return;
  }

  const asset = releaseData.assets.find(
    (a) => a.name.match(dictionary.includedNameRegex) && a.name.endsWith(".zip")
  );

  if (!asset?.browser_download_url) {
    Logger.log(
      `No asset containing ${dictionary.includedNameRegex} found in the latest release.`
    );
    return;
  }

  try {
    const response = UrlFetchApp.fetch(asset.browser_download_url);
    const fileBlob = response.getBlob();

    removeFilesWithRegexBypassTrash(
      dictionary.folderId,
      dictionary.removeNameRegex
    );

    const folder = DriveApp.getFolderById(dictionary.folderId);
    const createdFile = folder.createFile(fileBlob);
    const fileName = processFileName(
      createdFile.getName(),
      dictionary.fileNamePrefix,
      !!dictionary.addDate,
      dictionary.addDate ? asset.created_at : undefined
    );
    createdFile.setName(fileName);
    Logger.log(`Downloaded ${createdFile.getName()} to Google Drive.`);
  } catch (error: any) {
    Logger.log(
      `Error downloading file from ${asset.browser_download_url}: ${error.message}`
    );
  }
}
