import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import LogoutIcon from '@mui/icons-material/Logout';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [searchTerm, setSearchTerm] = useState("");

    const navigate = useNavigate();

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const membersCellRenderer = (row) => {
        const count = memberCounts[row.name];
        return count !== undefined ? (
            <span>{count}</span>
        ) : (
            <>
                {memberCounts[row.name] === undefined && loadMemberCount(row.name)}
                {'...'}
            </>
        );
    };

    const viewMembersRenderer = (row) => (
        <button
            className="view-members-btn"
            onClick={() => viewMembers(row.name)}
        >
            View Members <PeopleIcon sx={{ fontSize: 16 }} />
        </button>
    );

    const columns = [
        { key: 'name', header: 'Group Name' },
        { key: 'description', header: 'Description' },
        { 
            key: 'members', 
            header: 'Members',
            cellRenderer: membersCellRenderer 
        },
        {
            key: 'viewMembers',
            header: 'View',
            cellRenderer: viewMembersRenderer
        },
        { 
            key: 'actions', 
            header: 'Actions',
            cellRenderer: (row) => {
                const isMemberOfGroup = isMember(row.name);         
                return (
                    <button 
                        onClick={() =>
                            isMemberOfGroup
                                ? leaveGroup(row.name)
                                : joinGroup(row.name)
                        }
                        className={isMemberOfGroup ? "leave-button" : "join-button"}
                    >
                        {isMemberOfGroup ? (
                            <>Leave <GroupRemoveIcon sx={{ fontSize: 15 }} /></>
                        ) : (
                            <>Join <GroupAddIcon sx={{ fontSize: 15 }} /></>
                        )}
                    </button>
                );
            }
        },
    ];

    const createdGroupColumns = [
        { key: 'name', header: 'Group Name' },
        { key: 'description', header: 'Description' },
        { 
            key: 'members', 
            header: 'Members',
            cellRenderer: membersCellRenderer
        },
        {
            key: 'viewMembers',
            header: 'View',
            cellRenderer: viewMembersRenderer
        },
        { 
            key: 'actions', 
            header: 'Delete',
            cellRenderer: (row) => (
                <button 
                    onClick={() => deleteGroup(row.name)} 
                    className="delete-btn"
                >
                    Delete <DeleteIcon sx={{ fontSize: 15 }}/>
                </button>
            )
        },
    ];


    useEffect(() => {
        fetch(`${API_BASE_URL}/me`, {
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
    }, [navigate, API_BASE_URL]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/groups`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setAllGroups(data));

        fetch(`${API_BASE_URL}/mygroups`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setMyGroups(data));
    }, [API_BASE_URL]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/createdgroups`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setCreatedGroups(data);
        });
    }, [API_BASE_URL]);


    function handleLogout() {
        fetch(`${API_BASE_URL}/logout`, {
            method: "POST",
            credentials: "include"
        }).then(() => navigate("/login"));
    }

    function refreshAllData() {
        setMemberCounts({});
        fetch(`${API_BASE_URL}/groups`, { credentials: "include" })
            .then(res => res.json())
            .then(data => setAllGroups(data));

        fetch(`${API_BASE_URL}/mygroups`, { credentials: "include" })
            .then(res => res.json())
            .then(data => setMyGroups(data));

        fetch(`${API_BASE_URL}/createdgroups`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCreatedGroups(data);
            });
    }


    function handleCreateGroup(e) {
        e.preventDefault();

        fetch(`${API_BASE_URL}/groups`, {
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
        fetch(`${API_BASE_URL}/groups/${encodeURIComponent(name)}`, {
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
        if (!window.confirm(`Leave group "${name}"?`)) return;
        fetch(`${API_BASE_URL}/groups/${encodeURIComponent(name)}/leave`, {
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
        fetch(`${API_BASE_URL}/members/${encodeURIComponent(groupName)}`, {
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
        fetch(`${API_BASE_URL}/members/${encodeURIComponent(name)}`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setMembersList(data);
            setShowMembersModal(true);
        });
    }

    function deleteGroup(name) {
        if (!window.confirm("Are you sure you want to delete this Group?")) return;

        fetch(`${API_BASE_URL}/groups/${encodeURIComponent(name)}`, {
            method: "DELETE",
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => {
                    throw new Error(err.message || 'Deletion failed.');
                });
            }
            return res.json();
        })
        .then(data => {
            alert(data.message || "Group has been deleted successfully.");

            setCreatedGroups(prev => prev.filter(g => g.name !== name));
            setAllGroups(prev => prev.filter(g => g.name !== name));
            setMyGroups(prev => prev.filter(g => g.name !== name));
        })
        .catch(error => {
            alert(`Error deleting group: ${error.message}`);
        });
    }



    if (!user) return <h2>Loading...</h2>;

    const filteredMyGroups = myGroups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAllGroups = allGroups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCreatedGroups = createdGroups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                {activeTab === "mygroups" && (
                    <>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-bar"
                        />
                    </div>

                    <div className="data-table-view">
                    <DataTable  
                        data={filteredMyGroups} 
                        columns={columns} 
                    />
                    </div>
                </>)}

                {activeTab === "allgroups" && (
                <>  
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-bar"
                        />
                    </div>

                    <div className="data-table-view">
                        <DataTable 
                            data={filteredAllGroups} 
                            columns={columns} 
                        />
                    </div>
                </>
                )}

                {activeTab === "created" &&
                    <>
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search groups..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="search-bar"
                            />
                        </div>

                        <DataTable
                            data={filteredCreatedGroups} 
                            columns={createdGroupColumns} 
                        />
                    </>
                }
            </div>
        </div>
    );
}