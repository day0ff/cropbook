import { BrowserRouter, Routes, Route } from "react-router";
import Home from "../pages/Home";
import { BookUpload } from "../components/BookUpload";
import "./App.css";
import Book from "../pages/Book";

const App = () => {
  return (
    <>
      <header className="app-header">
        <h1>Cropbook</h1>
        <p>Upload PDF. Crop book by mask.</p>
      </header>

      <main className="app-main">
          <BrowserRouter>
              <Routes>
                  <Route index element={<Home/>}/>
                  <Route path={'book/:bookName'} element={<Book/>}/>
                  <Route path={'upload'} element={<BookUpload/>}/>
              </Routes>
          </BrowserRouter>
      </main>
    </>
  );
}

export default App;
