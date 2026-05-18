import { type FC, useEffect, useMemo, useState } from "react";
import type { ProcessingType } from "@cropbook/shared/types";
import "./BookCrop.css";
import BookPages from "../BookPages";

const API_URL = import.meta.env.VITE_API_URL;

const ensurePngExtension = (filename: string) => {
  const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

  const lowerFilename = filename.toLowerCase();

  const hasExtension = extensions.some((ext) => lowerFilename.endsWith(ext));

  return hasExtension ? filename : `${filename}.png`;
};

interface SheetPreviewResponse {
  pages: number[];
  buffer?: string;
}

const BookCrop: FC<{
  bookName?: string;
  initialMask?: string;
  initialItems?: string[];
}> = ({ bookName, initialMask, initialItems }) => {
  const [processing, setProcessing] = useState<ProcessingType<any>>();
  const [masks, setMasks] = useState<Array<string>>();
  const [previewPages, setPreviewPages] = useState<number[]>([]);
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  const [sheetBase64, setSheetBase64] = useState<string | undefined>();
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [selectedMask, setSelectedMask] = useState<string>(initialMask ?? "");
  const [itemsText, setItemsText] = useState<string>(
    initialItems?.join(", ") ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const previewImageUrl = useMemo(() => {
    return sheetBase64 ? `data:image/png;base64,${sheetBase64}` : undefined;
  }, [sheetBase64]);

  const pageImageUrls = useMemo(() => {
    if (!bookName) return [];
    return previewPages.map((page) => ({
      page,
      url: `${API_URL}/api/books/${encodeURIComponent(bookName)}/pages/${page}`,
    }));
  }, [bookName, previewPages]);

  const selectedPageUrl = useMemo(() => {
    return pageImageUrls.find((page) => page.page === selectedPage)?.url;
  }, [pageImageUrls, selectedPage]);

  const handleCropSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);

    const items = itemsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!bookName || !selectedMask || !items.length) {
      setError("Book name, mask, and at least one exercise item are required.");
      return;
    }

    setProcessing({
      type: "progress",
      data: {
        current: 0,
        total: Infinity,
      },
    });

    try {
      const response = await fetch(
        `${API_URL}/api/books/${encodeURIComponent(bookName)}/sheet/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mask: selectedMask,
            items,
            returnBuffer: true,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to preview sheet.");
      }

      const data = (await response.json()) as SheetPreviewResponse;
      setPreviewPages(data.pages ?? []);
      setSelectedPage(data.pages?.[0] ?? null);
      setSheetBase64(data.buffer);
      setPreviewItems(items);
    } catch (err) {
      setError((err as Error).message || "Unable to load sheet preview.");
      setPreviewPages([]);
      setPreviewItems([]);
      setSelectedPage(null);
      setSheetBase64(undefined);
    } finally {
      setProcessing({ type: "completed", data: null });
    }
  };

  const handleSelectPage = (direction: number) => {
    if (!previewPages.length || selectedPage === null) return;
    const currentIndex = previewPages.indexOf(selectedPage);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= previewPages.length) return;
    setSelectedPage(previewPages[nextIndex]);
  };

  const handleDownloadSheet = async () => {
    if (!bookName || !previewPages.length || !previewItems.length) return;

    const response = await fetch(
      `${API_URL}/api/books/${encodeURIComponent(bookName)}/sheet/download`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mask: selectedMask,
          items: previewItems,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      setError(text || "Failed to download sheet.");
      return;
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = ensurePngExtension("sheet.png");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  };

  useEffect(() => {
    if (!bookName) return;

    fetch(`${API_URL}/api/books/${encodeURIComponent(bookName)}`)
      .then((res) => res.json())
      .then((book) => {
        setMasks(book?.masks ?? []);
        setSelectedMask(
          (current) => current || initialMask || book?.masks?.[0] || "",
        );
        setItemsText((current) => current || initialItems?.join(", ") || "");
      });
  }, [bookName, initialMask, initialItems]);

  const isProcessing = processing?.type === "progress";

  return (
    <div className="book-crop">
      <form className="book-crop-form" onSubmit={handleCropSubmit}>
        <fieldset disabled={isProcessing}>
          <span>Exercises:</span>
          <input
            name="items"
            className="editable"
            type="text"
            value={itemsText}
            onChange={(event) => setItemsText(event.target.value)}
            placeholder="2.2., 3.2."
          />
          <select
            name="mask"
            value={selectedMask}
            className="editable"
            onChange={(event) => setSelectedMask(event.target.value)}
          >
            {masks?.map((mask) => (
              <option key={mask} value={mask}>
                {mask}
              </option>
            ))}
          </select>
          <button
            className="book-button"
            type="submit"
            disabled={isProcessing || !bookName}
          >
            {isProcessing ? "Loading preview..." : "Preview"}
          </button>
        </fieldset>
      </form>
      <hr />
      <div className="sheet-preview-actions">
        <span>Sheet preview:</span>
        <span>
          {previewPages.length
            ? `${selectedMask}`
            : "Preview the combined sheet to see results."}
        </span>
        <button
          className="book-button"
          type="button"
          disabled={!previewPages.length}
          onClick={handleDownloadSheet}
        >
          Download
        </button>
      </div>
      <div className="book-crop-grid">
        <div className="page-carousel">
          <div className="page-carousel-main">
            {selectedPageUrl ? (
              <>
                <button
                  type="button"
                  className="carousel-control prev"
                  onClick={() => handleSelectPage(-1)}
                  disabled={previewPages.indexOf(selectedPage ?? 0) <= 0}
                >
                  ‹
                </button>
                <div className="page-carousel-selected">
                  <img
                    src={selectedPageUrl}
                    alt={`Selected page ${selectedPage}`}
                  />
                </div>
                <button
                  type="button"
                  className="carousel-control next"
                  onClick={() => handleSelectPage(1)}
                  disabled={
                    previewPages.indexOf(selectedPage ?? 0) >=
                    previewPages.length - 1
                  }
                >
                  ›
                </button>
              </>
            ) : (
              <div className="book-crop-preview-empty">
                Select a page to preview it here.
              </div>
            )}
          </div>
          <div className="page-carousel-list">
            {pageImageUrls.length > 0 ? (
              pageImageUrls.map((pageItem) => (
                <button
                  key={pageItem.page}
                  type="button"
                  className={`page-carousel-item ${pageItem.page === selectedPage ? "active" : ""}`}
                  onClick={() => setSelectedPage(pageItem.page)}
                >
                  <img src={pageItem.url} alt={`Page ${pageItem.page}`} />
                  <label>Page {pageItem.page}</label>
                </button>
              ))
            ) : (
              <div className="book-crop-preview-empty">
                Run preview to load page thumbnails.
              </div>
            )}
          </div>
        </div>

        <div className="sheet-preview-panel">
          <div className="sheet-preview-image">
            {previewImageUrl ? (
              <img src={previewImageUrl} alt="Sheet preview" />
            ) : (
              <div className="book-crop-preview-empty">
                The preview sheet will appear here after you submit.
              </div>
            )}
          </div>

          {error ? <p className="book-crop-error">{error}</p> : null}
        </div>
      </div>
      <BookPages bookName={bookName} page={String(selectedPage)} />
    </div>
  );
};

export default BookCrop;
