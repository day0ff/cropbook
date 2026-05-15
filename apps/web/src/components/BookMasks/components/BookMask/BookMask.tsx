import {type FC, useEffect, useRef, useState} from "react";
import type {ProcessingType} from "@cropbook/shared/types";

const API_URL = import.meta.env.VITE_API_URL;

const BookMask: FC<{ bookName: string, pageCount: number, mask?: string }> = (
    {
        bookName,
        pageCount,
        mask
    }
) => {
    const eventSourceRef = useRef<EventSource | null>(null);
    const [processing, setProcessing] = useState<ProcessingType<any>>();

    const handleMaskSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const pages = formData.get('pages')?.toString() ?? '';
        const anchor = formData.get('anchor')?.toString() ?? '';

        setProcessing({
            type: 'progress',
            data: {
                current: 0,
                total: Infinity
            }
        });

        fetch(`${API_URL}/api/books/${bookName}/ocr/metadata`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({anchor, pages}),
        });

        const es = new EventSource(
            `${API_URL}/api/books/${bookName}/ocr/events`,
        );

        eventSourceRef.current = es;

        es.onmessage = (event) => {
            const msg: ProcessingType<any> = JSON.parse(event.data);

            setProcessing(msg);

            if (msg.type === 'completed') {
                es.close();
            }
        };

        es.onerror = () => {
            es.close();
            setProcessing({
                type: 'completed',
                data: {}
            });
        };
    }

    useEffect(() => {
        return () => {
            eventSourceRef.current?.close();
        };
    }, []);

    const isProcessing = processing?.type === 'progress';
    const processingProgress = Math.round(100 * (Math.max(0, (processing?.data.current ?? 0) - 1)) / (processing?.data.total ?? 100));
    const barProgress = Math.round(100 * (processing?.data.current ?? 0) / (processing?.data.total ?? 100));

    return (
        <form onSubmit={handleMaskSubmit}>
            <fieldset disabled={isProcessing}>
                <span>Mask:</span>
                <input name="anchor" className="editable" type="text" defaultValue={mask || '\\d+\\.\\d+\\.'}
                                                          placeholder="define new mask"/>
                <label htmlFor="pages">pages:</label>
                <input name="pages" className="editable" type="text" defaultValue={`1-${pageCount}`}
                       placeholder="pages"/>

                <button className={"book-button"} type="submit"
                        disabled={isProcessing && !bookName}>{isProcessing ? 'Processing' : 'Mask'}</button>
            </fieldset>
            {isProcessing && (
                <div className="book-progress-container">
                    <div className="book-progress-bar">
                        <div
                            className="book-progress-fill"
                            style={{width: `${barProgress}%`}}
                        />
                    </div>
                    <p className="book-progress-text">
                        Processing page {processing?.data.current ?? 0} of{" "}
                        {processing?.data.total || "..."}
                    </p>
                    <p className="book-progress-text">
                        Processing progress: {processingProgress}%
                    </p>
                </div>
            )}
        </form>

    );
}

export default BookMask;
