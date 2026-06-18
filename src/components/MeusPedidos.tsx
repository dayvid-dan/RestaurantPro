"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../lib/firebase";

type ItemPedido = {
  pratoId: string;
  prato: string;
  preco: number;
  quantidade: number;
  total: number;
  observacao?: string;
};

type Pedido = {
  id: string;
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  itens: ItemPedido[];
  totalPedido: number;
  status: string;
  criadoEm: { seconds: number };
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  "em preparo": "Preparando",
  "saiu para entrega": "Saiu pra entrega",
  entregue: "Entregue",
};

export default function MeusPedidos() {
  const [user] = useAuthState(auth);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "pedidos"),
      where("uid", "==", user.uid),
      orderBy("criadoEm", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Pedido[];
      setPedidos(lista);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div
      style={{
        marginTop: 28,
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 16,
        }}
      >
        Meus pedidos
      </h2>

      {pedidos.length === 0 ? (
        <p style={{ color: "#666" }}>Você ainda não fez nenhum pedido.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              style={{
                padding: 14,
                border: "1px solid #ddd",
                borderRadius: 10,
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: "bold",
                      fontSize: 14,
                      marginBottom: 2,
                    }}
                  >
                    Pedido #{pedido.id.slice(0, 8)}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {new Date(
                      pedido.criadoEm.seconds * 1000
                    ).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 999,
                    background:
                      pedido.status === "pendente"
                        ? "#fef3c7"
                        : pedido.status === "em preparo"
                        ? "#dbeafe"
                        : pedido.status === "saiu para entrega"
                        ? "#dcfce7"
                        : "#e5e7eb",
                    color:
                      pedido.status === "pendente"
                        ? "#92400e"
                        : pedido.status === "em preparo"
                        ? "#1d4ed8"
                        : pedido.status === "saiu para entrega"
                        ? "#166534"
                        : "#374151",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {statusLabel[pedido.status] || pedido.status}
                </span>
              </div>

              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    fontWeight: "bold",
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  Itens ({pedido.itens?.length || 0})
                </p>
                {pedido.itens && pedido.itens.length > 0 ? (
                  pedido.itens.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12,
                        color: "#374151",
                        marginBottom:
                          idx !== pedido.itens.length - 1 ? 6 : 0,
                      }}
                    >
                      <strong>{item.prato}</strong> x {item.quantidade} = R${" "}
                      {(item.total || 0).toFixed(2)}
                      {item.observacao && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          💬 {item.observacao}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Nenhum item.
                  </p>
                )}
              </div>

              <p
                style={{
                  fontSize: 13,
                }}
              >
                <strong>Total:</strong>{" "}
                <span
                  style={{
                    color: "#ea580c",
                    fontWeight: "bold",
                  }}
                >
                  R$ {Number(pedido.totalPedido || 0).toFixed(2)}
                </span>
              </p>

              {pedido.telefone && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#374151",
                    marginTop: 2,
                  }}
                >
                  📞 {pedido.telefone}
                </p>
              )}
              {pedido.endereco && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#374151",
                    marginTop: 2,
                  }}
                >
                  📍 {pedido.endereco}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const label: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  marginTop: 10,
  fontWeight: 600,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
};