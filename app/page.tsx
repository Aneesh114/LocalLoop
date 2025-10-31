"use client";

import { useEffect, useState } from "react";
import Map from "react-map-gl/mapbox";
import { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

type Post = {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

export default function HomePage() {
  const [viewState, setViewState] = useState({
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [description,setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch posts from backend
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to fetch posts:", text);
        return;
      }
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
  }, []);

  // Add a new post
  const addPost = async () => {
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative h-screen w-screen">
      {/* Map */}
      <Map
        {...viewState}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onMove={(evt) => {
          const { latitude, longitude, zoom, bearing, pitch } = evt.viewState;
          setViewState({ latitude, longitude, zoom, bearing, pitch });
        }}
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
                e.stopPropagation(); // prevent map click from firing
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

        {/* Popup for selected post */}
        {selectedPost && (
          <Popup
            longitude={selectedPost.longitude}
            latitude={selectedPost.latitude}
            anchor="top"
            onClose={() => setSelectedPost(null)}
            closeButton={true}
          >
            <div>
              <h3 className="font-bold">{selectedPost.title}</h3>
              <p>{selectedPost.description}</p>
              <p className="text-sm text-gray-500">
                {new Date(selectedPost.created_at).toLocaleString()}
              </p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Form overlay */}
      <div className="absolute top-4 left-4 z-50 bg-white p-4 rounded shadow flex items-center gap-2">
        <input
          type="text"
          placeholder="Post title"
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

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 right-4 z-50 bg-white p-2 rounded shadow">
          Loading posts...
        </div>
      )}
    </div>
  );
}
