const REPOS_TO_UPDATE: AutoUpdatingDictionary[] = [
  {
    downloadUrl:
      "https://api.github.com/repos/stephenmk/stephenmk.github.io/releases/latest",
    downloadType: "github-api",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /yomi/,
    removeNameRegex: /jitendex/,
    fileNamePrefix: "[JA-EN] ",
    addDate: true,
  },
  {
    downloadUrl:
      "https://api.github.com/repos/yomidevs/jmdict-yomitan/releases/latest",
    downloadType: "github-api",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /JMnedict/,
    removeNameRegex: /JMnedict/,
    fileNamePrefix: "[JA-JA Names] ",
    addDate: true,
  },
  {
    downloadUrl:
      "https://api.github.com/repos/yomidevs/jmdict-yomitan/releases/latest",
    downloadType: "github-api",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /KANJIDIC_english/,
    removeNameRegex: /KANJIDIC_english/,
    fileNamePrefix: "[Kanji] ",
    addDate: true,
  },
  {
    downloadUrl:
      "https://api.github.com/repos/MarvNC/cc-cedict-yomitan/releases/latest",
    downloadType: "github-api",
    folderId: MANDARIN_FOLDER_ID,
    includedNameRegex: /CC\-CEDICT(?!\.Hanzi)/,
    removeNameRegex: /CC\-CEDICT(?!\.Hanzi)/,
    fileNamePrefix: "[ZH-EN] ",
    addDate: true,
  },
  {
    downloadUrl:
      "https://api.github.com/repos/MarvNC/cc-cedict-yomitan/releases/latest",
    downloadType: "github-api",
    folderId: MANDARIN_FOLDER_ID,
    includedNameRegex: /CC\-CEDICT\.Hanzi/,
    removeNameRegex: /CC\-CEDICT\.Hanzi/,
    fileNamePrefix: "[Hanzi] ",
    addDate: true,
  },
  {
    downloadUrl:
      "https://api.github.com/repos/MarvNC/wordshk-yomitan/releases/latest",
    downloadType: "github-api",
    folderId: CANTONESE_FOLDER_ID,
    includedNameRegex: /Words\.hk\.[\d-]+.zip$/,
    removeNameRegex: /Words\.hk\.[\d-]+.zip$/,
    fileNamePrefix: "[YUE-EN & YUE] ",
    addDate: false,
  },
  {
    downloadUrl:
      "https://api.github.com/repos/MarvNC/wordshk-yomitan/releases/latest",
    downloadType: "github-api",
    folderId: CANTONESE_FOLDER_ID,
    includedNameRegex: /Words\.hk\.Honzi.[\d-]+.zip$/,
    removeNameRegex: /Words\.hk\.Honzi.[\d-]+.zip$/,
    fileNamePrefix: "[Honzi] ",
    addDate: false,
  },
  {
    downloadUrl:
      "https://api.github.com/repos/MarvNC/pixiv-yomitan/releases/latest",
    downloadType: "github-api",
    folderId: JAPANESE_FOLDER_ID,
    includedNameRegex: /^PixivLight_[\d\-]+\.zip$/,
    removeNameRegex: /PixivLight_[\d\-]+\.zip$/,
    fileNamePrefix: "[JA-JA Encyclopedia] ",
    addDate: false,
  },
  {
    downloadUrl:
      "https://api.jiten.moe/api/frequency-list/download?downloadType=yomitan",
    downloadType: "direct",
    folderId: JAPANESE_FOLDER_ID,
    removeNameRegex: /jiten_freq_global/,
    fileNamePrefix: "[JA Freq] ",
    addDate: true,
    expectedFileName: "jiten_freq_global.zip",
  },
];

const STARTER_DICTIONARIES_ORDER: RegExp[] = [
  // EN
  /\[JA-EN\] jitendex-yomitan.*/,
  /\[JA-EN\] 新和英.*/,
  // Names
  /\[JA-JA Names\] JMnedict.*/,
  // Grammar
  /\[JA-EN Grammar\] dojg-consolidated-v1_01.*/,
  // Differences
  /\[JA-JA Thesaurus\] 使い方の分かる 類語例解辞典.*/,
  /\[JA-JA\] 漢検漢字辞典　第二版.*/,
  // Mono
  /\[JA-JA\] 小学館例解学習国語 第十二版.*/,
  /\[JA-JA\] 大辞泉 第二版.*/,
  /\[JA-JA\] 実用日本語表現辞典.*/,
  /\[JA-JA Encyclopedia\] PixivLight.*/,
  // Kanji
  /\[Kanji\] KANJIDIC_english.*/,
  /\[Kanji\] JPDB Kanji.*/,
  // Freq
  /\[JA Freq\] JPDB_v2.*_Frequency_Kana.*/,
  /\[JA Freq\] jiten_freq_global.*/,
  /\[JA Freq\] Freq_CC100.*/,
  /\[JA Freq\] BCCWJ.*/,
  // Pitch
  /\[Pitch\] NHK2016.*/,
];
