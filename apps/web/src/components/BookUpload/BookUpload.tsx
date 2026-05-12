import { useState } from "react";
import type { BookDetail } from "@cropbook/shared";
import "./BookUpload.css";

const API_URL = import.meta.env.VITE_API_URL;

interface UploadState {
  file: File | null;
  loading: boolean;
  error: string | null;
  success: BookDetail | null;
}

export function BookUpload() {
  const [state, setState] = useState<UploadState>({
    file: null,
    loading: false,
    error: null,
    success: null,
  });

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
    }));

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("name", extractBookName(state.file.name));

      const response = await fetch(`${API_URL}/api/books/upload`, {
        method: "POST",
        body: formData,
      });

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
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An error occurred",
        loading: false,
      }));
    }
  };

  const handleReset = () => {
    setState({
      file: null,
      loading: false,
      error: null,
      success: null,
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
                  {state.loading ? "Uploading..." : "Upload"}
                </button>
                <button
                  className="cancel-button"
                  onClick={() =>
                    setState((prev) => ({ ...prev, file: null, error: null }))
                  }
                  disabled={state.loading}
                >
                  Cancel
                </button>
              </div>
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
