/// <reference path="./globals.ts" />
/// <reference path="./config.ts" />

function downloadDictionaryLatestVersion(
  dictionary: AutoUpdatingDictionary
): void {
  if (
    !dictionary.downloadUrl ||
    !dictionary.folderId ||
    !dictionary.removeNameRegex ||
    !dictionary.fileNamePrefix
  ) {
    throw new Error("Missing required dictionary configuration");
  }
  if ((dictionary as any).downloadType === "github-api") {
    downloadFromGitHubAPI(dictionary as GithubApiDictionary);
  } else {
    downloadFromDirectUrl(dictionary as DirectDictionary);
  }
}

function downloadAllRepos(): void {
  Logger.log(`Starting download of ${REPOS_TO_UPDATE.length} dictionaries`);
  let successCount = 0;
  let errorCount = 0;

  for (const repo of REPOS_TO_UPDATE) {
    try {
      Logger.log(
        `Processing: ${repo.fileNamePrefix.trim()} (${
          (repo as any).downloadType
        })`
      );
      downloadDictionaryLatestVersion(repo);
      successCount++;
    } catch (error: any) {
      errorCount++;
      Logger.log(
        `Error downloading from ${repo.downloadUrl}: ${error.message}`
      );
    }
  }

  Logger.log(
    `Download completed: ${successCount} successful, ${errorCount} failed`
  );
  updateStarterDictionariesPack();
}
