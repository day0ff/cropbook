import {type FC, useEffect, useState} from "react";
import {Link} from "react-router";
import "./BookPages.css";
import type {BookDetail} from "@cropbook/shared/types";

const API_URL = import.meta.env.VITE_API_URL;

const BookPages: FC<{ bookName?: string; }> = ({bookName,}) => {
    const [inputValue, setInputValue] = useState("1");
    const [book, setBook] = useState<BookDetail>();
    const pageCount = book?.pageCount ?? 1;

    useEffect(() => {
        if (!bookName) return;

        fetch(`${API_URL}/api/books/${bookName}`)
            .then((res) => res.json())
            .then((items) => setBook(items));
    }, [bookName]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="book-pages">
            <input
                type="number"
                min="1"
                max={pageCount}
                value={inputValue}
                onChange={handleInputChange}
                className="page-input"
            />
            <span className="page-info">of {pageCount}</span>
            <Link className="book-button" to={`page/${inputValue}`}>Go to</Link>
        </div>
    );
};

export default BookPages;
