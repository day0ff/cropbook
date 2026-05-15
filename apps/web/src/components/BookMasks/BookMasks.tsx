import {type FC, useEffect, useState} from "react";
import type {BookDetail} from "@cropbook/shared/types";
import BookMask from "./components/BookMask";
import "./BookMasks.css";

const API_URL = import.meta.env.VITE_API_URL;

const BookMasks: FC<{ bookName: string | undefined }> = ({bookName = ''}) => {
    const [book, setBook] = useState<BookDetail>();

    const handleAddNewMask = () => {
        setBook(currentBook => ({
            ...(currentBook ??  {
                bookName: '',
                pageCount: 2,
                pages: [],
            }),
            masks: [...(currentBook?.masks ?? ['\\d+\\.\\d+\\.']), '']
        }))
    }

    useEffect(() => {
        if (!bookName) return;

        fetch(`${API_URL}/api/books/${bookName}`)
            .then((res) => res.json())
            .then((newBook) => setBook(newBook));
    }, [bookName])

    return (
        <div className="book-masks">
            <hr/>
            <h2><span>Masks:</span>
                <button className="book-button" onClick={handleAddNewMask}>Add Mask</button>
            </h2>
            {book?.masks ? (
                book.masks.map(mask => (<BookMask key={mask} bookName={book.bookName} pageCount={book.pageCount} mask={mask}/>))
            ) : (
                <BookMask bookName={bookName} pageCount={100} mask={'\\d+\\.\\d+\\.'}/>
            )}
            <hr/>
        </div>
    );
}

export default BookMasks;
