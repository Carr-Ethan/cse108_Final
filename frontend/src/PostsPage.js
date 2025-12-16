import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://localhost:5000/posts", {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setPosts(data));
    }, []);

    useEffect(() => {
        fetch("http://localhost:5000/mygroups", {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setMyGroups(data));
    }, []);


    function createPost(e) {
        e.preventDefault();

        const formattedDeadline = deadline.replace("T", " ") + ":00";

        fetch("http://localhost:5000/posts", {
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

        fetch(`http://localhost:5000/posts/${editPostId}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                description: editDescription,
                deadline: formattedDeadline
            })
        })
        .then(res => res.json())
        .then(data => {
            alert(data);
            setShowEditModal(false);
            refreshPosts();
        });
    }


    function refreshPosts() {
        fetch("http://localhost:5000/posts", {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setPosts(data));
    }

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

                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="posts-list">
                {posts.map((p, i) => (
                    <div key={i} className="post-card">
                        <h3>{p.name}</h3>
                        <p>{p.description}</p>
                        <p>Posted: {p.time_posted}</p>
                        <p>Deadline: {p.deadline}</p>
                        <p>Status: {p.status}</p>

                        <button
                            className="edit-btn"
                            onClick={() => {
                                setEditPostId(p.id);
                                setEditDescription(p.description);
                                setEditDeadline(p.deadline);
                                setShowEditModal(true);
                            }}
                        >
                            Edit
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
