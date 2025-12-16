import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import LogoutIcon from '@mui/icons-material/Logout';
import DataTable from "./components/datatable";

export default function HomePage() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("mygroups");
    const [myGroups, setMyGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupDesc, setGroupDesc] = useState("");
    const [createdGroups, setCreatedGroups] = useState([]);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [membersList, setMembersList] = useState([]);
    const [memberCounts, setMemberCounts] = useState({});
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate();

    const columns = [
        { key: 'name', header: 'Group Name' },
        { key: 'description', header: 'Description' },
        { 
            key: 'members', 
            header: 'Members',
            cellRenderer: (row) => {
                const count = memberCounts[row.name];
                return count !== undefined ? (
                    <>
                        <span onClick={() => viewMembers(row.name)} className="member-count-link">
                            {count}
                        </span>
                    </>
                ) : (
                    <>
                        {memberCounts[row.name] === undefined && loadMemberCount(row.name)}
                        {'...'} 
                    </>
                );
            }
        },
        { 
            key: 'actions', 
            header: 'Actions',
            cellRenderer: (row) => {
                const isMemberOfGroup = isMember(row.name);         
                return (
                    <button 
                        onClick={() => isMemberOfGroup ? leaveGroup(row.name) : joinGroup(row.name)}
                        className={isMemberOfGroup ? "leave-button" : "join-button"}
                    >
                        {isMemberOfGroup ? "Leave Group" : "Join Group"}
                    </button>
                );
            }
        },
    ];

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

    useEffect(() => {
        fetch("http://localhost:5000/createdgroups", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setCreatedGroups(data);
        });
    }, []);


    function handleLogout() {
        fetch("http://localhost:5000/logout", {
            method: "POST",
            credentials: "include"
        }).then(() => navigate("/login"));
    }

    function refreshAllData() {
        fetch("http://localhost:5000/groups", { credentials: "include" })
            .then(res => res.json())
            .then(data => setAllGroups(data));

        fetch("http://localhost:5000/mygroups", { credentials: "include" })
            .then(res => res.json())
            .then(data => setMyGroups(data));

        fetch("http://localhost:5000/createdgroups", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCreatedGroups(data);
            });
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
            refreshAllData();
            
        });
    }

    
    function joinGroup(name) {
        fetch(`http://localhost:5000/groups/${encodeURIComponent(name)}`, {
            method: "POST",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            refreshAllData();
        });
    }

function leaveGroup(name) {
    fetch(`http://localhost:5000/groups/${encodeURIComponent(name)}/leave`, {
        method: "DELETE",
        credentials: "include"
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Failed to leave group");
        }

        return data;
    })
    .then(data => {
        alert(data.message);
        refreshAllData();
    })
    .catch(err => {
        alert(err.message);
    });
}


    function isMember(groupName) {
        return myGroups.some(g => g.name === groupName);
    }

    function loadMemberCount(groupName) {
        fetch(`http://localhost:5000/members/${encodeURIComponent(groupName)}`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setMemberCounts(prev => ({
                ...prev,
                [groupName]: data.length
            }));
        });
    }

    function viewMembers(name) {
        fetch(`http://localhost:5000/members/${encodeURIComponent(name)}`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setMembersList(data);
            setShowMembersModal(true);
        });
    }

    function deleteGroup(name) {
        fetch(`http://localhost:5000/groups/${encodeURIComponent(name)}`, {
            method: "DELETE",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            alert(data);
            refreshAllData();
        });
    }



    if (!user) return <h2>Loading...</h2>;

    return (
        <div className="home-container">
            <header>
            <h1>Welcome, {user.name}</h1>
            <button onClick={handleLogout} className="logout-btn">Logout <LogoutIcon sx={{ fontSize: 12 }}></LogoutIcon></button>
            </header>
            <button className="create-btn" onClick={() => setShowCreateForm(true)}>
                Create New Group
            </button>
            <button 
                className="posts-btn" 
                onClick={() => navigate("/posts")}
            >
            View Your Posts
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

            {showMembersModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Group Members</h2>

                        {membersList.length === 0 && <p>No members found.</p>}

                        {membersList.map((m, i) => (
                            <p key={i}>{m.username}</p>
                        ))}

                        <button 
                            className="close-btn" 
                            onClick={() => setShowMembersModal(false)}
                        >
                        Close
                        </button>
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

                <button
                    className={activeTab === "created" ? "active" : ""}
                    onClick={() => setActiveTab("created")}
                >
                    Created Groups
                </button>
            </div>

            <div className="group-list">
                {activeTab === "mygroups" &&
                    myGroups.map((g, i) => (
                        <div key={i} className="group-card">
                            <h3>{g.name}</h3>
                            <p>{g.description}</p>
                            {memberCounts[g.name] === undefined && loadMemberCount(g.name)}
                            <p>Members: {memberCounts[g.name] ?? "..."}</p>
                            <button onClick={() => viewMembers(g.name)}>View Members</button>
                            <button className="leave-button" onClick={() => leaveGroup(g.name)}>
                                Leave Group
                            </button>
                        </div>
                    ))}

                {activeTab === "allgroups" && (
                <> 
                    <div className="data-table-view">
                    <DataTable 
                        isLoading={loading} 
                        data={allGroups} 
                        columns={columns} 
                    />
                    </div>
                </>
                )}

                {activeTab === "created" &&
                    createdGroups.map((g, i) => (
                        <div key={i} className="group-card">
                            <h3>{g.name}</h3>
                            <p>{g.description}</p>
                            {memberCounts[g.name] === undefined && loadMemberCount(g.name)}
                            <p>Members: {memberCounts[g.name] ?? "..."}</p>
                            <button onClick={() => viewMembers(g.name)}>View Members</button>
                            <p>Created by: {g.creator_name}</p>
                            {g.creator_name === user.name && (
                                <button onClick={() => deleteGroup(g.name)} className="delete-btn">
                                    Delete Group
                                </button>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
}