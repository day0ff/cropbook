import { useState, useRef } from "react";
import type { BookDetail } from "@cropbook/shared";
import "./BookUpload.css";

const API_URL = import.meta.env.VITE_API_URL;

interface UploadState {
  file: File | null;
  loading: boolean;
  error: string | null;
  success: BookDetail | null;
  uploadProgress: number;
  currentPage: number;
  totalPages: number;
}

export function BookUpload() {
  const [state, setState] = useState<UploadState>({
    file: null,
    loading: false,
    error: null,
    success: null,
    uploadProgress: 0,
    currentPage: 0,
    totalPages: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const extractBookName = (filename: string): string => {
    return filename.replace(/\.[^.]+$/, "");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setState((prev) => ({
          ...prev,
          file,
          error: null,
          success: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: "Only PDF files are accepted.",
        }));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setState((prev) => ({
          ...prev,
          file,
          error: null,
          success: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: "Only PDF files are accepted.",
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!state.file) return;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      uploadProgress: 0,
      currentPage: 0,
      totalPages: 0,
    }));

    const uploadName = extractBookName(state.file.name);
    const polling = { active: true };
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const pollUploadStatus = async (
      bookName: string,
      controller: { active: boolean },
    ) => {
      while (controller.active) {
        try {
          const response = await fetch(
            `${API_URL}/api/books/${encodeURIComponent(bookName)}/status`,
            { signal: abortController.signal },
          );

          if (!response.ok) break;

          const status = await response.json();
          if (!status || typeof status.currentPage !== "number") break;

          const total =
            typeof status.totalPages === "number" ? status.totalPages : 0;

          setState((prev) => {
            const progress = total
              ? Math.round((status.currentPage / total) * 100)
              : prev.uploadProgress;

            return {
              ...prev,
              uploadProgress: progress,
              currentPage: status.currentPage,
              totalPages: total,
            };
          });

          if (total > 0 && status.currentPage >= total) {
            break;
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    };

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("name", uploadName);

      const statusPromise = pollUploadStatus(uploadName, polling);

      const response = await fetch(`${API_URL}/api/books/upload`, {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      polling.active = false;
      await statusPromise;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`,
        );
      }

      const result: BookDetail = await response.json();
      setState((prev) => ({
        ...prev,
        success: result,
        file: null,
        loading: false,
        uploadProgress: 100,
        currentPage: result.pageCount,
        totalPages: result.pageCount,
      }));
    } catch (err) {
      polling.active = false;
      if (err instanceof Error && err.name === "AbortError") {
        setState((prev) => ({
          ...prev,
          error: "Upload cancelled",
          loading: false,
          uploadProgress: 0,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "An error occurred",
          loading: false,
          uploadProgress: 0,
        }));
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancel = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clean up on backend
    if (state.file) {
      const uploadName = extractBookName(state.file.name);
      try {
        await fetch(
          `${API_URL}/api/books/${encodeURIComponent(uploadName)}/abort`,
          { method: "POST" },
        );
      } catch {
        // ignore cleanup errors
      }
    }

    setState((prev) => ({
      ...prev,
      file: null,
      error: null,
      loading: false,
      uploadProgress: 0,
      currentPage: 0,
      totalPages: 0,
    }));
  };

  const handleReset = () => {
    setState({
      file: null,
      loading: false,
      error: null,
      success: null,
      uploadProgress: 0,
      currentPage: 0,
      totalPages: 0,
    });
  };

  return (
    <div className="book-upload-container">
      <h2>Upload Book</h2>

      {!state.success ? (
        <>
          <div
            className="drag-drop-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2v11M6 8l6-6 6 6M20 13v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="drag-drop-text">
              Drag and drop your PDF here or click to select
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>

          {state.file && (
            <div className="file-info">
              <div className="file-details">
                <svg className="file-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13 2v7h7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="file-name">{state.file.name}</p>
                  <p className="file-size">
                    {(state.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="book-name">
                    Book name:{" "}
                    <strong>{extractBookName(state.file.name)}</strong>
                  </p>
                </div>
              </div>
              <div className="button-group">
                <button
                  className="upload-button"
                  onClick={handleUpload}
                  disabled={state.loading}
                >
                  {state.loading ? "Processing..." : "Upload"}
                </button>
                <button
                  className="cancel-button"
                  onClick={handleCancel}
                  disabled={!state.file || state.loading === false}
                >
                  Cancel
                </button>
              </div>
              {state.loading && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${state.uploadProgress}%` }}
                    />
                  </div>
                  <p className="progress-text">
                    Processing page {state.currentPage} of{" "}
                    {state.totalPages || "..."}
                  </p>
                  <p className="progress-text">
                    Upload progress: {Math.round(state.uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {state.error && <div className="error-message">{state.error}</div>}
        </>
      ) : (
        <div className="success-message">
          <svg className="success-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3>Book Uploaded Successfully!</h3>
          <div className="success-details">
            <p>
              <strong>Book:</strong> {state.success.bookName}
            </p>
            <p>
              <strong>Pages:</strong> {state.success.pageCount}
            </p>
          </div>
          <button className="reset-button" onClick={handleReset}>
            Upload Another Book
          </button>
        </div>
      )}
    </div>
  );
}
