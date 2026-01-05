/// <reference path="./UploadApp.ts" />

function downloadFromDirectUrl(dictionary: DirectDictionary): void {
  try {
    // Check file size first using partial GET with Range header
    let fileSize = 0;
    try {
      const rangeResponse = UrlFetchApp.fetch(dictionary.downloadUrl, {
        headers: { Range: "bytes=0-1" },
        muteHttpExceptions: true,
      });

      if (rangeResponse.getResponseCode() === 206) {
        const headers = rangeResponse.getAllHeaders() as Record<string, string>;
        const range = headers["Content-Range"]?.split("/");
        if (range && range.length === 2) {
          fileSize = Number(range[1]);
        }
      } else {
        // If Range request not supported, try to get Content-Length from full request
        const headers = rangeResponse.getAllHeaders() as Record<string, string>;
        if (headers["Content-Length"]) {
          fileSize = Number(headers["Content-Length"]);
        }
      }
    } catch (error) {
      Logger.log(
        "Could not determine file size, defaulting to standard download"
      );
      fileSize = 0;
    }

    // Remove old files before uploading new one
    removeFilesWithRegexBypassTrash(
      dictionary.folderId,
      dictionary.removeNameRegex
    );

    // Prepare the final filename
    const fileName = processFileName(
      dictionary.expectedFileName,
      dictionary.fileNamePrefix,
      !!dictionary.addDate,
      dictionary.addDate ? new Date().toISOString() : undefined
    );

    // Check file size and use appropriate method
    if (fileSize > SIZE_LIMIT_BYTES) {
      Logger.log(
        `File size (${(fileSize / 1024 / 1024).toFixed(2)} MB) exceeds 50MB limit. Using resumable upload.`
      );

      // Use UploadApp for resumable upload (bypasses 50MB limit)
      const uploadConfig = {
        source: {
          url: dictionary.downloadUrl,
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
        `File size (${fileSize > 0 ? (fileSize / 1024 / 1024).toFixed(2) : "unknown"} MB) is under 50MB. Using standard download.`
      );

      // Use standard method for files under 50MB
      const response = UrlFetchApp.fetch(dictionary.downloadUrl);
      if (response.getResponseCode() !== 200) {
        throw new Error(
          `HTTP ${response.getResponseCode()}: ${response.getContentText()}`
        );
      }

      const fileBlob = response.getBlob();
      const folder = DriveApp.getFolderById(dictionary.folderId);
      const createdFile = folder.createFile(fileBlob);
      createdFile.setName(fileName);
      Logger.log(`Downloaded ${createdFile.getName()} to Google Drive.`);
    }
  } catch (error: any) {
    Logger.log(
      `Error downloading file from ${dictionary.downloadUrl}: ${error.message}`
    );
  }
}
