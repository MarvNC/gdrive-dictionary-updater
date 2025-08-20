function getProperty(propertyName: string): string {
  const propertyValue =
    PropertiesService.getScriptProperties().getProperty(propertyName);
  if (!propertyValue) throw new Error(`${propertyName} not set`);
  return propertyValue;
}

const JAPANESE_FOLDER_ID = getProperty("japaneseFolderId");
const MANDARIN_FOLDER_ID = getProperty("mandarinFolderId");
const CANTONESE_FOLDER_ID = getProperty("cantoneseFolderId");
const JA_STARTER_PACK = getProperty("jaStarterPack");
const GITHUB_ACCESS_TOKEN = getProperty("githubAccessToken");
