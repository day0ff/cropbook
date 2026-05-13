import "./BooksList.css";
import {useEffect, useState} from "react";
import type {BookSummary} from "@cropbook/shared";
import {Link} from "react-router";

const API_URL = import.meta.env.VITE_API_URL;

const BooksList = () => {
    const [books, setBooks] = useState<Array<BookSummary> | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/api/books`)
            .then((res) => res.json())
            .then((items) => setBooks(items));
    }, []);

    return books ? (
        <ol className="books-list">
            {books.map((book) => (
                <li className="book-item" key={book.name}>
                    <Link to={`book/${book.name}`} className={"book-item-link"}>
                        {book.iconUrl ? (
                            <img
                                className="book-icon"
                                src={book.iconUrl}
                                alt={`${book.name} cover`}
                            />
                        ) : null}
                        <span>{book.name}</span>
                    </Link>
                    <span className={"mask-list"}>
                        exercises: <span className={"mask-list-item"} contentEditable="true">1.2., 2.3., 4.5., 16.1., 19.1.</span>
                    </span>
                    <button className={"crop-button"}>Crop</button>
                </li>
            ))}
        </ol>
    ) : (
        <p className="loading-text">Loading...</p>
    );
};

export default BooksList;
