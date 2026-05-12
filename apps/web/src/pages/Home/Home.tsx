import "./Home.css";
import BooksList from "../../components/BooksList";
import {BookUpload} from "../../components/BookUpload";

const Home = () => {
    return (
        <div className="home-container">
            <BooksList/>
            <BookUpload />
        </div>
    );
}

export default Home;
