import { BrowserRouter, Routes, Route } from "react-router";
import Home from "../pages/Home";
import { BookUpload } from "../components/BookUpload";
import "./App.css";

const App = () => {
  return (
    <>
      <header className="app-header">
        <h1>Cropbook</h1>
        <p>PDF to Image Book Converter</p>
      </header>

      <main className="app-main">
          <BrowserRouter>
              <Routes>
                  <Route index element={<Home/>}/>
                  <Route path={'upload'} element={<BookUpload/>}/>
              </Routes>
          </BrowserRouter>
      </main>
    </>
  );
}

export default App;
