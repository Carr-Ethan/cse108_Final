import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://localhost:5000/me", {
            method: "GET",
            credentials: "include"
        })
        .then(res => {
            if (res.status === 401) {
                navigate("/login");
                return null;
            }
            return res.json();
        })
        .then(data => {
            if (data) setUser(data);
        });
    }, [navigate]);

    function handleLogout() {
        fetch("http://localhost:5000/logout", {
            method: "POST",
            credentials: "include"
        }).then(() => navigate("/login"));
    }

    if (!user) return <h2>Loading...</h2>;

    return (
        <div style={{ padding: "20px" }}>
            <h1>Welcome, {user.name}</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}