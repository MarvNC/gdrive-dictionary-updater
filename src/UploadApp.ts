/**
 * ### Description
 * Upload large data with Google APIs using resumable upload.
 * Simplified version that completes within one execution (no multi-execution support).
 * Based on: https://github.com/tanaikech/UploadApp
 *
 * This allows bypassing the standard 50MB limit for Google Apps Script.
 */

interface UploadSource {
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

interface UploadDestination {
  uploadUrl: string;
  metadata: Record<string, any>;
}

interface UploadConfig {
  source: UploadSource;
  destination: UploadDestination;
  accessToken?: string;
}

class UploadApp {
  private downloadUrl: string;
  private authorization: string;
  private chunkSize: number;
  private source: UploadSource;
  private destination: UploadDestination;
  private chunks: [number, number][] = [];
  private location: string = "";

  /**
   * @param config Information of the source data and the metadata of the destination.
   */
  constructor(config: UploadConfig) {
    if (!config.source || !config.source.url) {
      throw new Error("Please set a valid source URL.");
    }

    this.source = config.source;
    this.destination = config.destination;
    this.downloadUrl = config.source.url;
    this.authorization = `Bearer ${
      config.accessToken || ScriptApp.getOAuthToken()
    }`;
    this.chunkSize = 16777216; // 16 MB chunks
  }

  /**
   * ### Description
   * Main method to execute the upload.
   *
   * @returns Response from the upload (file metadata)
   */
  run(): any {
    Logger.log("Getting metadata...");
    this.getMetadata_();

    Logger.log("Calculating chunks...");
    this.getChunks_();

    Logger.log("Getting upload location...");
    this.getLocation_();

    Logger.log("Downloading and uploading data...");
    const result = this.downloadAndUpload_();

    Logger.log("Upload completed successfully.");
    return result;
  }

  /**
   * ### Description
   * Get metadata of the source data.
   *
   * @private
   */
  private getMetadata_(): void {
    // Try to get file size using HEAD request first
    const res = UrlFetchApp.fetch(this.downloadUrl, {
      method: "get",
      muteHttpExceptions: true,
      headers: { Range: "bytes=0-1" },
    });

    if (res.getResponseCode() !== 206) {
      throw new Error(
        "This file cannot be downloaded using resumable download. The server must support Range requests."
      );
    }

    const headers = res.getAllHeaders() as Record<string, string>;
    const range = headers["Content-Range"]?.split("/");

    if (!range || range.length < 2) {
      throw new Error("Could not determine file size from Content-Range header");
    }

    this.source.size = Number(range[1]);

    // Extract filename from Content-Disposition header if available
    if (!this.source.fileName && headers["Content-Disposition"]) {
      const match = headers["Content-Disposition"].match(
        /filename="([^"]+)"/
      );
      if (match) {
        this.source.fileName = match[1].trim();
      }
    }

    // Use default filename if still not set
    if (!this.source.fileName) {
      this.source.fileName = `download_${Date.now()}`;
    }

    // Extract mime type
    if (!this.source.mimeType && headers["Content-Type"]) {
      this.source.mimeType = headers["Content-Type"].split(";")[0];
    }

    Logger.log(
      `File metadata: ${this.source.fileName}, ${this.source.size} bytes, ${this.source.mimeType}`
    );
  }

  /**
   * ### Description
   * Calculate the chunks for uploading.
   *
   * @private
   */
  private getChunks_(): void {
    if (!this.source.size) {
      throw new Error("File size not determined");
    }

    const numChunks = Math.ceil(this.source.size / this.chunkSize);
    this.chunks = Array.from({ length: numChunks }, (_, i): [number, number] => [
      i * this.chunkSize,
      i === numChunks - 1
        ? this.source.size! - 1
        : (i + 1) * this.chunkSize - 1,
    ]);

    Logger.log(`File will be uploaded in ${this.chunks.length} chunks`);
  }

  /**
   * ### Description
   * Get location URL for resumable upload.
   *
   * @private
   */
  private getLocation_(): void {
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "post",
      payload: JSON.stringify(this.destination.metadata),
      contentType: "application/json",
      muteHttpExceptions: true,
      headers: {},
    };

    // Check if API key is in URL or if we need authorization header
    const q = this.parseQueryParameters_(this.destination.uploadUrl);
    if (!q.queryParameters?.key) {
      options.headers = { authorization: this.authorization };
    }

    const res = UrlFetchApp.fetch(this.destination.uploadUrl, options);

    if (res.getResponseCode() !== 200) {
      throw new Error(
        `Failed to get upload location: ${res.getContentText()}`
      );
    }

    const headers = res.getAllHeaders() as Record<string, string>;
    this.location = headers["Location"] || headers["location"];

    if (!this.location) {
      throw new Error("No Location header returned from upload initialization");
    }

    Logger.log(`Upload location obtained: ${this.location.substring(0, 50)}...`);
  }

  /**
   * ### Description
   * Download and upload data in chunks.
   *
   * @private
   * @returns Final upload response
   */
  private downloadAndUpload_(): any {
    const len = this.chunks.length;

    for (let i = 0; i < len; i++) {
      const [start, end] = this.chunks[i];
      const currentBytes = `${start}-${end}`;

      Logger.log(`Processing chunk ${i + 1}/${len}: bytes ${currentBytes}`);

      // Download chunk
      const downloadParams: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "get",
        headers: { Range: `bytes=${currentBytes}` },
        muteHttpExceptions: true,
      };

      const downloadRes = UrlFetchApp.fetch(this.downloadUrl, downloadParams);
      const chunkData = downloadRes.getContent();

      // Upload chunk
      const uploadParams: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "put",
        headers: {
          "Content-Range": `bytes ${currentBytes}/${this.source.size}`,
        },
        payload: chunkData,
        muteHttpExceptions: true,
      };

      const uploadRes = UrlFetchApp.fetch(this.location, uploadParams);
      const statusCode = uploadRes.getResponseCode();

      if (statusCode === 200 || statusCode === 201) {
        Logger.log("Upload completed successfully");
        return JSON.parse(uploadRes.getContentText());
      } else if (statusCode === 308) {
        Logger.log(`Chunk ${i + 1}/${len} uploaded, continuing...`);
      } else {
        throw new Error(
          `Upload failed with status ${statusCode}: ${uploadRes.getContentText()}`
        );
      }
    }

    throw new Error("Upload completed all chunks but did not receive success response");
  }

  /**
   * ### Description
   * Parse query parameters from URL.
   *
   * @param url URL including query parameters
   * @returns Parsed URL and query parameters
   * @private
   */
  private parseQueryParameters_(url: string): {
    url: string;
    queryParameters: Record<string, any> | null;
  } {
    if (!url || typeof url !== "string") {
      throw new Error("Please provide a valid URL string");
    }

    const parts = url.split("?");
    if (parts.length === 1) {
      return { url: parts[0], queryParameters: null };
    }

    const [baseUrl, query] = parts;
    if (!query) {
      return { url: baseUrl, queryParameters: null };
    }

    const queryParameters = query.split("&").reduce(
      (acc, param) => {
        const [key, value] = param.split("=").map((s) => s.trim());
        const parsedValue = isNaN(Number(value)) ? value : Number(value);

        if (acc[key]) {
          if (Array.isArray(acc[key])) {
            acc[key].push(parsedValue);
          } else {
            acc[key] = [acc[key], parsedValue];
          }
        } else {
          acc[key] = parsedValue;
        }

        return acc;
      },
      {} as Record<string, any>
    );

    return { url: baseUrl, queryParameters };
  }
}
