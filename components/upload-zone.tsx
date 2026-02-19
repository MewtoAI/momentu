"use client";

import { useState, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Momentu — Upload Zone
// Estados: vazio | hover | carregando | cheio (com thumbnails)
// Suporta múltiplas fotos, drag & drop, click para selecionar
// Design: clean, encorajador, feedback visual imediato
// ─────────────────────────────────────────────────────────────────────────────

type UploadState = "empty" | "hovering" | "uploading" | "filled";

export interface PhotoFile {
  id: string;
  name: string;
  url: string; // object URL for preview
  size: number;
  status: "uploading" | "done" | "error";
  progress: number;
}

const MAX_PHOTOS = 20;
const MAX_SIZE_MB = 20;

// formatSize reserved for future use in tooltips
// function formatSize(bytes: number): string { ... }

function CameraIcon({ size = 48, color = "#D4A5BB" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="12" width="40" height="28" rx="5" stroke={color} strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="26" r="7" stroke={color} strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="26" r="3" fill={color} opacity="0.5" />
      <path d="M18 12l2-4h8l2 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="37" cy="19" r="2" fill={color} />
    </svg>
  );
}

function UploadIcon({ size = 24, color = "#D4A5BB" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 16V8M12 8l-3 3M12 8l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16.5V18a2 2 0 002 2h14a2 2 0 002-2v-1.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PhotoThumbnail({
  photo,
  onRemove,
}: {
  photo: PhotoFile;
  onRemove: (id: string) => void;
}) {
  const [thumbHovered, setThumbHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        aspectRatio: "1",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
      }}
      onMouseEnter={() => setThumbHovered(true)}
      onMouseLeave={() => setThumbHovered(false)}
    >
      {/* Photo or placeholder */}
      <img
        src={photo.url}
        alt={photo.name}
        className="w-full h-full object-cover"
        style={{ display: "block" }}
      />

      {/* Progress overlay during upload */}
      {photo.status === "uploading" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.50)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "2px solid white",
            }}
          >
            <span className="text-white text-xs font-bold">{photo.progress}%</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {photo.status === "error" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(212,105,106,0.60)" }}
        >
          <span className="text-white text-xs">Erro</span>
        </div>
      )}

      {/* Hover: remove button */}
      {photo.status === "done" && thumbHovered && (
        <div
          className="absolute inset-0 flex items-end justify-end p-1.5"
          style={{ background: "rgba(0,0,0,0.30)" }}
        >
          <button
            onClick={() => onRemove(photo.id)}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "rgba(212,105,106,0.90)",
            }}
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* Done indicator */}
      {photo.status === "done" && !thumbHovered && (
        <div
          className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "#6CB99A" }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function UploadZone({
  maxPhotos = MAX_PHOTOS,
  onPhotosChange,
}: {
  maxPhotos?: number;
  onPhotosChange?: (photos: PhotoFile[]) => void;
}) {
  const [state, setState] = useState<UploadState>("empty");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [, setUploadingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  const simulateUpload = useCallback((files: File[]) => {
    const valid = files.filter((f) => {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`"${f.name}" é muito grande — máx ${MAX_SIZE_MB}MB`);
        shake();
        return false;
      }
      return true;
    });

    if (valid.length === 0) return;

    const newPhotos: PhotoFile[] = valid.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
      status: "uploading" as const,
      progress: 0,
    }));

    setPhotos((prev) => {
      const combined = [...prev, ...newPhotos];
      if (combined.length > maxPhotos) {
        setErrorMessage(`Limite de ${maxPhotos} fotos atingido.`);
        shake();
        return prev;
      }
      return combined;
    });

    setState("uploading");
    setUploadingCount(newPhotos.length);
    setOverallProgress(0);

    // Simulate individual uploads
    newPhotos.forEach((photo, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? { ...p, status: "done", progress: 100 }
                : p
            )
          );

          setUploadingCount((c) => {
            const remaining = c - 1;
            if (remaining <= 0) {
              setState("filled");
              setOverallProgress(100);
            }
            return remaining;
          });
        } else {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? { ...p, progress: Math.floor(progress) }
                : p
            )
          );
          setOverallProgress(Math.floor(progress / newPhotos.length + index * (100 / newPhotos.length)));
        }
      }, 80 + index * 30);
    });
  }, [maxPhotos, shake]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((f) => f.type.startsWith("image/") || f.name.endsWith(".heic"));
      if (imageFiles.length === 0) {
        setErrorMessage("Selecione apenas imagens (JPG, PNG, HEIC)");
        shake();
        return;
      }
      setErrorMessage(null);
      simulateUpload(imageFiles);
    },
    [simulateUpload, shake]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState((prev) => (prev === "filled" ? "filled" : "empty"));
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => (prev === "filled" ? "filled" : "hovering"));
  }, []);

  const handleDragLeave = useCallback(() => {
    setState((prev) => (prev === "hovering" ? "empty" : prev));
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setState("empty");
      return next;
    });
  }, []);

  const donePhotos = photos.filter((p) => p.status === "done");

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        @keyframes dashAnimate {
          to { stroke-dashoffset: -24; }
        }
        @keyframes thumbIn {
          from { opacity: 0; transform: scale(0.80); }
          to   { opacity: 1; transform: scale(1); }
        }
        .thumb-enter { animation: thumbIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .upload-zone-shake { animation: shake 0.5s ease; }
      `}</style>

      {/* ── Zone ── */}
      <div
        className={isShaking ? "upload-zone-shake" : ""}
        onClick={state !== "uploading" ? handleClick : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          position: "relative",
          borderRadius: 24,
          cursor: state === "filled" ? "default" : "pointer",
          minHeight: state === "filled" ? undefined : 220,
          transition: "all 0.25s ease",
          background:
            state === "hovering"
              ? "rgba(242, 228, 236, 0.60)"
              : state === "uploading"
              ? "rgba(250,248,245,0.80)"
              : "rgba(250,248,245,0.60)",
          border:
            state === "hovering"
              ? "2px dashed #D4A5BB"
              : state === "filled"
              ? "2px solid rgba(108,185,154,0.30)"
              : "2px dashed #D4D4D4",
          boxShadow:
            state === "hovering"
              ? "0 0 0 4px rgba(212,165,187,0.12)"
              : "0 2px 12px rgba(180,150,180,0.08)",
        }}
      >
        {/* ── Empty state ── */}
        {state === "empty" && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div
              style={{
                padding: 20,
                borderRadius: 20,
                background: "rgba(212,165,187,0.10)",
                marginBottom: 16,
              }}
            >
              <CameraIcon size={48} color="#D4A5BB" />
            </div>
            <p
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#1E1B24",
                marginBottom: 6,
              }}
            >
              Arraste suas fotos aqui
            </p>
            <p style={{ fontSize: 14, color: "#9B94AE", marginBottom: 16 }}>
              ou clique para selecionar do computador
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {["JPG", "PNG", "HEIC"].map((fmt) => (
                <span
                  key={fmt}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: "rgba(212,165,187,0.12)",
                    color: "#8B5A72",
                    letterSpacing: "0.06em",
                  }}
                >
                  {fmt}
                </span>
              ))}
              <span
                style={{
                  fontSize: 11,
                  color: "#9B94AE",
                  padding: "4px 0",
                }}
              >
                · máx {maxPhotos} fotos · {MAX_SIZE_MB}MB cada
              </span>
            </div>
          </div>
        )}

        {/* ── Hovering state ── */}
        {state === "hovering" && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div
              style={{
                padding: 20,
                borderRadius: 20,
                background: "rgba(212,165,187,0.20)",
                marginBottom: 16,
                transform: "scale(1.1)",
                transition: "transform 0.2s ease",
              }}
            >
              <CameraIcon size={48} color="#C48FAA" />
            </div>
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#8B5A72",
                marginBottom: 4,
              }}
            >
              Solte para adicionar! 💕
            </p>
            <p style={{ fontSize: 14, color: "#C48FAA" }}>
              Suas fotos vão ficar lindas no álbum
            </p>
          </div>
        )}

        {/* ── Uploading state ── */}
        {state === "uploading" && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div
              style={{
                padding: 16,
                borderRadius: 20,
                background: "rgba(212,165,187,0.10)",
                marginBottom: 16,
              }}
            >
              <UploadIcon size={36} color="#D4A5BB" />
            </div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1E1B24",
                marginBottom: 4,
              }}
            >
              Enviando suas fotos com cuidado...
            </p>
            <p style={{ fontSize: 13, color: "#9B94AE", marginBottom: 16 }}>
              {donePhotos.length} de {photos.length} foto{photos.length !== 1 ? "s" : ""} enviada{donePhotos.length !== 1 ? "s" : ""}
            </p>
            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                maxWidth: 280,
                height: 6,
                borderRadius: 99,
                background: "#E8E8E8",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, #D4A5BB, #B8AACF)",
                  width: `${Math.max(5, overallProgress)}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* ── Filled state — thumbnail grid ── */}
        {state === "filled" && (
          <div style={{ padding: 16 }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#6CB99A",
                  }}
                />
                <span
                  style={{ fontSize: 14, fontWeight: 600, color: "#1E1B24" }}
                >
                  {donePhotos.length} foto{donePhotos.length !== 1 ? "s" : ""} adicionada{donePhotos.length !== 1 ? "s" : ""}
                </span>
              </div>
              {donePhotos.length < maxPhotos && (
                <button
                  onClick={handleClick}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#D4A5BB",
                    background: "rgba(212,165,187,0.12)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                  }}
                >
                  + Adicionar mais
                </button>
              )}
            </div>

            {/* Thumbnails grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                gap: 8,
              }}
            >
              {photos.map((photo) => (
                <div key={photo.id} className="thumb-enter">
                  <PhotoThumbnail photo={photo} onRemove={removePhoto} />
                </div>
              ))}

              {/* Add more placeholder */}
              {donePhotos.length < maxPhotos && (
                <div
                  onClick={handleClick}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 12,
                    border: "2px dashed rgba(212,165,187,0.40)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    gap: 4,
                    background: "rgba(250,248,245,0.60)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: 18, color: "#D4A5BB" }}>+</span>
                  <span style={{ fontSize: 9, color: "#9B94AE", textAlign: "center" }}>
                    {maxPhotos - donePhotos.length} restante{maxPhotos - donePhotos.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Error message ── */}
      {errorMessage && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(212,105,106,0.08)",
            border: "1px solid rgba(212,105,106,0.20)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span style={{ fontSize: 13, color: "#D4696A" }}>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#D4696A",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Helper tip ── */}
      {state === "empty" && (
        <p
          style={{
            marginTop: 10,
            textAlign: "center",
            fontSize: 12,
            color: "#9B94AE",
          }}
        >
          💡 Dica: fotos de boa qualidade ficam ainda mais bonitas no álbum
        </p>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,.heic"
        multiple
        style={{ display: "none" }}
        onChange={handleInputChange}
      />
    </div>
  );
}
