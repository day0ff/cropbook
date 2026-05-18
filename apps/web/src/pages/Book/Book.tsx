import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { BookDetail } from "@cropbook/shared/types";
import "./Book.css";
import BookMasks from "../../components/BookMasks";
import BookCrop from "../../components/BookCrop";

const API_URL = import.meta.env.VITE_API_URL;

const Book = () => {
  const { bookName } = useParams();
  const [book, setBook] = useState<BookDetail>();

  useEffect(() => {
    if (!bookName) return;

    fetch(`${API_URL}/api/books/${bookName}`)
      .then((res) => res.json())
      .then((items) => setBook(items));
  }, [bookName]);

  return (
    <div className="book-container">
      <div className="book-header-row">
        <h1>
          {book && (
            <img
              src={`${API_URL}/api${book.iconUrl}`}
              alt={`${book.bookName} cover`}
            />
          )}
          {bookName}
        </h1>
        {bookName ? (
          <Link
            className="book-button"
            to={`/book/${encodeURIComponent(bookName)}/tasks`}
          >
            Tasks
          </Link>
        ) : null}
      </div>
      <BookCrop bookName={bookName} />
      <BookMasks bookName={bookName} />
    </div>
  );
};

export default Book;
