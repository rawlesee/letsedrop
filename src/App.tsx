import React, { useEffect, useState } from 'react';

const DEFAULT_API_BASE_URL = 'https://linkdrop-backend.vercel.app';

const API_BASE_URL =
  (import.meta as unknown as {
    env?: { VITE_API_BASE_URL?: string };
  }).env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export interface MediaFormat {
  id: string;
  label: string;
  extension: 'mp4' | 'mp3' | 'webm' | 'jpg';
  quality: string;
  type: 'video' | 'audio';
}

export interface MediaItem {
  index: number;
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  ext?: string;
  width?: number;
  height?: number;
}

export interface MediaMetadata {
  url: string;
  platform: string;
  type: 'video' | 'image';
  title: string;
  thumbnail: string;
  uploader?: string;
  duration?: number;
  formats?: MediaFormat[];
  items?: MediaItem[];
  isVideoPost?: boolean;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  filename: string;
  timestamp: number;
}

const Icons = {
  Logo: () => (
    <svg
      className="w-5 h-5 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),

  Paste: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),

  ArrowRight: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),

  Download: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),

  Check: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),

  Trash: () => (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),

  Sparkles: () => (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),

  Play: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 5.5v13a1 1 0 0 0 1.53.848l10-6.5a1 1 0 0 0 0-1.696l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  ),

  Music: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  ),
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, ms)
  );

const sanitizeFilename = (value: string) => {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);

  return cleaned || 'Media';
};

const buildLetsedropFilename = (
  title: string,
  index: number,
  type: 'image' | 'video'
) => {
  const extension =
    type === 'video'
      ? 'mp4'
      : 'jpg';

  const safeTitle =
    sanitizeFilename(title)
      .replace(/\s+/g, '_')
      .slice(0, 65);

  return `Letsedrop_Instagram_${safeTitle}_${index + 1}.${extension}`;
};

const getFilenameFromDisposition = (
  disposition: string | null,
  fallback: string
) => {
  if (!disposition) {
    return fallback;
  }

  const utfMatch = disposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(
        utfMatch[1]
      );
    } catch {
      return utfMatch[1];
    }
  }

  const normalMatch = disposition.match(
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i
  );

  if (normalMatch?.[1]) {
    return normalMatch[1]
      .replace(/['"]/g, '')
      .trim();
  }

  return fallback;
};

export default function App() {
  const [urlInput, setUrlInput] =
    useState('');

  const [analyzedUrl, setAnalyzedUrl] =
    useState('');

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [
    downloadingFormat,
    setDownloadingFormat,
  ] =
    useState<'mp4' | 'mp3' | null>(null);

  const [mediaData, setMediaData] =
    useState<MediaMetadata | null>(null);

  const [selectedItems, setSelectedItems] =
    useState<number[]>([]);

  const [
    downloadingItemIndex,
    setDownloadingItemIndex,
  ] =
    useState<number | null>(null);

  const [
    isBatchDownloading,
    setIsBatchDownloading,
  ] =
    useState(false);

  const [
    batchProgressText,
    setBatchProgressText,
  ] =
    useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(null);

  const [
    successInfo,
    setSuccessInfo,
  ] =
    useState<{
      filename: string;
      platform: string;
    } | null>(null);

  const [toastText, setToastText] =
    useState<string | null>(null);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [activeTab, setActiveTab] =
    useState<
      'downloader' | 'history'
    >('downloader');

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          'letsedrop_history'
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // Ignore corrupted history.
    }
  }, []);

  const showToast = (
    message: string
  ) => {
    setToastText(message);

    window.setTimeout(() => {
      setToastText(null);
    }, 3500);
  };

  const saveToHistory = (
    item: Omit<
      HistoryItem,
      'id' | 'timestamp'
    >
  ) => {
    setHistory(
      (currentHistory) => {
        const newItem: HistoryItem = {
          ...item,
          id: Math.random()
            .toString(36)
            .substring(2, 10),
          timestamp: Date.now(),
        };

        const updated = [
          newItem,
          ...currentHistory
            .filter(
              (historyItem) =>
                historyItem.url !==
                item.url
            )
            .slice(0, 14),
        ];

        try {
          localStorage.setItem(
            'letsedrop_history',
            JSON.stringify(updated)
          );
        } catch {
          // Ignore.
        }

        return updated;
      }
    );
  };

  const clearHistory = () => {
    setHistory([]);

    try {
      localStorage.removeItem(
        'letsedrop_history'
      );

      showToast(
        'Semua riwayat berhasil dihapus.'
      );
    } catch {
      showToast(
        'Riwayat dibersihkan di tampilan.'
      );
    }
  };

  const deleteHistoryItem = (
    id: string
  ) => {
    setHistory(
      (currentHistory) => {
        const updated =
          currentHistory.filter(
            (item) =>
              item.id !== id
          );

        try {
          localStorage.setItem(
            'letsedrop_history',
            JSON.stringify(
              updated
            )
          );
        } catch {
          // Ignore.
        }

        return updated;
      }
    );

    showToast(
      'Item riwayat dihapus.'
    );
  };

  const handlePasteClipboard =
    async () => {
      try {
        if (
          navigator.clipboard &&
          navigator.clipboard.readText
        ) {
          const text =
            await navigator.clipboard.readText();

          if (
            text &&
            text
              .trim()
              .startsWith('http')
          ) {
            setUrlInput(
              text.trim()
            );

            setErrorMessage(null);

            showToast(
              'Tautan berhasil ditempel dari clipboard.'
            );
          } else {
            showToast(
              'Clipboard tidak berisi tautan web yang valid.'
            );
          }
        } else {
          showToast(
            'Akses clipboard tidak tersedia di browser ini.'
          );
        }
      } catch {
        showToast(
          'Gagal membaca clipboard. Tempelkan tautan manual.'
        );
      }
    };

  const triggerBrowserDownload = (
    blob: Blob,
    filename: string,
    contentType: string
  ) => {
    const fileBlob =
      new Blob([blob], {
        type: contentType,
      });

    const blobUrl =
      window.URL.createObjectURL(
        fileBlob
      );

    const link =
      document.createElement('a');

    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(
      link
    );

    link.click();

    window.setTimeout(() => {
      if (
        document.body.contains(
          link
        )
      ) {
        document.body.removeChild(
          link
        );
      }

      window.URL.revokeObjectURL(
        blobUrl
      );
    }, 5000);
  };

  const getDirectDownloadUrl = (
    url: string,
    format: 'mp4' | 'mp3'
  ) => {
    return (
      `${API_BASE_URL}/api/download` +
      `?url=${encodeURIComponent(
        url
      )}` +
      `&format=${encodeURIComponent(
        format
      )}`
    );
  };

  const normalizeFrontendItems = (
    result: any
  ): MediaItem[] => {
    const rawItems =
      Array.isArray(result?.items)
        ? result.items
        : [];

    return rawItems
      .map(
        (
          item: any,
          index: number
        ): MediaItem | null => {
          if (
            !item ||
            typeof item.url !==
              'string' ||
            !item.url
          ) {
            return null;
          }

          const rawType =
            String(
              item.type ||
                ''
            ).toLowerCase();

          const rawExt =
            String(
              item.ext ||
                ''
            ).toLowerCase();

          const lowerUrl =
            item.url.toLowerCase();

          /*
           * Prioritas tipe:
           *
           * 1. type dari backend
           * 2. extension
           * 3. URL media
           *
           * Jangan menjadikan seluruh carousel
           * video hanya karena result.type = video.
           */

          let type:
            | 'image'
            | 'video' =
            'image';

          if (
            rawType === 'video' ||
            rawExt === 'mp4' ||
            rawExt === 'webm' ||
            lowerUrl.includes(
              '.mp4'
            ) ||
            lowerUrl.includes(
              '/v/t'
            ) ||
            lowerUrl.includes(
              'video_dash'
            )
          ) {
            type = 'video';
          }

          const thumbnail =
            typeof item.thumbnail ===
              'string' &&
            item.thumbnail
              ? item.thumbnail
              : type === 'image'
              ? item.url
              : result?.thumbnail ||
                item.url;

          return {
            index:
              typeof item.index ===
              'number'
                ? item.index
                : index,

            type,

            url: item.url,

            thumbnail,

            ext:
              type === 'video'
                ? 'mp4'
                : 'jpg',

            width:
              typeof item.width ===
              'number'
                ? item.width
                : undefined,

            height:
              typeof item.height ===
              'number'
                ? item.height
                : undefined,
          };
        }
      )
      .filter(
        (
          item
        ): item is MediaItem =>
          item !== null
      );
  };

  const handleAnalyze = async (
    event?: React.FormEvent
  ) => {
    event?.preventDefault();

    const cleanInput =
      urlInput.trim();

    if (!cleanInput) {
      setErrorMessage(
        'Tempelkan tautan media publik terlebih dahulu.'
      );

      return;
    }

    setErrorMessage(null);
    setSuccessInfo(null);
    setMediaData(null);
    setSelectedItems([]);
    setAnalyzedUrl('');
    setIsAnalyzing(true);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/analyze`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
              Accept:
                'application/json',
            },

            body: JSON.stringify({
              url: cleanInput,
            }),
          }
        );

      let result: any;

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          'Server mengembalikan respons yang tidak valid.'
        );
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Media tidak tersedia atau platform belum didukung.'
        );
      }

      const items =
        normalizeFrontendItems(
          result
        );

      /*
       * =================================================
       * DETEKSI MEDIA
       * =================================================
       *
       * Ini sengaja dibuat ketat.
       *
       * Kalau backend bilang "video" tapi item
       * satu-satunya ternyata image, kita percaya
       * item tersebut sebagai IMAGE.
       *
       * Kalau ada:
       *
       * [image, image, video, image, video]
       *
       * maka dianggap carousel campuran.
       */

      const videoItems =
        items.filter(
          (item) =>
            item.type ===
            'video'
        );

      const imageItems =
        items.filter(
          (item) =>
            item.type ===
            'image'
        );

      const isSingleVideo =
        items.length === 1 &&
        items[0]?.type ===
          'video';

      const isSingleImage =
        items.length === 1 &&
        items[0]?.type ===
          'image';

      const isMixedCarousel =
        items.length > 1 &&
        videoItems.length > 0 &&
        imageItems.length > 0;

      const isImageCarousel =
        items.length > 1 &&
        videoItems.length ===
          0;

      setAnalyzedUrl(
        cleanInput
      );

      /*
       * SINGLE VIDEO
       */

      if (isSingleVideo) {
        const videoItem =
          items[0];

        const videoThumbnail =
          result.thumbnail ||
          videoItem.thumbnail ||
          videoItem.url ||
          '';

        const formats: MediaFormat[] =
          [
            {
              id: 'mp4',
              label: 'Video MP4',
              extension:
                'mp4',
              quality: 'HD',
              type: 'video',
            },
            {
              id: 'mp3',
              label: 'Audio MP3',
              extension:
                'mp3',
              quality:
                'High Audio',
              type: 'audio',
            },
          ];

        setMediaData({
          ...result,

          type: 'video',

          title:
            result.title ||
            'Video',

          thumbnail:
            videoThumbnail,

          formats,

          items,

          isVideoPost: true,
        });

        return;
      }

      /*
       * =================================================
       * SINGLE IMAGE / CAROUSEL / MIXED CAROUSEL
       * =================================================
       */

      if (
        isSingleImage ||
        isImageCarousel ||
        isMixedCarousel
      ) {
        let displayTitle =
          result.title ||
          (
            isSingleImage
              ? 'Foto'
              : isMixedCarousel
              ? 'Instagram Carousel'
              : 'Instagram Carousel'
          );

        if (
          !displayTitle.trim()
        ) {
          displayTitle =
            'Instagram Media';
        }

        setMediaData({
          ...result,

          type: 'image',

          title:
            displayTitle,

          thumbnail:
            result.thumbnail ||
            items[0]?.thumbnail ||
            items[0]?.url ||
            '',

          items,

          isVideoPost: false,
        });

        setSelectedItems(
          items.map(
            (item) =>
              item.index
          )
        );

        return;
      }

      /*
       * Kalau backend tidak mengirim items sama sekali,
       * tetapi memberi thumbnail, anggap sebagai foto.
       *
       * Ini untuk menjaga compatibility dengan extractor
       * lama.
       */

      if (
        items.length === 0 &&
        result.thumbnail
      ) {
        const fallbackItem: MediaItem =
          {
            index: 0,
            type: 'image',
            url:
              result.thumbnail,
            thumbnail:
              result.thumbnail,
            ext: 'jpg',
          };

        setMediaData({
          ...result,

          type: 'image',

          title:
            result.title ||
            'Foto',

          thumbnail:
            result.thumbnail,

          items: [
            fallbackItem,
          ],

          isVideoPost: false,
        });

        setSelectedItems([
          0,
        ]);

        return;
      }

      throw new Error(
        'Jenis media tidak berhasil dikenali.'
      );
    } catch (
      error: unknown
    ) {
      const err =
        error instanceof Error
          ? error
          : new Error(
              'Terjadi masalah saat memproses tautan media.'
            );

      let message =
        err.message ||
        'Terjadi masalah saat memproses tautan media.';

      const lower =
        message.toLowerCase();

      if (
        lower.includes(
          'private'
        ) ||
        lower.includes(
          'login'
        ) ||
        lower.includes(
          'challenge'
        )
      ) {
        message =
          'Media ini bersifat privat atau membutuhkan login dan tidak dapat diproses.';
      } else if (
        lower.includes(
          'failed to fetch'
        ) ||
        lower.includes(
          'networkerror'
        ) ||
        lower.includes(
          'network error'
        )
      ) {
        message =
          'Gagal menghubungi server Letsedrop. Periksa koneksi internet lalu coba lagi.';
      }

      setErrorMessage(
        message
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  /*
   * =======================================================
   * SINGLE VIDEO DOWNLOAD
   * =======================================================
   */

  const handleDownloadVideo = (
    format: 'mp4' | 'mp3'
  ) => {
    const urlToSend =
      analyzedUrl.trim();

    if (
      !urlToSend ||
      !mediaData
    ) {
      return;
    }

    setErrorMessage(null);
    setSuccessInfo(null);
    setIsDownloading(true);
    setDownloadingFormat(
      format
    );

    const extension =
      format === 'mp3'
        ? 'mp3'
        : 'mp4';

    const baseName =
      sanitizeFilename(
        mediaData.title ||
          'Instagram_Media'
      );

    const filename =
      `Letsedrop_Instagram_${baseName}.${extension}`;

    saveToHistory({
      url: urlToSend,

      title:
        mediaData.title ||
        filename,

      thumbnail:
        mediaData.thumbnail ||
        '',

      platform:
        mediaData.platform ||
        'INSTAGRAM',

      filename,
    });

    setSuccessInfo({
      filename,

      platform: (
        mediaData.platform ||
        'INSTAGRAM'
      ).toUpperCase(),
    });

    const downloadUrl =
      getDirectDownloadUrl(
        urlToSend,
        format
      );

    const link =
      document.createElement('a');

    link.href =
      downloadUrl;

    link.target =
      '_blank';

    link.rel =
      'noopener noreferrer';

    link.style.display =
      'none';

    document.body.appendChild(
      link
    );

    link.click();

    window.setTimeout(() => {
      if (
        document.body.contains(
          link
        )
      ) {
        document.body.removeChild(
          link
        );
      }
    }, 1000);

    showToast(
      format === 'mp3'
        ? 'Download MP3 dimulai.'
        : 'Download MP4 dimulai.'
    );

    window.setTimeout(() => {
      setIsDownloading(
        false
      );

      setDownloadingFormat(
        null
      );
    }, 1500);
  };

  /*
   * =======================================================
   * DOWNLOAD CAROUSEL ITEM
   * =======================================================
   *
   * Dipakai untuk:
   *
   * - foto
   * - video
   * - carousel campuran
   *
   * Backend /api/download-carousel akan menentukan
   * media berdasarkan itemIndex.
   */

  const downloadCarouselItem =
    async (
      item: MediaItem,
      customUrl?: string
    ): Promise<void> => {
      const urlToSend =
        customUrl ||
        analyzedUrl.trim();

      if (!urlToSend) {
        throw new Error(
          'URL Instagram tidak tersedia.'
        );
      }

      setDownloadingItemIndex(
        item.index
      );

      setErrorMessage(null);

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/download-carousel`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  '*/*',
              },

              body: JSON.stringify({
                url:
                  urlToSend,

                type:
                  item.type,

                itemIndex:
                  item.index,

                imageUrl:
                  item.url,
              }),
            }
          );

        if (
          !response.ok
        ) {
          let message =
            item.type ===
            'video'
              ? 'Video tidak dapat diunduh saat ini.'
              : 'Foto tidak dapat diunduh saat ini.';

          try {
            const data =
              await response.json();

            if (
              data?.message
            ) {
              message =
                data.message;
            }
          } catch {
            // Ignore.
          }

          throw new Error(
            message
          );
        }

        const fallbackFilename =
          buildLetsedropFilename(
            mediaData?.title ||
              'Instagram_Media',
            item.index,
            item.type
          );

        const disposition =
          response.headers.get(
            'Content-Disposition'
          );

        const filename =
          getFilenameFromDisposition(
            disposition,
            fallbackFilename
          );

        const blob =
          await response.blob();

        const contentType =
          response.headers.get(
            'Content-Type'
          ) ||
          (
            item.type ===
            'video'
              ? 'video/mp4'
              : 'image/jpeg'
          );

        triggerBrowserDownload(
          blob,
          filename,
          contentType
        );

        saveToHistory({
          url:
            urlToSend,

          title:
            `${
              mediaData?.title ||
              'Instagram Media'
            } (#${
              item.index + 1
            })`,

          thumbnail:
            item.thumbnail ||
            item.url,

          platform:
            mediaData?.platform ||
            'INSTAGRAM',

          filename,
        });

        showToast(
          item.type ===
            'video'
            ? `Video #${
                item.index + 1
              } berhasil diunduh.`
            : `Foto #${
                item.index + 1
              } berhasil diunduh.`
        );
      } finally {
        setDownloadingItemIndex(
          null
        );
      }
    };

  /*
   * =======================================================
   * SINGLE CAROUSEL ITEM BUTTON
   * =======================================================
   */

  const downloadSingleItem =
    async (
      item: MediaItem
    ) => {
      try {
        await downloadCarouselItem(
          item
        );
      } catch (
        error: unknown
      ) {
        const err =
          error instanceof Error
            ? error
            : new Error(
                'Gagal mengunduh media.'
              );

        setErrorMessage(
          err.message
        );
      }
    };

  /*
   * =======================================================
   * DOWNLOAD ALL
   * =======================================================
   */

  const handleDownloadAllImages =
    async () => {
      if (
        !mediaData?.items ||
        mediaData.items.length ===
          0
      ) {
        return;
      }

      setIsBatchDownloading(
        true
      );

      setErrorMessage(null);

      const items =
        mediaData.items;

      try {
        for (
          let i = 0;
          i < items.length;
          i++
        ) {
          const currentItem =
            items[i];

          setBatchProgressText(
            `Mengunduh ${
              i + 1
            } dari ${
              items.length
            }...`
          );

          await downloadCarouselItem(
            currentItem,
            analyzedUrl
          );

          if (
            i <
            items.length - 1
          ) {
            await sleep(
              350
            );
          }
        }

        setSuccessInfo({
          filename:
            `${items.length} Media Berhasil Diunduh`,

          platform:
            'INSTAGRAM CAROUSEL',
        });

        showToast(
          'Semua media berhasil diunduh.'
        );
      } catch (
        error: unknown
      ) {
        const err =
          error instanceof Error
            ? error
            : new Error(
                'Terjadi kendala saat mengunduh beberapa media.'
              );

        setErrorMessage(
          err.message
        );
      } finally {
        setIsBatchDownloading(
          false
        );

        setBatchProgressText(
          ''
        );
      }
    };

  /*
   * =======================================================
   * DOWNLOAD SELECTED
   * =======================================================
   */

  const handleDownloadSelectedImages =
    async () => {
      if (
        !mediaData?.items ||
        selectedItems.length ===
          0
      ) {
        return;
      }

      setIsBatchDownloading(
        true
      );

      setErrorMessage(null);

      const itemsToDownload =
        mediaData.items.filter(
          (item) =>
            selectedItems.includes(
              item.index
            )
        );

      try {
        for (
          let i = 0;
          i <
          itemsToDownload.length;
          i++
        ) {
          const currentItem =
            itemsToDownload[
              i
            ];

          setBatchProgressText(
            `Mengunduh ${
              i + 1
            } dari ${
              itemsToDownload.length
            }...`
          );

          await downloadCarouselItem(
            currentItem,
            analyzedUrl
          );

          if (
            i <
            itemsToDownload.length -
              1
          ) {
            await sleep(
              350
            );
          }
        }

        setSuccessInfo({
          filename:
            `${itemsToDownload.length} Media Terpilih Berhasil Diunduh`,

          platform:
            'INSTAGRAM CAROUSEL',
        });

        showToast(
          'Semua media terpilih berhasil diunduh.'
        );
      } catch (
        error: unknown
      ) {
        const err =
          error instanceof Error
            ? error
            : new Error(
                'Terjadi kendala saat mengunduh media terpilih.'
              );

        setErrorMessage(
          err.message
        );
      } finally {
        setIsBatchDownloading(
          false
        );

        setBatchProgressText(
          ''
        );
      }
    };

  const toggleItemSelection =
    (index: number) => {
      setSelectedItems(
        (previous) =>
          previous.includes(
            index
          )
            ? previous.filter(
                (
                  itemIndex
                ) =>
                  itemIndex !==
                  index
              )
            : [
                ...previous,
                index,
              ]
      );
    };

  const toggleSelectAll =
    () => {
      if (
        !mediaData?.items
      ) {
        return;
      }

      if (
        selectedItems.length ===
        mediaData.items.length
      ) {
        setSelectedItems(
          []
        );
      } else {
        setSelectedItems(
          mediaData.items.map(
            (item) =>
              item.index
          )
        );
      }
    };

  const formatDuration = (
    seconds?: number
  ) => {
    if (
      !seconds ||
      seconds <= 0
    ) {
      return '';
    }

    const totalSeconds =
      Math.floor(
        seconds
      );

    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const remainingSeconds =
      totalSeconds % 60;

    return `${minutes}:${
      remainingSeconds < 10
        ? '0'
        : ''
    }${remainingSeconds}`;
  };

  const formatHistoryTime = (
    timestamp: number
  ) => {
    try {
      return new Intl.DateTimeFormat(
        'id-ID',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      ).format(
        new Date(timestamp)
      );
    } catch {
      return '';
    }
  };

  const resetDownloader =
    () => {
      setUrlInput('');
      setAnalyzedUrl('');
      setMediaData(null);
      setSelectedItems([]);
      setSuccessInfo(null);
      setErrorMessage(null);
      setIsDownloading(false);
      setDownloadingFormat(
        null
      );
      setIsBatchDownloading(
        false
      );
      setBatchProgressText(
        ''
      );
    };

  const platforms = [
    {
      name: 'TikTok',
      icon: '🎵',
      badge: 'Video & Audio',
    },
    {
      name: 'YouTube',
      icon: '▶️',
      badge: 'MP4 & MP3',
    },
    {
      name: 'Instagram',
      icon: '📸',
      badge: 'Reels & Carousel',
    },
    {
      name: 'Facebook',
      icon: '📘',
      badge: 'Video Publik',
    },
    {
      name: 'X / Twitter',
      icon: '𝕏',
      badge: 'Klip Video',
    },
    {
      name: 'Reddit',
      icon: '🤖',
      badge: 'Video Bersuara',
    },
  ];

  const carouselItems =
    mediaData?.items || [];

  const carouselVideoCount =
    carouselItems.filter(
      (item) =>
        item.type ===
        'video'
    ).length;

  const carouselImageCount =
    carouselItems.filter(
      (item) =>
        item.type ===
        'image'
    ).length;

  const isMixedCarousel =
    carouselItems.length >
      1 &&
    carouselVideoCount >
      0 &&
    carouselImageCount >
      0;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">

      {/* TOAST */}
      {toastText && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-50 bg-neutral-900/95 border border-neutral-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm backdrop-blur-xl max-w-[calc(100vw-2rem)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />

          <span className="truncate">
            {toastText}
          </span>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-neutral-900/80 bg-neutral-950/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">

          <button
            type="button"
            className="flex items-center gap-2.5 group"
            onClick={() => {
              setActiveTab(
                'downloader'
              );
              setErrorMessage(
                null
              );
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Icons.Logo />
            </div>

            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent lowercase">
              letsedrop
            </span>
          </button>

          <div className="flex items-center gap-1.5 text-xs">

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'downloader'
                )
              }
              className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                activeTab ===
                'downloader'
                  ? 'bg-neutral-900 text-indigo-400 border border-neutral-800'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              Downloader
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'history'
                )
              }
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeTab ===
                'history'
                  ? 'bg-neutral-900 text-indigo-400 border border-neutral-800'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              <span>
                Riwayat
              </span>

              {history.length >
                0 && (
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-800/50 font-bold">
                  {history.length}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* DOWNLOADER */}
        {activeTab ===
          'downloader' && (
          <div className="space-y-10">

            {/* HERO */}
            <div className="text-center space-y-3 pt-4">

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-semibold text-neutral-300 mb-2">
                <span className="text-indigo-400">
                  <Icons.Sparkles />
                </span>

                <span>
                  Fast public media
                  downloader
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                Download. Drop.{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Done.
                </span>
              </h1>

              <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Tempel tautan publik
                video, Reels, foto,
                atau carousel.
                Pilih format dan
                biarkan Letsedrop
                mengurus sisanya.
              </p>

            </div>

            {/* INPUT */}
            <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">

              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

              <form
                onSubmit={
                  handleAnalyze
                }
                className="space-y-4"
              >

                <div className="relative">

                  <input
                    type="url"
                    value={
                      urlInput
                    }
                    onChange={(
                      event
                    ) =>
                      setUrlInput(
                        event.target
                          .value
                      )
                    }
                    placeholder="Tempel tautan video, foto, atau carousel..."
                    disabled={
                      isAnalyzing ||
                      isDownloading ||
                      isBatchDownloading
                    }
                    required
                    className="w-full bg-neutral-950 border border-neutral-800/90 rounded-2xl px-4 py-4 pr-28 text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition disabled:opacity-50 min-h-[56px]"
                  />

                  <div className="absolute right-2.5 top-2.5">

                    <button
                      type="button"
                      onClick={
                        handlePasteClipboard
                      }
                      disabled={
                        isAnalyzing ||
                        isDownloading ||
                        isBatchDownloading
                      }
                      className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition border border-neutral-700 min-h-[42px] flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Icons.Paste />
                      <span>
                        Tempel
                      </span>
                    </button>

                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">

                  <span className="text-neutral-500 text-center sm:text-left">
                    Mendukung TikTok,
                    Instagram,
                    YouTube, X,
                    Facebook &
                    Reddit
                  </span>

                  <button
                    type="submit"
                    disabled={
                      isAnalyzing ||
                      isDownloading ||
                      isBatchDownloading ||
                      !urlInput.trim()
                    }
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />

                        <span>
                          Menganalisis...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          Analyze
                        </span>

                        <Icons.ArrowRight />
                      </>
                    )}
                  </button>

                </div>
              </form>

              {errorMessage && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs sm:text-sm flex items-start gap-3">

                  <span className="text-rose-400 text-base">
                    ⚠️
                  </span>

                  <div className="flex-1 leading-relaxed">

                    <p className="font-bold text-rose-300">
                      Gagal Memproses
                    </p>

                    <p className="mt-0.5">
                      {
                        errorMessage
                      }
                    </p>

                  </div>
                </div>
              )}

            </div>

            {/* VIDEO RESULT */}
            {mediaData?.type ===
              'video' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">

                <div className="px-5 sm:px-7 pt-5 sm:pt-7">

                  <div className="flex items-center justify-between gap-3 mb-5">

                    <div className="flex items-center gap-2">

                      <span className="px-2.5 py-1 bg-indigo-600/90 rounded-lg text-[10px] font-black uppercase tracking-wider text-white">
                        {mediaData.platform ||
                          'VIDEO'}
                      </span>

                      <span className="px-2.5 py-1 bg-neutral-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neutral-300 border border-neutral-700">
                        VIDEO
                      </span>

                    </div>

                    {mediaData.duration ? (
                      <span className="text-xs font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                        {formatDuration(
                          mediaData.duration
                        )}
                      </span>
                    ) : null}

                  </div>
                </div>

                {/* PREVIEW */}
                <div className="px-5 sm:px-7">

                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">

                    {mediaData.thumbnail ? (
                      <img
                        src={
                          mediaData.thumbnail
                        }
                        alt={
                          mediaData.title ||
                          'Video preview'
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <div className="text-center">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-900 flex items-center justify-center mb-2">
                            <Icons.Play />
                          </div>

                          <span className="text-xs">
                            Video preview
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                    <div className="absolute left-4 bottom-4 right-4 flex items-end justify-between gap-3">

                      <div className="min-w-0">

                        <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-1">
                          Preview
                        </p>

                        <p className="text-sm font-bold text-white truncate">
                          {mediaData.title ||
                            'Video'}
                        </p>

                      </div>

                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white flex-shrink-0">
                        <Icons.Play />
                      </div>

                    </div>
                  </div>
                </div>

                {/* INFO */}
                <div className="px-5 sm:px-7 pt-5">

                  <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                    {mediaData.title ||
                      'Video'}
                  </h2>

                  <p className="text-xs text-neutral-400 mt-1">
                    Pengunggah:{' '}
                    <span className="text-neutral-200 font-medium">
                      {mediaData.uploader ||
                        'Publik'}
                    </span>
                  </p>

                </div>

                {/* DOWNLOAD OPTIONS */}
                <div className="p-5 sm:p-7">

                  <div className="mb-4">

                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      Download
                    </p>

                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Pilih format
                      yang ingin
                      disimpan.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {/* MP4 */}
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadVideo(
                          'mp4'
                        )
                      }
                      disabled={
                        isDownloading
                      }
                      className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-950/80 to-neutral-950 border border-indigo-800/60 hover:border-indigo-500 transition text-left disabled:opacity-60 disabled:cursor-not-allowed"
                    >

                      <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition" />

                      <div className="relative flex items-center gap-4">

                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">

                          {downloadingFormat ===
                          'mp4' ? (
                            <div className="w-5 h-5 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                          ) : (
                            <Icons.Play />
                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">

                            <span className="text-base font-black text-white">
                              MP4
                            </span>

                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 font-bold uppercase">
                              VIDEO
                            </span>

                          </div>

                          <p className="text-xs text-neutral-400 mt-1">
                            Video HD
                            siap
                            diputar
                          </p>

                        </div>

                        <Icons.Download />

                      </div>
                    </button>

                    {/* MP3 */}
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadVideo(
                          'mp3'
                        )
                      }
                      disabled={
                        isDownloading
                      }
                      className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-fuchsia-950/70 to-neutral-950 border border-fuchsia-800/50 hover:border-fuchsia-500 transition text-left disabled:opacity-60 disabled:cursor-not-allowed"
                    >

                      <div className="absolute inset-0 bg-fuchsia-500/0 group-hover:bg-fuchsia-500/5 transition" />

                      <div className="relative flex items-center gap-4">

                        <div className="w-12 h-12 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300 flex-shrink-0">

                          {downloadingFormat ===
                          'mp3' ? (
                            <div className="w-5 h-5 border-2 border-fuchsia-300/30 border-t-fuchsia-300 rounded-full animate-spin" />
                          ) : (
                            <Icons.Music />
                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">

                            <span className="text-base font-black text-white">
                              MP3
                            </span>

                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/15 border border-fuchsia-500/20 text-fuchsia-300 font-bold uppercase">
                              AUDIO
                            </span>

                          </div>

                          <p className="text-xs text-neutral-400 mt-1">
                            Audio
                            berkualitas
                            tinggi
                          </p>

                        </div>

                        <Icons.Download />

                      </div>
                    </button>

                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2.5">

                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      File dikirim
                      langsung oleh
                      server ke
                      browser.
                    </p>

                  </div>

                </div>
              </div>
            )}

            {/* IMAGE / CAROUSEL / MIXED CAROUSEL */}
            {mediaData?.type ===
              'image' &&
              mediaData.items && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="px-2.5 py-0.5 bg-indigo-600/90 rounded-md text-[10px] font-bold uppercase tracking-wider text-white">
                        {mediaData.platform ||
                          'INSTAGRAM'}
                      </span>

                      <span className="px-2.5 py-0.5 bg-neutral-800 rounded-md text-[10px] font-bold uppercase text-neutral-300">
                        {mediaData.items.length ===
                        1
                          ? 'Foto Tunggal'
                          : isMixedCarousel
                          ? `Carousel Campuran (${carouselImageCount} Foto • ${carouselVideoCount} Video)`
                          : `Carousel (${mediaData.items.length} Media)`}
                      </span>

                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-white mt-2 leading-snug">
                      {mediaData.title ||
                        'Instagram Media'}
                    </h3>

                  </div>

                  {mediaData.items.length >
                    1 && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

                      <button
                        type="button"
                        onClick={
                          toggleSelectAll
                        }
                        disabled={
                          isBatchDownloading
                        }
                        className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition disabled:opacity-50"
                      >
                        {selectedItems.length ===
                        mediaData.items.length
                          ? 'Batal Pilih'
                          : 'Pilih Semua'}
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleDownloadSelectedImages
                        }
                        disabled={
                          isBatchDownloading ||
                          selectedItems.length ===
                            0
                        }
                        className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs border border-neutral-700 transition disabled:opacity-50"
                      >
                        Unduh Terpilih (
                        {
                          selectedItems.length
                        }
                        )
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleDownloadAllImages
                        }
                        disabled={
                          isBatchDownloading
                        }
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                      >
                        {isBatchDownloading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />

                            <span>
                              {
                                batchProgressText
                              }
                            </span>
                          </>
                        ) : (
                          <>
                            <Icons.Download />

                            <span>
                              Download
                              All
                            </span>
                          </>
                        )}
                      </button>

                    </div>
                  )}
                </div>

                {/* MIXED INFO */}
                {isMixedCarousel && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40">

                    <div className="flex items-center gap-2.5">

                      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                        <Icons.Sparkles />
                      </div>

                      <div>

                        <p className="text-xs font-bold text-indigo-200">
                          Carousel campuran
                        </p>

                        <p className="text-[11px] text-indigo-300/60 mt-0.5">
                          Foto dan video
                          dideteksi
                          terpisah per
                          slide.
                        </p>

                      </div>

                    </div>
                  </div>
                )}

                {/* MEDIA GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">

                  {mediaData.items.map(
                    (item) => {
                      const isSelected =
                        selectedItems.includes(
                          item.index
                        );

                      const isVideo =
                        item.type ===
                        'video';

                      const extension =
                        isVideo
                          ? 'mp4'
                          : 'jpg';

                      return (
                        <div
                          key={
                            item.index
                          }
                          className={`group relative bg-neutral-950 border rounded-2xl overflow-hidden flex flex-col transition duration-200 ${
                            isSelected
                              ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                              : 'border-neutral-800 hover:border-neutral-700'
                          }`}
                        >

                          {/* SELECT */}
                          {mediaData.items &&
                            mediaData
                              .items
                              .length >
                              1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  toggleItemSelection(
                                    item.index
                                  )
                                }
                                disabled={
                                  isBatchDownloading
                                }
                                className="absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 transition disabled:opacity-50"
                              >
                                {isSelected && (
                                  <span className="text-xs text-indigo-400 font-bold">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )}

                          {/* NUMBER */}
                          <span className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono font-bold text-white">
                            #
                            {item.index +
                              1}
                          </span>

                          {/* TYPE BADGE */}
                          <span
                            className={`absolute bottom-[52px] left-2.5 z-20 px-2 py-1 rounded-md backdrop-blur-md text-[9px] font-black uppercase tracking-wider border ${
                              isVideo
                                ? 'bg-indigo-600/90 border-indigo-400/50 text-white'
                                : 'bg-black/70 border-white/20 text-neutral-200'
                            }`}
                          >
                            {isVideo
                              ? 'VIDEO'
                              : 'FOTO'}
                          </span>

                          {/* PREVIEW */}
                          <div className="aspect-square bg-neutral-900 overflow-hidden relative">

                            {item.thumbnail ||
                            item.url ? (
                              <img
                                src={
                                  item.thumbnail ||
                                  item.url
                                }
                                alt={`Item ${
                                  item.index +
                                  1
                                }`}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-700 text-xs">
                                No Preview
                              </div>
                            )}

                            {/* PLAY ICON FOR VIDEO */}
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                                <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
                                  <Icons.Play />
                                </div>

                              </div>
                            )}

                          </div>

                          {/* FOOTER */}
                          <div className="p-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2 bg-neutral-950">

                            <span className="text-[10px] font-mono text-neutral-400 uppercase">
                              .
                              {
                                extension
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                downloadSingleItem(
                                  item
                                )
                              }
                              disabled={
                                downloadingItemIndex ===
                                  item.index ||
                                isBatchDownloading
                              }
                              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition border border-neutral-700 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {downloadingItemIndex ===
                              item.index ? (
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Icons.Download />

                                  <span>
                                    Unduh
                                  </span>
                                </>
                              )}
                            </button>

                          </div>
                        </div>
                      );
                    }
                  )}

                </div>

                <p className="text-[11px] text-neutral-500 text-center">
                  Foto dan video
                  carousel diproses
                  berdasarkan tipe
                  masing-masing media.
                </p>

              </div>
            )}

            {/* SUCCESS */}
            {successInfo && (
              <div className="bg-neutral-900 border border-emerald-900/60 rounded-3xl p-6 shadow-2xl space-y-4 text-center">

                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
                  <Icons.Check />
                </div>

                <div>

                  <h3 className="text-lg font-bold text-white">
                    Download Dimulai
                  </h3>

                  <p className="text-xs text-neutral-400 mt-1">
                    Browser Anda sedang
                    menangani
                    penyimpanan file.
                  </p>

                </div>

                <div className="bg-neutral-950 p-3.5 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2 font-mono text-neutral-300 border border-neutral-800">

                  <div className="flex justify-between gap-4">

                    <span className="text-neutral-500">
                      File:
                    </span>

                    <span className="truncate text-emerald-400">
                      {
                        successInfo.filename
                      }
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-neutral-500">
                      Platform:
                    </span>

                    <span>
                      {
                        successInfo.platform
                      }
                    </span>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    resetDownloader
                  }
                  className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition border border-neutral-700"
                >
                  Download Media
                  Lain
                </button>

              </div>
            )}

            {/* PLATFORMS */}
            <div className="pt-4">

              <h2 className="text-center text-xs uppercase tracking-widest text-neutral-500 font-bold mb-5">
                Platform yang
                Didukung
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">

                {platforms.map(
                  (platform) => (
                    <div
                      key={
                        platform.name
                      }
                      className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl flex flex-col items-center text-center gap-1 hover:border-neutral-700 transition"
                    >
                      <span className="text-2xl">
                        {
                          platform.icon
                        }
                      </span>

                      <span className="text-xs font-bold text-neutral-200 mt-1">
                        {
                          platform.name
                        }
                      </span>

                      <span className="text-[10px] text-neutral-500">
                        {
                          platform.badge
                        }
                      </span>
                    </div>
                  )
                )}

              </div>
            </div>

          </div>
        )}

        {/* HISTORY */}
        {activeTab ===
          'history' && (
          <div className="space-y-6">

            <div className="flex items-center justify-between gap-4">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Riwayat Unduhan
                </h2>

                <p className="text-xs text-neutral-400 mt-0.5">
                  Disimpan secara lokal
                  di browser
                  perangkat Anda.
                </p>

              </div>

              {history.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearHistory
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-rose-300 text-xs font-semibold transition flex items-center gap-2"
                >
                  <Icons.Trash />
                  Hapus Semua
                </button>
              )}

            </div>

            {history.length ===
            0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center">

                <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 mb-4">
                  <Icons.Download />
                </div>

                <h3 className="text-lg font-bold text-white">
                  Belum Ada
                  Riwayat
                </h3>

                <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
                  Media yang berhasil
                  Anda download
                  akan muncul di
                  sini.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      'downloader'
                    )
                  }
                  className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Mulai Download
                </button>

              </div>
            ) : (
              <div className="space-y-3">

                {history.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                    >

                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex-shrink-0">

                        {item.thumbnail ? (
                          <img
                            src={
                              item.thumbnail
                            }
                            alt={
                              item.title
                            }
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-700">
                            <Icons.Download />
                          </div>
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2 mb-1">

                          <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/50 text-[9px] font-black uppercase">
                            {
                              item.platform
                            }
                          </span>

                          <span className="text-[10px] text-neutral-600">
                            {formatHistoryTime(
                              item.timestamp
                            )}
                          </span>

                        </div>

                        <h3 className="text-sm font-bold text-white truncate">
                          {
                            item.title
                          }
                        </h3>

                        <p className="text-[11px] text-neutral-500 truncate mt-1 font-mono">
                          {
                            item.filename
                          }
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteHistoryItem(
                            item.id
                          )
                        }
                        className="w-9 h-9 rounded-xl bg-neutral-950 hover:bg-rose-950/60 border border-neutral-800 hover:border-rose-900/60 text-neutral-500 hover:text-rose-300 flex items-center justify-center transition flex-shrink-0"
                        aria-label="Hapus riwayat"
                      >
                        <Icons.Trash />
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-900/80 mt-auto">

        <div className="max-w-5xl mx-auto px-4 py-6 text-center">

          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Letsedrop hanya
            memproses media publik.
            Gunakan layanan ini
            sesuai hak cipta,
            ketentuan platform,
            dan hukum yang berlaku.
          </p>

          <p className="text-[10px] text-neutral-700 mt-2">
            ©{' '}
            {new Date().getFullYear()}{' '}
            Letsedrop
          </p>

        </div>

      </footer>

    </div>
  );
}
