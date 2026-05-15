import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type { BookDetail } from "@cropbook/shared";
import "./Book.css";
import BookMasks from "../../components/BookMasks";
import BookCrop from "../../components/BookCrop";
import BookPages from "../../components/BookPages";

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
      <h1>
        {book && (
          <img
            src={`${API_URL}/api${book.iconUrl}`}
            alt={`${book.bookName} cover`}
          />
        )}
        {bookName}
      </h1>
      <BookCrop bookName={bookName} />
      <BookMasks bookName={bookName} />
      <BookPages bookName={book?.bookName} />
    </div>
  );
};

export default Book;
