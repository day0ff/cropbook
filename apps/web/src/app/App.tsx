import {BrowserRouter, Routes, Route} from "react-router";
import Home from "../pages/Home";
import {BookUpload} from "../components/BookUpload";
import "./App.css";
import Book from "../pages/Book";
import BookPage from "../pages/BookPage";
import Header from "../components/Header/Header.tsx";

const App = () => {

    return (
        <BrowserRouter>
            <Header/>
            <main className="app-main">
                <Routes>
                    <Route index element={<Home/>}/>
                    <Route path={"book/:bookName"} element={<Book/>}/>
                    <Route
                        path={"book/:bookName/page/:pageNumber"}
                        element={<BookPage/>}
                    />
                    <Route path={"upload"} element={<BookUpload/>}/>
                </Routes>
            </main>
        </BrowserRouter>
    );
};

export default App;
