import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";

export default function SignupPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    function handleSignup(e) {
        e.preventDefault();

        fetch(`${API_BASE_URL}/user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        })
        .then(res => {
            if (!res.ok) throw new Error("Signup failed");
            return res.json();
        })
        .then(() => {
            alert("Account created successfully");
            navigate("/login");
        })
        .catch(() => alert("Username may already be taken"));
    }

    return (
        <div className="login-container">
            <h1>Sign Up</h1>

            <form onSubmit={handleSignup}>
                <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <button type="submit">Create Account</button>
            </form>

            <p>Already have an account? <Link to="/login">Sign in!</Link></p>
        </div>
    );
}