"use client";

import React, { useState } from "react";
import "../page.css";
import { useRouter } from "next/navigation";

const App = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function login(username: string, password: string) {
    fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: username,
        password: password,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }).then((response) => {
      if (response.ok) {
        router.push("/");
      }
    });
  }

  return (
    // Uses existing `modal-overlay` and `modal` css classes.
    // Maybe replace this with http formdata instead? It might simplify the code somewhat.
    <div className="modal-overlay">
      <div className="login-container modal">
        <input
          className="login-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        ></input>
        <input
          className="login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        ></input>
        <button
          id="login-button"
          className="general-button"
          onClick={() => {
            login(username, password);
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default App;
