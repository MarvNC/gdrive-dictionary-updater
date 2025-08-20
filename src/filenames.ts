function processFileName(
  originalName: string,
  prefix: string,
  addDate: boolean,
  dateString?: string
): string {
  if (!originalName || !prefix)
    throw new Error("originalName and prefix are required");

  let fileName = prefix + originalName;

  if (addDate) {
    try {
      const date = dateString
        ? dateString.split("T")[0]
        : new Date().toISOString().split("T")[0];
      fileName = fileName.replace(/(\.[\w\d_-]+)$/i, ` (${date})$1`);
    } catch (error: any) {
      Logger.log(`Error processing date for filename: ${error.message}`);
    }
  }
  return fileName;
}
