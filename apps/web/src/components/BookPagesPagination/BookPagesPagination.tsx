import {type FC, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router";
import "./BookPagesPagination.css";
import type {BookDetail} from "@cropbook/shared";

const API_URL = import.meta.env.VITE_API_URL;

const BookPagesPagination: FC<{ bookName?: string; }> = ({bookName,}) => {
    const navigate = useNavigate();
    const params = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [inputValue, setInputValue] = useState("1");
    const [book, setBook] = useState<BookDetail>();
    const pageCount = book?.pageCount ?? 1;

    useEffect(() => {
        if (!bookName) return;

        fetch(`${API_URL}/api/books/${bookName}`)
            .then((res) => res.json())
            .then((items) => setBook(items));
    }, [bookName]);

    useEffect(() => {
        const pageNum = params.pageNumber ? Number(params.pageNumber) : 1;
        setCurrentPage(pageNum);
        setInputValue(String(pageNum));
    }, [params.pageNumber]);

    const handleNavigate = (page: number) => {
        const validPage = Math.max(1, Math.min(page, pageCount));
        navigate(`/book/${encodeURIComponent(bookName || "")}/page/${validPage}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputSubmit = () => {
        const page = Number(inputValue);
        if (!isNaN(page) && page >= 1 && page <= pageCount) {
            handleNavigate(page);
        } else {
            setInputValue(String(currentPage));
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleInputSubmit();
        }
    };

    const renderPageButtons = () => {
        const pages = [];
        const start = Math.max(1, currentPage - 4);
        const end = Math.min(pageCount, currentPage + 4);

        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    className={`page-btn ${i === currentPage ? "active" : ""}`}
                    onClick={() => handleNavigate(i)}
                >
                    {i}
                </button>,
            );
        }

        return pages;
    };

    return (
        <div className="book-pages-pagination">
            <div className="pagination-controls">
                {pageCount > 100 && (
                    <button
                        className="page-btn jump-btn"
                        onClick={() => handleNavigate(Math.max(1, currentPage - 100))}
                        disabled={currentPage <= 100}
                        title="Jump 100 pages back"
                    >
                        -100
                    </button>
                )}

                {pageCount > 10 && (
                    <button
                        className="page-btn jump-btn"
                        onClick={() => handleNavigate(Math.max(1, currentPage - 10))}
                        disabled={currentPage <= 10}
                        title="Jump 10 pages back"
                    >
                        -10
                    </button>
                )}

                <button
                    className="page-btn prev-btn"
                    onClick={() => handleNavigate(currentPage - 1)}
                    disabled={currentPage <= 1}
                    title="Previous page"
                >
                    ←
                </button>

                {renderPageButtons()}

                <button
                    className="page-btn next-btn"
                    onClick={() => handleNavigate(currentPage + 1)}
                    disabled={currentPage >= pageCount}
                    title="Next page"
                >
                    →
                </button>

                {pageCount > 10 && (
                    <button
                        className="page-btn jump-btn"
                        onClick={() =>
                            handleNavigate(Math.min(pageCount, currentPage + 10))
                        }
                        disabled={currentPage + 10 > pageCount}
                        title="Jump 10 pages forward"
                    >
                        +10
                    </button>
                )}

                {pageCount > 100 && (
                    <button
                        className="page-btn jump-btn"
                        onClick={() =>
                            handleNavigate(Math.min(pageCount, currentPage + 100))
                        }
                        disabled={currentPage + 100 > pageCount}
                        title="Jump 100 pages forward"
                    >
                        +100
                    </button>
                )}
            </div>

            <div className="pagination-input">
                <input
                    type="number"
                    min="1"
                    max={pageCount}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="page-input"
                />
                <span className="page-info">of {pageCount}</span>
                <button
                    className="book-button"
                    onClick={handleInputSubmit}
                    disabled={pageCount === 0}
                >
                    Go
                </button>
            </div>
        </div>
    );
};

export default BookPagesPagination;
