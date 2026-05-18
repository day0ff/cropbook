import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { BookDetail, TaskType } from "@cropbook/shared/types";
import "./BookTasks.css";

const formatDateString = (value?: string | Date) => {
  if (value === undefined || value === null) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const raw = String(value).split("T")[0];
    return raw.replace(/-/g, "/");
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const API_URL = import.meta.env.VITE_API_URL;

const BookTasks = () => {
  const { bookName, mask } = useParams();
  const [masks, setMasks] = useState<string[]>([]);
  const [activeMask, setActiveMask] = useState<string>(mask ?? "");
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [previewTask, setPreviewTask] = useState<TaskType | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    undefined,
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState("");
  const [newIsCompleted, setNewIsCompleted] = useState(false);
  const [newIsVerified, setNewIsVerified] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    if (!bookName) return;

    fetch(`${API_URL}/api/books/${encodeURIComponent(bookName)}`)
      .then((res) => res.json())
      .then((book: BookDetail) => {
        const nextMasks = book?.masks ?? [];
        setMasks(nextMasks);

        if (!mask && nextMasks.length > 0) {
          navigate(
            `/book/${encodeURIComponent(bookName)}/${encodeURIComponent(
              nextMasks[0],
            )}/tasks`,
            { replace: true },
          );
          return;
        }

        setActiveMask(mask ?? nextMasks[0] ?? "");
      })
      .catch((err) => setError(err.message || "Unable to load book masks"));
  }, [bookName, mask, navigate]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookName || !activeMask) return;

    setCreateError(null);
    setCreating(true);

    try {
      const response = await fetch(
        `${API_URL}/api/books/${encodeURIComponent(bookName)}/schemas/${encodeURIComponent(
          activeMask,
        )}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exercise: newExercise
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            isCompleted: newIsCompleted,
            isVerified: newIsVerified,
            date: newDate || undefined,
            notes: newNotes || undefined,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Unable to create task");
      }

      setNewExercise("");
      setNewIsCompleted(false);
      setNewIsVerified(false);
      setNewDate("");
      setNewNotes("");
      const nextPage = Math.max(page, Math.ceil((total + 1) / limit));
      setPage(nextPage);
      setSelectedTask(null);
      await fetchTasks();
    } catch (err) {
      setCreateError((err as Error).message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const fetchTasks = async () => {
    if (!bookName || !activeMask) return;

    setLoading(true);
    setError(null);
    setSelectedTask(null);

    try {
      const response = await fetch(
        `${API_URL}/api/books/${encodeURIComponent(bookName)}/schemas/${encodeURIComponent(
          activeMask,
        )}?page=${page}&limit=${limit}`,
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load tasks");
      }
      const data = await response.json();
      setTasks(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError((err as Error).message || "Unable to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookName || !activeMask) return;

    fetchTasks();
  }, [bookName, activeMask, page]);

  useEffect(() => {
    let cancelled = false;
    if (!previewTask) {
      setPreviewImage(undefined);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    if (!bookName || !activeMask) {
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
              mask: activeMask,
              items: previewTask.exercise,
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
  }, [previewTask, bookName, activeMask]);

  return (
    <div className="book-tasks-page">
      <header className="book-tasks-header">
        <div>
          <h1>Tasks</h1>
          <p>
            Book: <strong>{bookName}</strong>
            {activeMask ? <span> • Mask: {activeMask}</span> : null}
          </p>
        </div>
        <div className="book-tasks-actions">
          <Link
            className="book-button"
            to={`/book/${encodeURIComponent(bookName ?? "")}`}
          >
            Back to Book
          </Link>
        </div>
      </header>

      <div className="book-tasks-toolbar">
        <label>
          Select mask:
          <select
            value={activeMask}
            onChange={(event) => {
              const nextMask = event.target.value;
              setPage(1);
              setSelectedTask(null);
              if (bookName) {
                navigate(
                  `/book/${encodeURIComponent(bookName)}/${encodeURIComponent(nextMask)}/tasks`,
                );
              }
            }}
          >
            {masks.map((maskOption) => (
              <option key={maskOption} value={maskOption}>
                {maskOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="book-tasks-content">
        <section className="book-tasks-list">
          <div className="tasks-heading">
            <h2>Task list</h2>
            <span>
              {total} task{total === 1 ? "" : "s"}
            </span>
          </div>

          <form className="task-create-form" onSubmit={handleCreateTask}>
            <div className="task-create-row">
              <label>
                Exercises
                <input
                  type="text"
                  value={newExercise}
                  onChange={(event) => setNewExercise(event.target.value)}
                  placeholder="2.2., 3.2."
                />
              </label>
              <label>
                Date
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                />
              </label>
            </div>
            <div className="task-create-row task-create-row--small">
              <label className="checkbox-field">
                <span>
                  <input
                    type="checkbox"
                    checked={newIsCompleted}
                    onChange={(event) =>
                      setNewIsCompleted(event.target.checked)
                    }
                  />
                  Completed
                </span>
              </label>
              <label className="checkbox-field">
                <span>
                  <input
                    type="checkbox"
                    checked={newIsVerified}
                    onChange={(event) => setNewIsVerified(event.target.checked)}
                  />
                  Verified
                </span>
              </label>
            </div>
            <label>
              Notes
              <input
                type="text"
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
                placeholder="Optional notes"
              />
            </label>
            <button
              className="book-button"
              type="submit"
              disabled={creating || !newExercise.trim()}
            >
              {creating ? "Creating…" : "Create task"}
            </button>
            {createError ? (
              <div className="tasks-error">{createError}</div>
            ) : null}
          </form>

          {error ? <div className="tasks-error">{error}</div> : null}
          {loading ? (
            <div className="tasks-loading">Loading tasks...</div>
          ) : null}

          <div className="tasks-table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Exercise</th>
                  <th>Completed</th>
                  <th>Verified</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Preview</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length ? (
                  tasks.map((task) => (
                    <tr
                      key={task.orderNumber}
                      className={
                        selectedTask?.orderNumber === task.orderNumber
                          ? "selected"
                          : ""
                      }
                      onClick={() => setSelectedTask(task)}
                    >
                      <td>{task.orderNumber}</td>
                      <td>{task.exercise.join(", ")}</td>
                      <td>{task.isCompleted ? "Yes" : "No"}</td>
                      <td>{task.isVerified ? "Yes" : "No"}</td>
                      <td>{formatDateString(task.date)}</td>
                      <td>{task.notes ?? "—"}</td>
                      <td>
                        <button
                          className="link-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTask(task);
                          }}
                        >
                          Preview
                        </button>
                      </td>
                      <td>
                        <Link
                          className="link-button"
                          to={`/book/${encodeURIComponent(bookName ?? "")}/${encodeURIComponent(
                            activeMask,
                          )}/tasks/${task.orderNumber}`}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="tasks-empty">
                      No tasks found for this mask.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tasks-pagination">
            <button
              className="book-button"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="book-button"
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
            </button>
          </div>
        </section>

        {/* Preview removed: use per-row Preview button to open modal */}
        {previewTask ? (
          <div
            className="preview-modal-overlay"
            onClick={() => setPreviewTask(null)}
          >
            <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="preview-modal-close"
                onClick={() => setPreviewTask(null)}
              >
                Close
              </button>
              {previewLoading ? (
                <div className="tasks-loading">Loading preview...</div>
              ) : previewError ? (
                <div className="tasks-error">{previewError}</div>
              ) : previewImage ? (
                <div className="sheet-preview-image">
                  <img
                    src={previewImage}
                    alt={`Task ${previewTask.orderNumber} preview`}
                  />
                </div>
              ) : (
                <div className="book-crop-preview-empty">
                  No preview available.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BookTasks;
