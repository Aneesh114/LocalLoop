"use client";

import { useEffect, useState } from "react";
import Map from "react-map-gl/mapbox";
import { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

type Post = {
  id: number;
  title: string;
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
  const [title, setTitle] = useState("");

  // Add post (for now, just frontend)
  const addPost = async () => {
  if (!title) return;

  const newPostData = {
    title,
    latitude: viewState.latitude,
    longitude: viewState.longitude,
  };

  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newPostData),
    });

    if (!res.ok) {
      const text = await res.text(); // debug: check response body
      console.error("Failed to add post:", res.status, text);
      return;
    }

    const newPost: Post = await res.json();
    setPosts((prev) => [newPost, ...prev]);
    setTitle("");
  } catch (err) {
    console.error("Error adding post:", err);
  }
};
const fetchPosts = async () => {
  try {
    const res = await fetch("/api/posts"); // fetch from Next.js API
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to fetch posts:", text);
      return;
    }
    const data: Post[] = await res.json();
    setPosts(data); // update state
  } catch (err) {
    console.error("Error fetching posts:", err);
  }
};

// Run once on component mount
useEffect(() => {
  fetchPosts();
}, []);


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
        {posts.map((post) => (
          <Marker
            key={post.id}
            longitude={post.longitude}
            latitude={post.latitude}
          >
            <div
              style={{
                width: 24,
                height: 24,
                backgroundColor: "red",
                border: "2px solid white",
                borderRadius: "50%",
              }}
              title={post.title}
            />
          </Marker>
        ))}
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
        <button
          onClick={addPost}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Add Post
        </button>
      </div>
    </div>
  );
}
