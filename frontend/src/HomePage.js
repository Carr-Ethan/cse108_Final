import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("mygroups");
    const [myGroups, setMyGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupDesc, setGroupDesc] = useState("");

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

    useEffect(() => {
        fetch("http://localhost:5000/groups", {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setAllGroups(data));

        fetch("http://localhost:5000/mygroups", {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setMyGroups(data));
    }, []);

    function handleLogout() {
        fetch("http://localhost:5000/logout", {
            method: "POST",
            credentials: "include"
        }).then(() => navigate("/login"));
    }

    function handleCreateGroup(e) {
        e.preventDefault();

        fetch("http://localhost:5000/groups", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: groupName,
                description: groupDesc
            })
        })
        .then(res => res.json())
        .then(() => {
            alert("Group created!");
            setShowCreateForm(false);
            setGroupName("");
            setGroupDesc("");

            
            fetch("http://localhost:5000/groups", { credentials: "include" })
                .then(res => res.json())
                .then(data => setAllGroups(data));
        });
    }

    
    function joinGroup(name) {
        fetch(`http://localhost:5000/groups/${name}`, {
            method: "POST",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);

        fetch("http://localhost:5000/mygroups", { credentials: "include" })
            .then(res => res.json())
            .then(data => setMyGroups(data));

        fetch("http://localhost:5000/groups", { credentials: "include" })
            .then(res => res.json())
            .then(data => setAllGroups(data));
        });
    }

    function isMember(groupName) {
        return myGroups.some(g => g.name === groupName);
    }



    if (!user) return <h2>Loading...</h2>;

    return (
        <div className="home-container">
            <header>
            <h1>Welcome, {user.name}</h1>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            </header>
            <button className="create-btn" onClick={() => setShowCreateForm(true)}>
                Create New Group
            </button>

            {showCreateForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Create Group</h2>

                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                value={groupDesc}
                                onChange={e => setGroupDesc(e.target.value)}
                            />

                            <div className="modal-buttons">
                                <button type="submit">Create</button>
                                <button type="button" onClick={() => setShowCreateForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                        </div>
                </div>
            )}


            <div className="tabs">
                <button
                    className={activeTab === "mygroups" ? "active" : ""}
                    onClick={() => setActiveTab("mygroups")}
                >
                    My Groups
                </button>

                <button
                    className={activeTab === "allgroups" ? "active" : ""}
                    onClick={() => setActiveTab("allgroups")}
                >
                    All Groups
                </button>
            </div>

            <div className="group-list">
                {activeTab === "mygroups" &&
                    myGroups.map((g, i) => (
                        <div key={i} className="group-card">
                            <h3>{g.name}</h3>
                            <p>{g.description}</p>
                        </div>
                    ))}

                {activeTab === "allgroups" &&
                    allGroups.map((g, i) => (
                        <div key={i} className="group-card">
                            <h3>{g.name}</h3>
                            <p>{g.description}</p>
                            <p>Created by: {g.creator_name}</p>
                            {!isMember(g.name) && (
                                <button onClick={() => joinGroup(g.name)}>
                                Join Group
                                </button>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
}