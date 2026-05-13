import {useEffect, useState} from "react";
import {useParams} from "react-router";
import type {BookDetail} from "@cropbook/shared";
import "./Book.css";
import BookMask from "../../components/BookMask";

const API_URL = import.meta.env.VITE_API_URL;

const Book = () => {
    const {bookName} = useParams();
    const [book, setBook] = useState<BookDetail>();

    useEffect(() => {
        fetch(`${API_URL}/api/books/${bookName}`)
            .then((res) => res.json())
            .then((items) => setBook(items));
    }, [bookName])

    return (
        <div className="book-container">
            <h1>
                {book && <img
                    src={`${API_URL}/api${book.iconUrl}`}
                    alt={`${book.bookName} cover`}
                />}
                {bookName}
            </h1>
            <BookMask bookName={bookName} />
            <form>
                <fieldset disabled={false}>
                    <label htmlFor="exercises">Exercises:</label>
                    <input name="exercises" className="editable" type="text" value={'1.1., 2.1, 6.1, 15.1, 19.1.'}
                           placeholder="enter number of exercises"/>
                    <button className={"book-button"} type="submit">Crop</button>
                </fieldset>
            </form>
        </div>
    );
}

export default Book;
