"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../lib/firebase";
import ListaPedidos from "../../components/admin/ListaPedidos";
import ListaCardapio from "../../components/admin/ListaCardapio";
import ListaAvaliacoes from "../../components/admin/ListaAvaliacoes";

type Aba = "pedidos" | "cardapio" | "avaliacoes";

const ADMIN_EMAIL = "dayviddani@gmail.com";

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [aba, setAba] = useState<Aba>("pedidos");

  // Enquanto carrega o estado de auth
  if (loading) {
    return (
      <main
        style={{
          padding: 16,
          maxWidth: 1000,
          margin: "0 auto",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p>Carregando...</p>
      </main>
    );
  }

  // Bloqueia acesso se não for o dono
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <main
        style={{
          padding: 16,
          maxWidth: 600,
          margin: "0 auto",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
          Acesso restrito
        </h1>
        <p style={{ color: "#6b7280" }}>
          Esta área é exclusiva do administrador do sistema.
        </p>
      </main>
    );
  }

  // Painel admin
  return (
    <main
      style={{
        padding: 16,
        maxWidth: 1000,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 16,
        }}
      >
        Painel Administrativo
      </h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setAba("pedidos")}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            background: aba === "pedidos" ? "#111827" : "#e5e7eb",
            color: aba === "pedidos" ? "white" : "#111827",
          }}
        >
          📦 Pedidos
        </button>

        <button
          onClick={() => setAba("cardapio")}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            background: aba === "cardapio" ? "#111827" : "#e5e7eb",
            color: aba === "cardapio" ? "white" : "#111827",
          }}
        >
          🍽️ Cardápio
        </button>

        <button
          onClick={() => setAba("avaliacoes")}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            background: aba === "avaliacoes" ? "#111827" : "#e5e7eb",
            color: aba === "avaliacoes" ? "white" : "#111827",
          }}
        >
          ⭐ Avaliações
        </button>
      </div>

      {aba === "pedidos" && <ListaPedidos />}

      {aba === "cardapio" && <ListaCardapio />}

      {aba === "avaliacoes" && <ListaAvaliacoes />}
    </main>
  );
}