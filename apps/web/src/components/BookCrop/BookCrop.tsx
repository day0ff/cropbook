import {type FC, useEffect, useState} from "react";
import type {ProcessingType} from "@cropbook/shared/types";

const API_URL = import.meta.env.VITE_API_URL;

const ensurePngExtension = (filename: string) => {
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

    const lowerFilename = filename.toLowerCase();

    const hasExtension = extensions.some(ext => lowerFilename.endsWith(ext));

    return hasExtension ? filename : `${filename}.png`;
}

const BookCrop: FC<{ bookName?: string; }> = ({bookName}) => {
    const [processing, setProcessing] = useState<ProcessingType<any>>();
    const [masks, setMasks] = useState<Array<string>>();

    const handleCropSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const outputFileName = ensurePngExtension(formData.get('outputFileName')?.toString() ?? 'sheet.png');
        const items = formData.get('items')?.toString().split(',').map(item=>item.trim()) ?? '';
        const mask = formData.get('mask');

        setProcessing({
            type: 'progress',
            data: {
                current: 0,
                total: Infinity
            }
        });

        await fetch(`${API_URL}/api/books/${bookName}/sheet/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                outputFileName,
                items,
                mask
            }),
        })
            .then(response => response.blob())
            .then(blob => {
                setProcessing({type: 'completed', data: null})

                if (!blob) return;

                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');

                link.href = downloadUrl;
                link.download = outputFileName || 'image.png';
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
            });
    }

    useEffect(() => {
        if (!bookName) return;

        fetch(`${API_URL}/api/books/${bookName}`)
            .then((res) => res.json())
            .then((book) => setMasks(book?.masks));
    }, [bookName])

    const isProcessing = processing?.type === 'progress';

    return (
        <form onSubmit={handleCropSubmit}>
            <fieldset disabled={isProcessing}>
                <span>Exercises:</span>
                <input name="items" className="editable" type="text" defaultValue="" placeholder="2.2., 3.2."/>
                <select name="mask" className="editable">
                    {masks?.map(mask=> <option key={mask} value={mask}>{mask}</option>)}
                </select>
                <input name="outputFileName" className="editable" type="text" defaultValue="sheet.png" placeholder="file name"/>
                <button className={"book-button"} type="submit"
                        disabled={isProcessing && !bookName}>{isProcessing ? 'Processing' : 'Crop'}</button>
            </fieldset>
        </form>
    );
}

export default BookCrop;
