import {Link} from "react-router";

const Header = () => {
    return (
        <header className="app-header">
            <Link to="/" style={{textDecoration: 'none', color: 'white'}}>
                <h1>Cropbook</h1>
                <p>Upload PDF. Crop book by mask.</p>
            </Link>
        </header>
    )
}

export default Header;