// Type definitions for editor/TS checking only. Not used at runtime by Apps Script.

interface GithubApiDictionary {
  downloadType: "github-api";
  downloadUrl: string;
  folderId: string;
  includedNameRegex: RegExp;
  removeNameRegex: RegExp;
  fileNamePrefix: string;
  addDate?: boolean;
}

interface DirectDictionary {
  downloadType: "direct";
  downloadUrl: string;
  folderId: string;
  removeNameRegex: RegExp;
  fileNamePrefix: string;
  addDate?: boolean;
  expectedFileName: string;
}

type AutoUpdatingDictionary = GithubApiDictionary | DirectDictionary;

interface GithubAssetUploader {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

interface GithubAsset {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: string | null;
  uploader: GithubAssetUploader;
  content_type: string;
  state: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

interface GithubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: any;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GithubAsset[];
  tarball_url: string;
  zipball_url: string;
  body: string;
}
