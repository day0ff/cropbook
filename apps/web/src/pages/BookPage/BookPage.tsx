import {useEffect, useMemo, useState, type FormEvent} from "react";
import {Link, useParams} from "react-router";
import type {MetaDataType, PageMetadataItem, PageMetadataResponse, RawMetaDataType} from "@cropbook/shared/types";
import {A4_HEIGHT, A4_WIDTH} from "@cropbook/shared/constants";
import "./BookPage.css";
import BookPagesPagination from "../../components/BookPagesPagination";

const API_URL = import.meta.env.VITE_API_URL;

const BookPage = () => {
    const {bookName, pageNumber} = useParams();
    const [metadata, setMetadata] = useState<PageMetadataResponse | null>(null);
    const [pageMetadata, setPageMetadata] = useState<Array<PageMetadataItem>>([]);
    const [selectedMask, setSelectedMask] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sheetRefresh, setSheetRefresh] = useState(Date.now());
    const [error, setError] = useState<string | null>(null);

    const page = Number(pageNumber ?? 0);

    useEffect(() => {
        if (!bookName || !pageNumber) return;

        setLoading(true);
        setError(null);

        fetch(
            `${API_URL}/api/books/${encodeURIComponent(bookName)}/pages/${page}/metadata`,
        )
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to load metadata");
                }
                return res.json();
            })
            .then((data: PageMetadataResponse) => {
                setMetadata(data);
                setSelectedMask((current) => current || data.masks[0] || "");
            })
            .catch((err) => setError(err.message || "Unable to fetch page metadata"))
            .finally(() => setLoading(false));
    }, [bookName, pageNumber]);

    useEffect(() => {
        if (!metadata || !selectedMask) {
            setPageMetadata([]);
            return;
        }

        setPageMetadata(
            metadata.metadataByMask[selectedMask]?.map((item) => ({...item})) ?? [],
        );
    }, [metadata, selectedMask]);

    const sheetUrl = useMemo(() => {
        if (!bookName || !pageNumber || !selectedMask) return undefined;
        return `${API_URL}/api/books/${encodeURIComponent(bookName)}/pages/${page}/sheet?mask=${encodeURIComponent(
            selectedMask,
        )}&v=${sheetRefresh}`;
    }, [bookName, pageNumber, selectedMask, sheetRefresh]);

    const handleFieldChange = (
        index: number,
        field: keyof MetaDataType,
        value: string,
    ) => {
        setPageMetadata((items) =>
            items.map((item, idx) =>
                idx !== index
                    ? item
                    : {
                        ...item,
                        value: {
                            ...item.value,
                            [field]: Number(value),
                        },
                    },
            ),
        );
    };

    const handleAdditionalFieldChange = (
        index: number,
        field: keyof RawMetaDataType,
        value: string,
    ) => {
        setPageMetadata((items) =>
            items.map((item, idx) =>
                idx !== index
                    ? item
                    : {
                        ...item,
                        value: {
                            ...item.value,
                            additional: {
                                ...(item.value.additional ?? {
                                    page: item.value.page ?? page,
                                    top: 0,
                                    left: 0,
                                    right: A4_WIDTH,
                                    bottom: A4_HEIGHT,
                                }),
                                [field]: Number(value),
                            },
                        },
                    },
            ),
        );
    };

    const addAdditional = (index: number) => {
        setPageMetadata((items) =>
            items.map((item, idx) =>
                idx !== index
                    ? item
                    : {
                        ...item,
                        value: {
                            ...item.value,
                            additional: {
                                page: item.value.page ?? page,
                                top: 0,
                                left: 0,
                                right: A4_WIDTH,
                                bottom: A4_HEIGHT,
                            },
                        },
                    },
            ),
        );
    };

    const deleteAdditional = (index: number) => {
        setPageMetadata((items) =>
            items.map((item, idx) => {
                if (idx !== index) return item;

                delete item.value.additional;

                return item;
            }),
        );
    };

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!bookName || !pageNumber || !selectedMask) return;

        setSaving(true);
        setError(null);

        try {
            await Promise.all(
                pageMetadata.map((item) =>
                    fetch(
                        `${API_URL}/api/books/${encodeURIComponent(bookName)}/pages/${page}/metadata`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                mask: selectedMask,
                                key: item.key,
                                metadata: item.value,
                            }),
                        },
                    ).then((res) => {
                        if (!res.ok) {
                            return res.text().then((text) => {
                                throw new Error(text || "Unable to save metadata");
                            });
                        }
                    }),
                ),
            );
            setSheetRefresh(Date.now());
            setError(null);
        } catch (err) {
            setError((err as Error).message || "Failed to save metadata");
        } finally {
            setSaving(false);
        }
    };

    const metadataList = pageMetadata.length ? (
        pageMetadata.map((item, index) => (
            <div className={`metadata-item ${item.value.additional && 'has-extra'}`} key={`${item.key}-${index}`}>
                <div className="metadata-item-key">{item.key}</div>
                {!item.value.additional && (
                    <button
                        type="button"
                        className="additional book-button"
                        onClick={() => addAdditional(index)}
                    >
                        Add
                    </button>
                )}
                <label className="metadata-item-top">
                    <span>Top: <span className="min-max">{0}</span></span>
                    <input
                        type="number"
                        min={0}
                        max={A4_HEIGHT - 1}
                        value={item.value.top}
                        onChange={(event) =>
                            handleFieldChange(index, "top", event.target.value)
                        }
                    />
                </label>
                <label className="metadata-item-left">
                    <span>Left: <span className="min-max">{0}</span></span>
                    <input
                        type="number"
                        min={0}
                        max={A4_WIDTH - 1}
                        value={item.value.left}
                        onChange={(event) =>
                            handleFieldChange(index, "left", event.target.value)
                        }
                    />
                </label>
                <label className="metadata-item-right">
                    <span>Right: <span className="min-max">{A4_WIDTH}</span></span>
                    <input
                        type="number"
                        min={1}
                        max={A4_WIDTH}
                        value={item.value.right}
                        onChange={(event) =>
                            handleFieldChange(index, "right", event.target.value)
                        }
                    />
                </label>
                <label className="metadata-item-bottom">
                    <span>Bottom: <span className="min-max">{A4_HEIGHT}</span></span>
                    <input
                        type="number"
                        min={1}
                        max={A4_HEIGHT}
                        value={item.value.bottom}
                        onChange={(event) =>
                            handleFieldChange(index, "bottom", event.target.value)
                        }
                    />
                </label>
                {item.value.additional && (
                    <>
                        <label className="metadata-additional-item-page"><span>Page: <span className="min-max">{0}</span></span>
                            <input
                                type="number"
                                value={item.value.additional.page}
                                onChange={(event) =>
                                    handleAdditionalFieldChange(index, "page", event.target.value)
                                }
                            />
                        </label>
                        <button
                            type="button"
                            className="additional-delete book-button"
                            onClick={() => deleteAdditional(index)}
                        >
                            Delete
                        </button>
                        <label className="metadata-additional-item-top"><span>Top: <span className="min-max">{0}</span></span>
                            <input
                                type="number"
                                min={0}
                                max={A4_HEIGHT - 1}
                                value={item.value.additional.top}
                                onChange={(event) =>
                                    handleAdditionalFieldChange(index, "top", event.target.value)
                                }
                            />
                        </label>
                        <label className="metadata-additional-item-left">
                            <span>Left: <span className="min-max">{0}</span></span>
                            <input
                                type="number"
                                min={0}
                                max={A4_WIDTH - 1}
                                value={item.value.additional.left}
                                onChange={(event) =>
                                    handleAdditionalFieldChange(index, "left", event.target.value)
                                }
                            />
                        </label>
                        <label className="metadata-additional-item-right">
                            <span>Right: <span className="min-max">{A4_WIDTH}</span></span>
                            <input
                                type="number"
                                min={1}
                                max={A4_WIDTH}
                                value={item.value.additional.right}
                                onChange={(event) =>
                                    handleAdditionalFieldChange(
                                        index,
                                        "right",
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                        <label className="metadata-additional-item-bottom">
                            <span>Bottom: <span className="min-max">{A4_HEIGHT}</span></span>
                            <input
                                type="number"
                                min={1}
                                max={A4_HEIGHT}
                                value={item.value.additional.bottom}
                                onChange={(event) =>
                                    handleAdditionalFieldChange(
                                        index,
                                        "bottom",
                                        event.target.value,
                                    )
                                }
                            />
                        </label>
                    </>
                )}
            </div>
        ))
    ) : (
        <p className="small-note">
            No metadata entries found for this page and mask.
        </p>
    );

    return (
        <div className="page-detail-page">
            <div className="page-detail-header">
                <div>
                    <h1>Book page editor</h1>
                    <p className="small-note">
                        Page {pageNumber} for <strong>{bookName}</strong>
                    </p>
                </div>
                <Link
                    className="book-button"
                    to={`/${bookName ? `book/${encodeURIComponent(bookName)}` : ""}`}
                >
                    Back
                </Link>
            </div>
            <div className="page-detail-grid">
                <div className="page-image-card">
                    <h3>Original page</h3>
                    <img
                        src={`${API_URL}/api/books/${encodeURIComponent(bookName || "")}/pages/${page}`}
                        alt={`Page ${page} of ${bookName}`}
                    />
                </div>

                <div className="page-image-card">
                    <h3>Combined sheet for mask</h3>
                    {selectedMask ? (
                        <img src={sheetUrl} alt={`Sheet preview for page ${page}`}/>
                    ) : (
                        <p className="small-note">
                            Select a mask to render a combined sheet.
                        </p>
                    )}
                </div>
            </div>
            <BookPagesPagination bookName={bookName}/>
            <div className="page-metadata-panel">
                <form onSubmit={handleSave}>
                    <div className="mask-selector">
                        <label htmlFor="mask">Mask</label>
                        <select
                            name="mask"
                            value={selectedMask}
                            onChange={(event) => setSelectedMask(event.target.value)}
                            disabled={loading || !metadata?.masks.length}
                        >
                            {metadata?.masks.map((mask) => (
                                <option key={mask} value={mask}>
                                    {mask}
                                </option>
                            ))}
                        </select>
                        <button
                            className="book-button"
                            type="submit"
                            disabled={
                                saving || loading || !selectedMask || !pageMetadata.length
                            }
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>

                    {error ? <p className="page-error">{error}</p> : null}

                    {loading ? (
                        <p className="small-note">Loading metadata…</p>
                    ) : (
                        <div className="metadata-grid">{metadataList}</div>
                    )}

                    <div className="page-action-row">
            <span className="small-note">
              Updates page metadata and refreshes the generated sheet.
            </span>
                        <button
                            className="book-button"
                            type="submit"
                            disabled={
                                saving || loading || !selectedMask || !pageMetadata.length
                            }
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookPage;
