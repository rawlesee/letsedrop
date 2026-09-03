import React, { useState, useEffect } from 'react';

const DEFAULT_API_BASE_URL = 'https://linkdrop-backend.vercel.app';
const API_BASE_URL =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
  DEFAULT_API_BASE_URL;

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
      className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors"
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
      className="w-4 h-4 text-emerald-400"
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
      className="w-3.5 h-3.5 text-indigo-400"
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
};

export default function App() {
  const [urlInput, setUrlInput] = useState('');
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStepText, setDownloadStepText] = useState('Download');
  const [mediaData, setMediaData] = useState<MediaMetadata | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('best');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [downloadingItemIndex, setDownloadingItemIndex] = useState<number | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ filename: string; platform: string } | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'downloader' | 'history'>('downloader');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('letsedrop_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3500);
  };

  const saveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };

    const updated = [
      newItem,
      ...history.filter((h) => h.url !== item.url).slice(0, 14),
    ];

    setHistory(updated);

    try {
      localStorage.setItem(
        'letsedrop_history',
        JSON.stringify(updated)
      );
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);

    try {
      localStorage.removeItem('letsedrop_history');
      showToast('Semua riwayat berhasil dihapus.');
    } catch {}
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);

    setHistory(updated);

    try {
      localStorage.setItem(
        'letsedrop_history',
        JSON.stringify(updated)
      );

      showToast('Item riwayat dihapus.');
    } catch {}
  };

  const handlePasteClipboard = async () => {
    try {
      if (
        navigator.clipboard &&
        navigator.clipboard.readText
      ) {
        const text =
          await navigator.clipboard.readText();

        if (
          text &&
          text.trim().startsWith('http')
        ) {
          setUrlInput(text.trim());
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
          'Izin akses clipboard tidak tersedia pada peramban ini.'
        );
      }
    } catch {
      showToast(
        'Gagal membaca clipboard. Tempelkan tautan secara manual.'
      );
    }
  };

  const triggerBrowserDownload = (
    blob: Blob,
    filename: string,
    contentType: string
  ) => {
    const fileBlob = new Blob(
      [blob],
      { type: contentType }
    );

    const blobUrl =
      window.URL.createObjectURL(
        fileBlob
      );

    const link =
      document.createElement('a');

    link.href = blobUrl;
    link.setAttribute(
      'download',
      filename
    );
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 5000);
  };

  const handleAnalyze = async (
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault();

    const cleanInput =
      urlInput.trim();

    if (!cleanInput) {
      setErrorMessage(
        'Tempelkan tautan media publik terlebih dahulu.'
      );
      return;
    }

    setErrorMessage(null);
    setMediaData(null);
    setSuccessInfo(null);
    setSelectedItems([]);
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

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Media tidak tersedia atau platform belum didukung.'
        );
      }

      setAnalyzedUrl(
        cleanInput
      );

      /*
       * =====================================================
       * PENTING:
       *
       * Prioritaskan result.type === "video".
       *
       * Sebelumnya kondisi:
       * result.type === "image" ||
       * result.items.length > 0
       *
       * membuat Reels yang memiliki items video
       * terbaca sebagai FOTO/JPG.
       * =====================================================
       */

      const resultItems =
        Array.isArray(
          result.items
        )
          ? result.items
          : [];

      const hasVideoItem =
        resultItems.some(
          (item: MediaItem) =>
            item.type ===
            'video'
        );

      const isVideoResult =
        result.type ===
          'video' ||
        hasVideoItem;

      if (isVideoResult) {
        const formats: MediaFormat[] =
          [
            {
              id: 'best',
              label:
                'Video MP4 (HD)',
              extension:
                'mp4',
              quality:
                'HD',
              type:
                'video',
            },
            {
              id: 'audio',
              label:
                'Audio MP3',
              extension:
                'mp3',
              quality:
                'High Audio',
              type:
                'audio',
            },
          ];

        setMediaData({
          ...result,

          type:
            'video',

          title:
            result.title ||
            'Instagram Reels',

          thumbnail:
            result.thumbnail ||
            resultItems[0]?.thumbnail ||
            resultItems[0]?.url ||
            '',

          formats,
        });

        setSelectedFormatId(
          'best'
        );

        setSelectedItems([]);
      } else {
        const items: MediaItem[] =
          resultItems.length > 0
            ? resultItems.map(
                (
                  item: MediaItem,
                  index: number
                ) => ({
                  ...item,
                  index:
                    typeof item.index ===
                    'number'
                      ? item.index
                      : index,
                  type:
                    item.type ||
                    'image',
                  thumbnail:
                    item.thumbnail ||
                    item.url ||
                    '',
                  ext:
                    item.ext ||
                    'jpg',
                })
              )
            : [
                {
                  index: 0,
                  type: 'image',
                  url:
                    result.thumbnail ||
                    '',
                  thumbnail:
                    result.thumbnail ||
                    '',
                  ext: 'jpg',
                },
              ];

        setMediaData({
          ...result,

          type:
            'image',

          title:
            result.title ||
            'Foto Instagram',

          thumbnail:
            result.thumbnail ||
            items[0]?.thumbnail ||
            items[0]?.url ||
            '',

          items,
        });

        setSelectedItems(
          items.map(
            (item) =>
              item.index
          )
        );
      }
    } catch (err: unknown) {
      const error =
        err as Error;

      let humanMessage =
        error.message ||
        'Terjadi masalah saat memproses tautan media.';

      const lower =
        humanMessage.toLowerCase();

      if (
        lower.includes(
          'private'
        ) ||
        lower.includes(
          'login'
        )
      ) {
        humanMessage =
          'Media ini tidak dapat diakses karena bersifat privat atau membutuhkan login akun.';
      } else if (
        lower.includes(
          'failed to fetch'
        ) ||
        lower.includes(
          'networkerror'
        )
      ) {
        humanMessage =
          'Gagal menghubungi server Letsedrop. Periksa koneksi internet Anda lalu coba lagi.';
      }

      setErrorMessage(
        humanMessage
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadVideo = async () => {
    const urlToSend =
      analyzedUrl.trim();

    if (
      !urlToSend ||
      !mediaData
    ) {
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);
    setSuccessInfo(null);
    setDownloadStepText(
      'Menyiapkan media...'
    );

    const isAudio =
      selectedFormatId ===
      'audio';

    const payloadFormatId =
      isAudio
        ? 'audio'
        : 'best';

    try {
      setDownloadStepText(
        isAudio
          ? 'Mengambil audio MP3...'
          : 'Mengunduh video MP4...'
      );

      const response =
        await fetch(
          `${API_BASE_URL}/api/download`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              url: urlToSend,
              formatId:
                payloadFormatId,
            }),
          }
        );

      if (!response.ok) {
        let errDesc =
          'Gagal mengunduh file media dari server.';

        try {
          const errData =
            await response.json();

          if (
            errData.message
          ) {
            errDesc =
              errData.message;
          }
        } catch {}

        throw new Error(
          errDesc
        );
      }

      setDownloadStepText(
        'Memproses berkas...'
      );

      let finalFilename =
        isAudio
          ? 'Letsedrop_Audio.mp3'
          : 'Letsedrop_Video.mp4';

      const disposition =
        response.headers.get(
          'Content-Disposition'
        );

      if (
        disposition &&
        disposition.includes(
          'filename='
        )
      ) {
        const matches =
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
            disposition
          );

        if (
          matches != null &&
          matches[1]
        ) {
          finalFilename =
            matches[1]
              .replace(
                /['"]/g,
                ''
              )
              .trim();
        }
      }

      const blob =
        await response.blob();

      const contentType =
        response.headers.get(
          'Content-Type'
        ) ||
        (isAudio
          ? 'audio/mpeg'
          : 'video/mp4');

      setDownloadStepText(
        'Download siap!'
      );

      triggerBrowserDownload(
        blob,
        finalFilename,
        contentType
      );

      saveToHistory({
        url: urlToSend,
        title:
          mediaData.title ||
          finalFilename,
        thumbnail:
          mediaData.thumbnail ||
          '',
        platform:
          mediaData.platform ||
          'VIDEO',
        filename:
          finalFilename,
      });

      setSuccessInfo({
        filename:
          finalFilename,
        platform:
          (
            mediaData.platform ||
            'VIDEO'
          ).toUpperCase(),
      });
    } catch (err: unknown) {
      const error =
        err as Error;

      setErrorMessage(
        error.message ||
          'Gagal memproses pengunduhan video.'
      );
    } finally {
      setIsDownloading(false);
      setDownloadStepText(
        'Download'
      );
    }
  };

  const downloadSingleImage = async (
    item: MediaItem,
    customUrl?: string
  ): Promise<void> => {
    const urlToSend =
      customUrl ||
      analyzedUrl.trim();

    setDownloadingItemIndex(
      item.index
    );

    setErrorMessage(null);

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/download-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              imageUrl:
                item.url,
              itemIndex:
                item.index,
              url:
                urlToSend,
            }),
          }
        );

      if (!response.ok) {
        let message =
          'Foto tidak dapat diunduh saat ini.';

        try {
          const data =
            await response.json();

          if (
            data?.message
          ) {
            message =
              data.message;
          }
        } catch {}

        throw new Error(
          message
        );
      }

      let filename =
        `Letsedrop_Instagram_Photo_${
          item.index + 1
        }.jpg`;

      const disposition =
        response.headers.get(
          'Content-Disposition'
        );

      if (
        disposition &&
        disposition.includes(
          'filename='
        )
      ) {
        const matches =
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
            disposition
          );

        if (
          matches != null &&
          matches[1]
        ) {
          filename =
            matches[1]
              .replace(
                /['"]/g,
                ''
              )
              .trim();
        }
      }

      const blob =
        await response.blob();

      const contentType =
        response.headers.get(
          'Content-Type'
        ) ||
        'image/jpeg';

      triggerBrowserDownload(
        blob,
        filename,
        contentType
      );

      saveToHistory({
        url: urlToSend,
        title:
          `${
            mediaData?.title ||
            'Instagram Photo'
          } (#${
            item.index + 1
          })`,
        thumbnail:
          item.thumbnail ||
          item.url,
        platform:
          'INSTAGRAM',
        filename,
      });

      showToast(
        `Foto #${
          item.index + 1
        } berhasil diunduh.`
      );
    } catch (err: unknown) {
      const error =
        err as Error;

      setErrorMessage(
        error.message ||
          'Gagal mengunduh foto.'
      );
    } finally {
      setDownloadingItemIndex(
        null
      );
    }
  };

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
            `Mengunduh foto ${
              i + 1
            } dari ${
              items.length
            }...`
          );

          await downloadSingleImage(
            currentItem,
            analyzedUrl
          );

          if (
            i <
            items.length - 1
          ) {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  800
                )
            );
          }
        }

        setSuccessInfo({
          filename:
            `${items.length} Foto Berhasil Diunduh`,
          platform:
            'INSTAGRAM CAROUSEL',
        });

        showToast(
          'Semua foto berhasil dikirim ke perangkat Anda.'
        );
      } catch {
        setErrorMessage(
          'Terjadi kendala saat mengunduh beberapa foto.'
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
            itemsToDownload[i];

          setBatchProgressText(
            `Mengunduh ${
              i + 1
            } dari ${
              itemsToDownload.length
            }...`
          );

          await downloadSingleImage(
            currentItem,
            analyzedUrl
          );

          if (
            i <
            itemsToDownload.length - 1
          ) {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  800
                )
            );
          }
        }

        setSuccessInfo({
          filename:
            `${itemsToDownload.length} Foto Terpilih Berhasil Diunduh`,
          platform:
            'INSTAGRAM CAROUSEL',
        });

        showToast(
          'Semua foto terpilih berhasil dikirim.'
        );
      } catch {
        setErrorMessage(
          'Terjadi kendala saat mengunduh beberapa foto terpilih.'
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

  const toggleItemSelection = (
    index: number
  ) => {
    setSelectedItems(
      (prev) =>
        prev.includes(index)
          ? prev.filter(
              (i) => i !== index
            )
          : [
              ...prev,
              index,
            ]
    );
  };

  const toggleSelectAll = () => {
    if (
      !mediaData?.items
    ) {
      return;
    }

    if (
      selectedItems.length ===
      mediaData.items.length
    ) {
      setSelectedItems([]);
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
    if (!seconds) {
      return '';
    }

    const m =
      Math.floor(
        seconds / 60
      );

    const s =
      seconds % 60;

    return `${m}:${
      s < 10
        ? '0'
        : ''
    }${s}`;
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
      badge: 'MP4 HD & MP3',
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
      icon: '🐦',
      badge: 'Klip Video',
    },
    {
      name: 'Reddit',
      icon: '🤖',
      badge: 'Video Bersuara',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900/90 border border-neutral-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-fade-in backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            {toastText}
          </span>
        </div>
      )}

      <header className="border-b border-neutral-900/80 bg-neutral-950/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => {
              setActiveTab(
                'downloader'
              );
              setErrorMessage(
                null
              );
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
              <Icons.Logo />
            </div>

            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent lowercase">
              letsedrop
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() =>
                setActiveTab(
                  'downloader'
                )
              }
              className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                activeTab ===
                'downloader'
                  ? 'bg-neutral-900 text-indigo-400 border border-neutral-800 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              Downloader
            </button>

            <button
              onClick={() =>
                setActiveTab(
                  'history'
                )
              }
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeTab ===
                'history'
                  ? 'bg-neutral-900 text-indigo-400 border border-neutral-800 shadow-sm'
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {activeTab ===
          'downloader' && (
          <div className="space-y-10">
            <div className="text-center space-y-3 pt-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-semibold text-neutral-300 mb-2 shadow-inner">
                <Icons.Sparkles />
                <span>
                  Pengunduh Media Publik Tercepat & Bersih
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                Download. Drop.{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Done.
                </span>
              </h1>

              <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Tempel tautan publik video atau foto dari platform favorit Anda. Nikmati unduhan berkecepatan tinggi tanpa iklan mengganggu.
              </p>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-90" />

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
                    onChange={(e) =>
                      setUrlInput(
                        e.target.value
                      )
                    }
                    placeholder="Tempel tautan video, foto, atau carousel di sini..."
                    disabled={
                      isAnalyzing ||
                      isDownloading ||
                      isBatchDownloading
                    }
                    required
                    className="w-full bg-neutral-950 border border-neutral-800/90 rounded-2xl px-4 py-4 pr-28 text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition disabled:opacity-50 min-h-[54px]"
                  />

                  <div className="absolute right-2.5 top-2.5 flex items-center">
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
                      className="group px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition border border-neutral-700 min-h-[42px] flex items-center gap-1.5"
                    >
                      <Icons.Paste />
                      <span>
                        Tempel
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
                  <span className="truncate text-neutral-500">
                    Mendukung: TikTok, Instagram, YouTube, X, Facebook, Reddit
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
                <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-fade-in">
                  <span className="text-rose-400 text-base">
                    ⚠️
                  </span>

                  <div className="flex-1 leading-relaxed">
                    <p className="font-bold text-rose-300">
                      Gagal Memproses
                    </p>

                    <p className="mt-0.5">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {mediaData &&
              mediaData.type ===
                'image' &&
              mediaData.items && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-indigo-600/90 rounded-md text-[10px] font-bold uppercase tracking-wider text-white">
                          {mediaData.platform}
                        </span>

                        <span className="px-2.5 py-0.5 bg-neutral-800 rounded-md text-[10px] font-bold uppercase text-neutral-300">
                          {mediaData.items.length >
                          1
                            ? `Carousel (${mediaData.items.length} Foto)`
                            : 'Foto Tunggal'}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-white mt-2 leading-snug">
                        {mediaData.title}
                      </h3>
                    </div>

                    {mediaData.items
                      .length >
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
                          className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition"
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
                          className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs border border-neutral-700 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <span>
                            Unduh Terpilih (
                            {
                              selectedItems.length
                            }
                            )
                          </span>
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
                                {batchProgressText ||
                                  'Mengunduh...'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Icons.Download />
                              <span>
                                Download All
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {mediaData.items.map(
                      (item) => {
                        const isSelected =
                          selectedItems.includes(
                            item.index
                          );

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
                            {mediaData
                              .items &&
                              mediaData.items
                                .length >
                                1 && (
                                <div
                                  onClick={() =>
                                    toggleItemSelection(
                                      item.index
                                    )
                                  }
                                  className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/80 transition"
                                >
                                  {isSelected && (
                                    <span className="text-xs text-indigo-400 font-bold">
                                      ✓
                                    </span>
                                  )}
                                </div>
                              )}

                            <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-mono font-bold text-white">
                              #
                              {item.index +
                                1}
                            </span>

                            <div className="aspect-square bg-neutral-900 overflow-hidden relative">
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
                            </div>

                            <div className="p-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2 bg-neutral-950">
                              <span className="text-[10px] font-mono text-neutral-400 uppercase">
                                .
                                {item.ext ||
                                  'jpg'}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadSingleImage(
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
                    Foto dialirkan secara aman melalui server proxy ke folder Downloads perangkat Anda.
                  </p>
                </div>
              )}

            {mediaData &&
              mediaData.type ===
                'video' && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-72 flex-shrink-0 aspect-video bg-neutral-950 rounded-2xl overflow-hidden relative border border-neutral-800 shadow-md">
                      {mediaData.thumbnail ? (
                        <img
                          src={
                            mediaData.thumbnail
                          }
                          alt={
                            mediaData.title
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-neutral-600">
                          🎬
                        </div>
                      )}

                      <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-indigo-600/90 rounded-md text-[10px] font-bold uppercase tracking-wider text-white">
                        {mediaData.platform}
                      </span>

                      {mediaData.duration ? (
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded-md text-[10px] font-mono text-neutral-200">
                          {formatDuration(
                            mediaData.duration
                          )}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                          {mediaData.title}
                        </h3>

                        <p className="text-xs text-neutral-400 mt-1">
                          Pengunggah:{' '}
                          <span className="text-neutral-200 font-medium">
                            {mediaData.uploader ||
                              'Publik'}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                          Pilih Format:
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          {mediaData.formats?.map(
                            (fmt) => (
                              <button
                                key={
                                  fmt.id
                                }
                                type="button"
                                onClick={() =>
                                  setSelectedFormatId(
                                    fmt.id
                                  )
                                }
                                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition min-h-[56px] ${
                                  selectedFormatId ===
                                  fmt.id
                                    ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded font-mono font-bold uppercase ${
                                      fmt.extension ===
                                      'mp3'
                                        ? 'bg-emerald-950 text-emerald-300'
                                        : 'bg-neutral-800 text-indigo-300'
                                    }`}
                                  >
                                    {
                                      fmt.extension
                                    }
                                  </span>

                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold">
                                      {
                                        fmt.label
                                      }
                                    </span>

                                    <span className="text-[9px] text-neutral-500 mt-0.5">
                                      {
                                        fmt.quality
                                      }
                                    </span>
                                  </div>
                                </div>

                                {selectedFormatId ===
                                  fmt.id && (
                                  <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={
                            handleDownloadVideo
                          }
                          disabled={
                            isDownloading
                          }
                          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition disabled:opacity-60 flex items-center justify-center gap-2 min-h-[52px]"
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />

                              <span>
                                {
                                  downloadStepText
                                }
                              </span>
                            </>
                          ) : (
                            <>
                              <Icons.Download />

                              <span>
                                Download{' '}
                                {selectedFormatId ===
                                'audio'
                                  ? 'Audio MP3'
                                  : 'Video MP4'}
                              </span>
                            </>
                          )}
                        </button>

                        <p className="text-[11px] text-neutral-500 text-center mt-2">
                          File langsung dialirkan ke download manager browser perangkat Anda.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {successInfo && (
              <div className="bg-neutral-900 border border-emerald-900/60 rounded-3xl p-6 shadow-2xl space-y-4 text-center animate-fade-in">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400 text-xl font-bold">
                  <Icons.Check />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    Download Selesai Dimulai
                  </h3>

                  <p className="text-xs text-neutral-400 mt-1">
                    File sedang disimpan oleh browser Anda.
                  </p>
                </div>

                <div className="bg-neutral-950 p-3.5 rounded-2xl max-w-md mx-auto text-left text-xs space-y-1 font-mono text-neutral-300 border border-neutral-800">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">
                      File:
                    </span>

                    <span className="truncate max-w-[200px] text-emerald-400">
                      {
                        successInfo.filename
                      }
                    </span>
                  </div>

                  <div className="flex justify-between">
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
                  onClick={() => {
                    setUrlInput('');
                    setAnalyzedUrl('');
                    setMediaData(null);
                    setSuccessInfo(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition border border-neutral-700"
                >
                  Download Media Lain
                </button>
              </div>
            )}

            <div className="pt-4">
              <h2 className="text-center text-xs uppercase tracking-widest text-neutral-500 font-bold mb-5">
                Platform yang Didukung
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {platforms.map(
                  (p) => (
                    <div
                      key={
                        p.name
                      }
                      className="p-3.5 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl flex flex-col items-center text-center gap-1 hover:border-neutral-700 transition"
                    >
                      <span className="text-2xl">
                        {p.icon}
                      </span>

                      <span className="text-xs font-bold text-neutral-200 mt-1">
                        {p.name}
                      </span>

                      <span className="text-[10px] text-neutral-500">
                        {p.badge}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab ===
          'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Riwayat Unduhan
                </h2>

                <p className="text-xs text-neutral-400 mt-0.5">
                  Disimpan secara lokal di browser perangkat Anda.
                </p>
              </div>

              {history.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearHistory
                  }
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 hover:bg-rose-900/50 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Icons.Trash />

                  <span>
                    Bersihkan Semua
                  </span>
                </button>
              )}
            </div>

            {history.length ===
            0 ? (
              <div className="text-center py-16 bg-neutral-900/30 border border-neutral-800/50 rounded-3xl">
                <div className="text-4xl mb-2">
                  📂
                </div>

                <p className="text-sm text-neutral-400">
                  Belum ada riwayat unduhan di Letsedrop.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between gap-4 hover:border-neutral-700 transition"
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                        onClick={() => {
                          setUrlInput(
                            item.url
                          );
                          setActiveTab(
                            'downloader'
                          );
                        }}
                        title="Klik untuk analisis ulang"
                      >
                        <div className="w-12 h-12 bg-neutral-950 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-800">
                          {item.thumbnail ? (
                            <img
                              src={
                                item.thumbnail
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">
                              🎬
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate hover:text-indigo-400 transition">
                            {
                              item.title
                            }
                          </p>

                          <p className="text-xs text-neutral-400 truncate mt-0.5 font-mono">
                            <span className="uppercase text-indigo-400 text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded mr-1.5 font-sans">
                              {
                                item.platform
                              }
                            </span>

                            {
                              item.filename
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-neutral-500">
                          {new Date(
                            item.timestamp
                          ).toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'short',
                            }
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            deleteHistoryItem(
                              item.id
                            )
                          }
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition"
                          title="Hapus dari riwayat"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-900/80 py-8 text-center text-xs text-neutral-500 mt-12 bg-neutral-950">
        <div className="max-w-xl mx-auto px-4 space-y-2">
          <p className="text-neutral-400 font-medium">
            Tolong download hanya konten publik yang Anda miliki atau berhak menyimpannya. Letsedrop tidak membypass akun private, login, DRM, atau paywall.
          </p>

          <p className="text-[11px] text-neutral-600 leading-relaxed">
            Letsedrop adalah utilitas pengunduhan konten publik. Letsedrop tidak berafiliasi dengan TikTok, YouTube, Instagram, Meta, atau X. Seluruh hak cipta media merupakan milik pencipta konten masing-masing.
          </p>

          <p className="pt-2 text-[11px] text-neutral-500 font-mono">
            &copy; 2026 LETSEDROP. Built for high-speed mobile & desktop downloads.
          </p>
        </div>
      </footer>
    </div>
  );
}
