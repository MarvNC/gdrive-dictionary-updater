// Type definitions for editor/TS checking only. Not used at runtime by Apps Script.
export interface AutoUpdatingDictionary {
  /** URL for GitHub API release endpoint or direct download URL */
  downloadUrl: string;
  /** Type of download: 'github-api' for GitHub releases, 'direct' for direct file downloads */
  downloadType: "github-api" | "direct";
  /** Google Drive folder ID where the file should be saved */
  folderId: string;
  /** Regex to match assets in GitHub releases (only used for github-api type) */
  includedNameRegex?: RegExp;
  /** Regex to match files to remove before downloading new version */
  removeNameRegex: RegExp;
  /** Prefix to add to the downloaded file name */
  fileNamePrefix: string;
  /** Whether to add date suffix to filename (for github-api, uses asset creation date; for direct, uses current date) */
  addDate?: boolean;
  /** Expected filename for direct downloads (only used for direct type) */
  expectedFileName?: string;
}

export interface GithubAssetUploader {
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

export interface GithubAsset {
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

export interface GithubRelease {
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
