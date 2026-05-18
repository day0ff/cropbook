import { type FC, useEffect, useState } from "react";
import type { MetaDataType } from "@cropbook/shared/types";
import "./MaskMetadataKeys.css";

const API_URL = import.meta.env.VITE_API_URL;

type MetadataItem = {
  key: string;
  value: MetaDataType;
};

type MaskMetadataKeysProps = {
  bookName: string;
  mask: string;
};

const MaskMetadataKeys: FC<MaskMetadataKeysProps> = ({ bookName, mask }) => {
  const [items, setItems] = useState<MetadataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    if (!bookName || !mask) return;

    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(
      `${API_URL}/api/books/${encodeURIComponent(bookName)}/metadata/${encodeURIComponent(
        mask,
      )}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Unable to load metadata");
        }
        return response.json() as Promise<MetadataItem[]>;
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message || "Unable to load metadata");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookName, mask]);

  const getClassName = (value: MetaDataType) => {
    if (value.isCompleted) {
      return "mask-metadata-pill mask-metadata-pill--completed";
    }

    if (value.isVerified) {
      return "mask-metadata-pill mask-metadata-pill--verified";
    }

    return "mask-metadata-pill mask-metadata-pill--default";
  };

  return (
    <div className="mask-metadata-keys">
      <div className="mask-metadata-keys-header">
        <button
          type="button"
          className="mask-metadata-keys-toggle"
          onClick={() => setCollapsed((current) => !current)}
          aria-expanded={!collapsed}
        >
          <span>Metadata keys</span>
          <span className="mask-metadata-keys-toggle-icon">
            {collapsed ? "+" : "−"}
          </span>
        </button>
      </div>

      {!collapsed && (
        <div className="mask-metadata-keys-body">
          {loading ? (
            <div className="mask-metadata-keys-status">Loading metadata…</div>
          ) : error ? (
            <div className="mask-metadata-keys-status mask-metadata-keys-error">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="mask-metadata-keys-status">
              No metadata keys found.
            </div>
          ) : (
            <div className="mask-metadata-keys-list">
              {items.map((item) => (
                <span key={item.key} className={getClassName(item.value)}>
                  {item.key}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaskMetadataKeys;
