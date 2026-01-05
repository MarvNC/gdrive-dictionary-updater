/// <reference path="./UploadApp.ts" />

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
    // Remove old files before uploading new one
    removeFilesWithRegexBypassTrash(
      dictionary.folderId,
      dictionary.removeNameRegex
    );

    // Prepare the final filename
    const fileName = processFileName(
      asset.name,
      dictionary.fileNamePrefix,
      !!dictionary.addDate,
      dictionary.addDate ? asset.created_at : undefined
    );

    // Check file size and use appropriate method
    if (asset.size > SIZE_LIMIT_BYTES) {
      Logger.log(
        `File size (${(asset.size / 1024 / 1024).toFixed(2)} MB) exceeds 50MB limit. Using resumable upload.`
      );

      // Use UploadApp for resumable upload (bypasses 50MB limit)
      const uploadConfig = {
        source: {
          url: asset.browser_download_url,
        },
        destination: {
          uploadUrl:
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
          metadata: {
            name: fileName,
            parents: [dictionary.folderId],
          },
        },
        accessToken: ScriptApp.getOAuthToken(),
      };

      const result = new UploadApp(uploadConfig).run();
      Logger.log(`Downloaded ${result.name} to Google Drive (${result.id}).`);
    } else {
      Logger.log(
        `File size (${(asset.size / 1024 / 1024).toFixed(2)} MB) is under 50MB. Using standard download.`
      );

      // Use standard method for files under 50MB
      const response = UrlFetchApp.fetch(asset.browser_download_url);
      const fileBlob = response.getBlob();

      const folder = DriveApp.getFolderById(dictionary.folderId);
      const createdFile = folder.createFile(fileBlob);
      createdFile.setName(fileName);
      Logger.log(`Downloaded ${createdFile.getName()} to Google Drive.`);
    }
  } catch (error: any) {
    Logger.log(
      `Error downloading file from ${asset.browser_download_url}: ${error.message}`
    );
  }
}
