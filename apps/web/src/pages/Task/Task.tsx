import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { TaskType } from "@cropbook/shared/types";
import "./Task.css";

const API_URL = import.meta.env.VITE_API_URL;

const Task = () => {
  const { bookName, mask, orderNumber } = useParams();
  const [task, setTask] = useState<TaskType | null>(null);
  const [exerciseText, setExerciseText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    undefined,
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const order = Number(orderNumber ?? "0");

  const formatDateInputValue = (value?: string | Date) => {
    if (value === undefined || value === null) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value).split("T")[0];
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!bookName || !mask || !orderNumber) return;

    setLoading(true);
    setError(null);

    fetch(
      `${API_URL}/api/books/${encodeURIComponent(bookName)}/schemas/${encodeURIComponent(
        mask,
      )}/tasks/${order}`,
    )
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load task");
        }
        return res.json();
      })
      .then((data: TaskType) => {
        setTask(data);
        setExerciseText(data.exercise.join(", "));
        setIsCompleted(Boolean(data.isCompleted));
        setIsVerified(Boolean(data.isVerified));
        setDate(formatDateInputValue(data.date));
        setNotes(data.notes ?? "");
      })
      .catch((err) => setError(err.message || "Unable to fetch task"))
      .finally(() => setLoading(false));
  }, [bookName, mask, order, orderNumber]);

  useEffect(() => {
    let cancelled = false;
    if (!task) {
      setPreviewImage(undefined);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    if (!bookName || !mask) {
      setPreviewError("Missing book or mask");
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewImage(undefined);

    (async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/books/${encodeURIComponent(bookName)}/sheet/preview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mask,
              items: task.exercise,
              returnBuffer: true,
            }),
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to load preview");
        }

        const data = await response.json();
        if (cancelled) return;
        const buf = data?.buffer;
        if (!buf) {
          setPreviewError("No preview returned");
        } else {
          setPreviewImage(`data:image/png;base64,${buf}`);
        }
      } catch (err) {
        if (cancelled) return;
        setPreviewError((err as Error).message || "Unable to fetch preview");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [task, bookName, mask]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookName || !mask || !orderNumber) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/books/${encodeURIComponent(bookName)}/schemas/${encodeURIComponent(
          mask,
        )}/tasks/${order}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exercise: exerciseText
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            isCompleted,
            isVerified,
            date: date || undefined,
            notes: notes || undefined,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Unable to save task");
      }

      const updatedTask = (await response.json()) as TaskType;
      setTask(updatedTask);
      setExerciseText(updatedTask.exercise.join(", "));
      setIsCompleted(Boolean(updatedTask.isCompleted));
      setIsVerified(Boolean(updatedTask.isVerified));
      setDate(formatDateInputValue(updatedTask.date));
      setNotes(updatedTask.notes ?? "");
    } catch (err) {
      setError((err as Error).message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const backLink =
    bookName && mask
      ? `/book/${encodeURIComponent(bookName)}/${encodeURIComponent(mask)}/tasks`
      : "/";

  return (
    <div className="task-page">
      <header className="task-header">
        <div>
          <h1>Task {orderNumber}</h1>
          <p>
            Book: <strong>{bookName}</strong> • Mask: <strong>{mask}</strong>
          </p>
        </div>
        <Link className="book-button" to={backLink}>
          Back to Tasks
        </Link>
      </header>

      {loading ? <div className="task-loading">Loading task...</div> : null}
      {error ? <div className="task-error">{error}</div> : null}

      {task ? (
        <div className="task-edit-grid">
          <form className="task-form" onSubmit={handleSubmit}>
            <label>
              Order Number
              <input type="text" value={String(task.orderNumber)} disabled />
            </label>
            <label>
              Exercises
              <input
                type="text"
                value={exerciseText}
                onChange={(event) => setExerciseText(event.target.value)}
                placeholder="2.2., 3.2."
              />
            </label>
            <label className="checkbox-field">
              <span>
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(event) => setIsCompleted(event.target.checked)}
                />
                Completed
              </span>
            </label>
            <label className="checkbox-field">
              <span>
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(event) => setIsVerified(event.target.checked)}
                />
                Verified
              </span>
            </label>
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                placeholder="YYYY/MM/DD"
              />
            </label>
            <label>
              Notes
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <div className="task-form-actions">
              <button className="book-button" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Task"}
              </button>
              <button
                className="delete-button"
                type="button"
                disabled={deleting}
                onClick={async () => {
                  if (!bookName || !mask || !orderNumber) return;
                  const confirmed = window.confirm(
                    "Delete this task? This cannot be undone.",
                  );
                  if (!confirmed) return;
                  setDeleting(true);
                  setError(null);
                  try {
                    const response = await fetch(
                      `${API_URL}/api/books/${encodeURIComponent(
                        bookName,
                      )}/schemas/${encodeURIComponent(mask)}/tasks/${order}`,
                      { method: "DELETE" },
                    );
                    if (!response.ok) {
                      const text = await response.text();
                      throw new Error(text || "Unable to delete task");
                    }
                    navigate(backLink);
                  } catch (err) {
                    setError((err as Error).message || "Failed to delete task");
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </form>

          <section className="task-preview">
            <h2>Sheet preview</h2>
            {previewLoading ? (
              <div className="task-loading">Loading preview...</div>
            ) : previewError ? (
              <div className="task-error">{previewError}</div>
            ) : previewImage ? (
              <div className="sheet-preview-image">
                <img
                  src={previewImage}
                  alt={`Task ${task.orderNumber} preview`}
                />
              </div>
            ) : (
              <div className="book-crop-preview-empty">
                The preview sheet will appear here after the task is loaded.
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default Task;
