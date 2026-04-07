import { useEffect, useMemo, useState } from "react";
import { api, toAbsoluteAssetUrl } from "./api";
import { BeforeAfterViewer } from "./components/BeforeAfterViewer";
import { ControlsPanel } from "./components/ControlsPanel";
import { LiveFeedList } from "./components/LiveFeedList";
import { TopBar } from "./components/TopBar";
import { createMirrorSocket } from "./realtime";
import type { Category, Controls, MirrorImage, Preset } from "./types";
import "./App.css";

const normalizeImage = (image: MirrorImage): MirrorImage => ({
  ...image,
  originalUrl: toAbsoluteAssetUrl(image.originalUrl),
  previewUrl: toAbsoluteAssetUrl(image.previewUrl),
  fullUrl: toAbsoluteAssetUrl(image.fullUrl),
});

const upsertImage = (images: MirrorImage[], incoming: MirrorImage) => {
  const normalized = normalizeImage(incoming);
  const index = images.findIndex((item) => item.id === normalized.id);
  if (index === -1) {
    return [normalized, ...images].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const next = [...images];
  next[index] = normalized;
  return next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

function App() {
  const [images, setImages] = useState<MirrorImage[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [controls, setControls] = useState<Controls | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [batchCategoryId, setBatchCategoryId] = useState("");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showAfter, setShowAfter] = useState(true);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>("Connecting to Mirror AI...");

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [imagesResponse, controlsResponse, presetsResponse] = await Promise.all([
          api.getImages(),
          api.getControls(),
          api.getPresets(),
        ]);
        const normalizedImages = imagesResponse.images.map(normalizeImage);
        setImages(normalizedImages);
        setControls(controlsResponse.controls);
        setCategories(controlsResponse.categories);
        setBatchCategoryId((current) => current || controlsResponse.categories[0]?.id || "");
        setPresets(presetsResponse.presets);
        setSelectedImageId(normalizedImages[0]?.id ?? null);
        setMessage("Live");
      } catch (error) {
        setMessage(`Failed to load data: ${(error as Error).message}`);
      }
    };

    bootstrap().catch(() => {
      setMessage("Initialization failed");
    });
  }, []);

  useEffect(() => {
    const socket = createMirrorSocket();

    socket.on("bootstrap", (payload) => {
      const normalizedImages = payload.images.map(normalizeImage);
      setImages(normalizedImages);
      setControls(payload.controls);
      setPresets(payload.presets);
      setSelectedImageId((current) => current ?? normalizedImages[0]?.id ?? null);
      setMessage("Live");
    });

    socket.on("image:ingested", ({ image }) => {
      setImages((current) => upsertImage(current, image));
      setSelectedImageId((current) => current ?? image.id);
      setMessage("New image ingested");
    });

    socket.on("image:processing", ({ image }) => {
      setImages((current) => upsertImage(current, image));
      setMessage("Processing update");
    });

    socket.on("image:processed", ({ image }) => {
      setImages((current) => upsertImage(current, image));
      setMessage(image.status === "done" ? "Processing complete" : "Processing failed");
    });

    socket.on("controls:updated", ({ controls: incomingControls }) => {
      setControls(incomingControls);
      setMessage("Controls synced");
    });

    socket.on("preset:updated", ({ preset }) => {
      setPresets((current) =>
        current.map((candidate) => (candidate.id === preset.id ? preset : candidate)),
      );
      setMessage("Preset updated");
    });

    socket.on("categories:updated", ({ categories: incomingCategories }) => {
      setCategories(incomingCategories);
      setBatchCategoryId((current) => current || incomingCategories[0]?.id || "");
    });

    socket.on("connect_error", () => {
      setMessage("Realtime unavailable, polling API only");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredImages = useMemo(
    () =>
      images.filter((image) =>
        selectedCategory === "all" ? true : image.categoryId === selectedCategory,
      ),
    [images, selectedCategory],
  );

  const selectedImage = useMemo(
    () => filteredImages.find((image) => image.id === selectedImageId) ?? filteredImages[0] ?? null,
    [filteredImages, selectedImageId],
  );

  useEffect(() => {
    if (selectedImage && selectedImage.id !== selectedImageId) {
      setSelectedImageId(selectedImage.id);
    }
  }, [selectedImage, selectedImageId]);

  const processingCount = images.filter((image) => image.status === "processing").length;
  const doneCount = images.filter((image) => image.status === "done").length;

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedBatchIds(new Set());
  };

  const handlePresetChange = async (presetId: string) => {
    if (!controls) {
      return;
    }
    setControls({ ...controls, activePresetId: presetId });
    try {
      await api.updateControls({ activePresetId: presetId });
      setMessage("Preset changed");
    } catch (error) {
      setMessage(`Preset update failed: ${(error as Error).message}`);
    }
  };

  const handleRetouchChange = (value: number) => {
    if (!controls) {
      return;
    }
    setControls({ ...controls, retouchIntensity: value });
    void (async () => {
      try {
        await api.updateControls({ retouchIntensity: Number(value.toFixed(2)) });
        setMessage("Retouch intensity updated");
      } catch (error) {
        setMessage(`Retouch update failed: ${(error as Error).message}`);
      }
    })();
  };

  const handleToggleSelect = (imageId: string, selected: boolean) => {
    setSelectedBatchIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(imageId);
      } else {
        next.delete(imageId);
      }
      return next;
    });
  };

  const handleBatchApply = async () => {
    if (!controls || selectedBatchIds.size === 0) {
      return;
    }
    try {
      const selectedIds = Array.from(selectedBatchIds);
      const response = await api.batchApply({
        imageIds: selectedIds,
        presetId: controls.activePresetId,
        retouchIntensity: controls.retouchIntensity,
      });
      setMessage(`Queued ${response.queued} images`);
      setSelectedBatchIds(new Set());
    } catch (error) {
      setMessage(`Batch apply failed: ${(error as Error).message}`);
    }
  };

  const handleBatchMoveCategory = async () => {
    if (selectedBatchIds.size === 0 || !batchCategoryId) {
      return;
    }
    try {
      const selectedIds = Array.from(selectedBatchIds);
      const response = await api.batchCategory({
        imageIds: selectedIds,
        categoryId: batchCategoryId,
      });
      setCategories(response.categories);
      setMessage(`Moved ${response.updated} images to ${response.categoryId}`);
      setSelectedBatchIds(new Set());
      const refreshed = await api.getImages(selectedCategory);
      setImages(refreshed.images.map(normalizeImage));
    } catch (error) {
      setMessage(`Category move failed: ${(error as Error).message}`);
    }
  };

  return (
    <main className="min-h-screen bg-mirror px-3 py-3 text-zinc-200 md:px-6 md:py-5">
      <TopBar processingCount={processingCount} doneCount={doneCount} />

      <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-zinc-400">
        Status: {message}
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[310px_1fr_340px]">
        <LiveFeedList
          images={filteredImages}
          selectedImageId={selectedImage?.id ?? null}
          onSelectImage={setSelectedImageId}
        />
        <BeforeAfterViewer image={selectedImage} showAfter={showAfter} onToggleAfter={setShowAfter} />
        <ControlsPanel
          controls={controls}
          presets={presets}
          categories={categories}
          selectedCategory={selectedCategory}
          batchCategoryId={batchCategoryId}
          selectedIds={selectedBatchIds}
          images={filteredImages}
          onCategoryChange={handleCategoryChange}
          onPresetChange={handlePresetChange}
          onRetouchChange={handleRetouchChange}
          onBatchCategoryChange={setBatchCategoryId}
          onToggleSelect={handleToggleSelect}
          onBatchMoveCategory={handleBatchMoveCategory}
          onBatchApply={handleBatchApply}
        />
      </section>
    </main>
  );
}

export default App;
