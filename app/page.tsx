//app\page.tsx
"use client";

import { useEffect, useState } from "react";
import Map from "react-map-gl/mapbox";
import { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRouter } from "next/navigation";

type Post = {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();

  const [viewState, setViewState] = useState({
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });
function CommentsSection({ postId, loggedIn }: { postId: number; loggedIn: boolean }) {
  const [comments, setComments] = useState<{ id: number; text: string; user_email: string }[]>([]);
  const [text, setText] = useState("");

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const addComment = async () => {
    if (!loggedIn) return alert("Please log in to comment");
    if (!text.trim()) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, text }),
      });
      if (res.ok) {
        setText("");
        fetchComments();
      } else {
        console.error("Failed to post comment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-2">
      <h4 className="font-semibold text-sm">Comments</h4>
      <div className="max-h-24 overflow-y-auto border p-1 rounded bg-gray-50">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-xs">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <p key={c.id} className="text-xs mb-1">
              <b>{c.user_email || "Anonymous"}:</b> {c.text}
            </p>
          ))
        )}
      </div>

      {loggedIn && (
        <div className="flex gap-1 mt-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="border rounded px-2 py-1 text-xs w-full"
          />
          <button
            onClick={addComment}
            className="bg-blue-500 text-white px-2 text-xs rounded hover:bg-blue-600"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Check login status
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    } catch {
      setLoggedIn(false);
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      const data: Post[] = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    checkAuth();
  }, []);

  // Add a new post
  const addPost = async () => {
    if (!loggedIn) {
      alert("Please log in to post.");
      router.push("/login");
      return;
    }

    if (!title) return;
    const newPostData = {
      title,
      description,
      latitude: viewState.latitude,
      longitude: viewState.longitude,
    };

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPostData),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to add post:", text);
        return;
      }

      const newPost: Post = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error(err);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
  };

  return (
    <div className="relative h-screen w-screen">
      {/* Map */}
      <Map
        {...viewState}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onMove={(evt) => setViewState(evt.viewState)}
      >
        <NavigationControl showCompass showZoom />

        {/* Render posts */}
        {posts.map((post) => (
          <Marker
            key={post.id}
            longitude={post.longitude}
            latitude={post.latitude}
            anchor="center"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPost(post);
              }}
              style={{
                width: selectedPost?.id === post.id ? 30 : 24,
                height: selectedPost?.id === post.id ? 30 : 24,
                backgroundColor:
                  selectedPost?.id === post.id ? "orange" : "red",
                border: "2px solid white",
                borderRadius: "50%",
                cursor: "pointer",
              }}
              title={post.title}
            />
          </Marker>
        ))}

        {/* Popup */}
        {selectedPost && (
  <Popup
    longitude={selectedPost.longitude}
    latitude={selectedPost.latitude}
    anchor="top"
    onClose={() => setSelectedPost(null)}
  >
    <div style={{ maxWidth: 250 }}>
      <h3 className="font-bold">{selectedPost.title}</h3>
      <p>{selectedPost.description}</p>
      <p className="text-sm text-gray-500">
        {new Date(selectedPost.created_at).toLocaleString()}
      </p>

      <hr className="my-2" />

      {/* Comments Section */}
      <CommentsSection postId={selectedPost.id} loggedIn={loggedIn} />
    </div>
  </Popup>
)}

      </Map>

      {/* Add Post Form */}
      <div className="absolute top-4 left-4 z-50 bg-white p-4 rounded shadow flex items-center gap-2">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <button
          onClick={addPost}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Add Post
        </button>
      </div>

      {/* Login / Logout button */}
      <div className="absolute top-4 right-4 z-50 bg-white p-2 rounded shadow">
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Login
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute bottom-4 right-4 z-50 bg-white p-2 rounded shadow">
          Loading posts...
        </div>
      )}
    </div>
  );
}
