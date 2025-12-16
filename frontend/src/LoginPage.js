import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";
import LoginIcon from '@mui/icons-material/Login';

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    function handleSubmit(e) {
        e.preventDefault();

        fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        })
        .then(res => {
            if (!res.ok) throw new Error("Login failed");
            return res.json();
        })
        .then(() => navigate("/homepage"))
        .catch(() => alert("Invalid username or password"));
    }

    return (
        <div className="login-container">
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <button type="submit">Login <LoginIcon sx={{ fontSize: 12 }}></LoginIcon></button>
            </form>

            <p> Don't have an account? <Link to="/signup">Sign up!</Link></p>
        </div>
    );
}