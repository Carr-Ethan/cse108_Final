import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';    
import DataTable from "./components/datatable";
import "./PostsPage.css";

export default function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPostId, setEditPostId] = useState(null);
    const [editDescription, setEditDescription] = useState("");
    const [editDeadline, setEditDeadline] = useState("");
    const [myGroups, setMyGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("none");
    const [editStatus, setEditStatus] = useState("");

    const navigate = useNavigate();

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const formatForInput = (dateTimeString) => {
        if (!dateTimeString) {
            return "";
        }

        const date = new Date(dateTimeString);
        
        if (isNaN(date.getTime())) {
            console.error("Invalid date string received:", dateTimeString);
            return ""; 
        }

        let isoString = date.toISOString();

        return isoString.substring(0, 16);
    };
    const columns = [
        { key: 'name', header: 'Group Name' },
        { key: 'description', header: 'Description' },
        { key: "time_posted", header: "Time Posted"},
        { key: 'deadline', header: 'Deadline'},
        { key: "status", header: "Status"},
        { 
            key: 'action1', 
            header: 'Edit',
            cellRenderer: (row) => (
                <button 
                    onClick={() => {
                        setEditPostId(row.id);
                        setEditDescription(row.description);
                        setEditDeadline(formatForInput(row.deadline)); 
                        setEditStatus(row.status);
                        setShowEditModal(true);
                    }} 
                    className="edit-btn"
                >
                    Edit <EditIcon sx={{ fontSize: 15 }}/>
                </button>
            )
        },
        { 
            key: 'action2', 
            header: 'Delete',
            cellRenderer: (row) => (
                <button 
                    onClick={() => deletePost(row.id)} 
                    className="delete-btn"
                >
                    Delete <DeleteIcon sx={{ fontSize: 15 }}/>
                </button>
            )
        },
    ];

    useEffect(() => {
        fetch(`${API_BASE_URL}/posts`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setPosts(data));
    }, [API_BASE_URL]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/mygroups`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setMyGroups(data));
    }, [API_BASE_URL]);


    function createPost(e) {
        e.preventDefault();

        const formattedDeadline = deadline.replace("T", " ") + ":00";

        fetch(`${API_BASE_URL}/posts`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: groupName,
                description: description,
                deadline: formattedDeadline
            })
        })
        .then(res => res.json())
        .then(data => {
            alert(data);
            setShowCreateModal(false);

            setGroupName("");
            setDescription("");
            setDeadline("");

            refreshPosts();
        });
    }


    function updatePost(e) {
        e.preventDefault();

        const formattedDeadline = editDeadline.replace("T", " ") + ":00";

        fetch(`${API_BASE_URL}/posts/${editPostId}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                description: editDescription,
                deadline: formattedDeadline,
                status: editStatus
            })
        })
        .then(res => res.json())
        .then(data => {
            alert(data);
            setShowEditModal(false);
            refreshPosts();
        });
    }

    function deletePost(postId) {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: "DELETE",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error || data);
            refreshPosts();
        });
    }

    function refreshPosts() {
        fetch(`${API_BASE_URL}/posts`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setPosts(data));
    }

    const filteredPosts = posts
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortOrder === "asc") {
                return new Date(a.deadline) - new Date(b.deadline);
            }
            if (sortOrder === "desc") {
                return new Date(b.deadline) - new Date(a.deadline);
            }
            return 0;
        })

    return (
        <div className="posts-container">
            <h1>Your Posts</h1>

            <button 
                className="back-btn" 
                onClick={() => navigate("/homepage")}
            >
                Back to Home
            </button>

            <button 
                className="create-post-btn" 
                onClick={() => setShowCreateModal(true)}
            >
                Create New Post
            </button>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Create Post</h2>

                        <form onSubmit={createPost}>
                            <select 
                                value={groupName} 
                                onChange={e => setGroupName(e.target.value)}
                            >
                                <option value="">Select a group</option>

                                {myGroups.map((g, i) => (
                                    <option key={i} value={g.name}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>

                            <input 
                                type="text"
                                placeholder="Description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />

                            <input 
                                type="datetime-local"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                            />

                            <select
                                value={editStatus}
                                onChange={e => setEditStatus(e.target.value)}
                            >
                                <option value="not started">Not Started</option>
                                <option value="in progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>

                            <button type="submit">Create</button>
                            <button type="button" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Edit Post</h2>

                        <form onSubmit={updatePost}>
                            <input
                                type="text"
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                            />

                            <input
                                type="datetime-local"
                                value={editDeadline}
                                onChange={e => setEditDeadline(e.target.value)}
                            />

                            <select
                                value={editStatus}
                                onChange={e => setEditStatus(e.target.value)}
                            >
                                <option value="not started">Not Started</option>
                                <option value="in progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>

                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="search-filter-container">
                <input
                    type="text"
                    placeholder="Search by group name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-bar"
                />

                <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="sort-select"
                >
                    <option value="none">None</option>
                    <option value="asc">Earliest first</option>
                    <option value="desc">Latest first</option>
                </select>
            </div>

            <div className="posts-list">
                {filteredPosts.length > 0 ? (
                    <DataTable 
                        data={filteredPosts} 
                        columns={columns} 
                    />
                ) : (
                    <p className="no-posts-message">No posts found matching your criteria.</p>
                )}
            </div>
        </div>
    );
}
