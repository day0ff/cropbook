import { BookUpload } from "./components/BookUpload";
import "./App.css";

function App() {
  return (
    <>
      <header className="app-header">
        <h1>Cropbook</h1>
        <p>PDF to Image Book Converter</p>
      </header>

      <main className="app-main">
        <BookUpload />
      </main>
    </>
  );
}

export default App;
