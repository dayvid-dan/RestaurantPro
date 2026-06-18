"use client";

import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function LoginButton() {
  const [user] = useAuthState(auth);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  if (user) {
    return (
      <div style={{ padding: "16px", border: "1px solid #ddd", borderRadius: "12px", background: "#fff" }}>
        <p><strong>Logado como:</strong> {user.displayName}</p>
        <p>{user.email}</p>
        <button onClick={logout} style={{ marginTop: "10px", padding: "10px 16px" }}>
          Sair
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      style={{
        padding: "12px 18px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
      }}
    >
      Entrar com Google
    </button>
  );
}