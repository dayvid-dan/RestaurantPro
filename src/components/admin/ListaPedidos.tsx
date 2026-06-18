"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { PedidoComAcoes } from "./PedidoComAcoes";

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
  itens?: ItemPedido[];
  totalPedido: number;
  status: "pendente" | "em preparo" | "saiu para entrega" | "entregue";
  criadoEm: { seconds: number };
};

type FiltroStatus =
  | "todos"
  | "pendente"
  | "em preparo"
  | "saiu para entrega"
  | "entregue";

const statusCor: Record<string, string> = {
  pendente: "#f59e0b",
  "em preparo": "#2563eb",
  "saiu para entrega": "#16a34a",
  entregue: "#6b7280",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  "em preparo": "Preparando",
  "saiu para entrega": "Saiu pra entrega",
  entregue: "Entregue",
};

export default function ListaPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [pedidoDetalhes, setPedidoDetalhes] = useState<Pedido | null>(null);
  const [carregandoStatus, setCarregandoStatus] = useState<string | null>(
    null
  );

  // Carrega pedidos em tempo real
  useEffect(() => {
    const q = query(
      collection(db, "pedidos"),
      orderBy("criadoEm", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Pedido[];
      setPedidos(lista);
    });

    return () => unsub();
  }, []);

  const statusOpcoes: FiltroStatus[] = [
    "pendente",
    "em preparo",
    "saiu para entrega",
    "entregue",
  ];

  const pedidosFiltrados = useMemo(() => {
    if (filtro === "todos") return pedidos;
    return pedidos.filter((p) => p.status === filtro);
  }, [pedidos, filtro]);

  const totalDoDia = useMemo(() => {
    return pedidos.reduce(
      (acc, p) => acc + Number(p.totalPedido || 0),
      0
    );
  }, [pedidos]);

  const alterarStatus = async (
    pedidoId: string,
    novoStatus: Pedido["status"]
  ) => {
    try {
      setCarregandoStatus(pedidoId);
      await updateDoc(doc(db, "pedidos", pedidoId), {
        status: novoStatus,
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar status do pedido.");
    } finally {
      setCarregandoStatus(null);
    }
  };

  const abrirDetalhes = (pedido: Pedido) => {
    setPedidoDetalhes(pedido);
  };

  const fecharDetalhes = () => {
    setPedidoDetalhes(null);
  };

  return (
    <div
      style={{
        marginTop: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Resumo de pedidos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#eff6ff",
            border: "1px solid #dbeafe",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#1d4ed8",
              marginBottom: 4,
            }}
          >
            Total do dia
          </p>
          <p
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#1d4ed8",
            }}
          >
            R$ {totalDoDia.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#fef3c7",
            border: "1px solid #fde68a",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#b45309",
              marginBottom: 4,
            }}
          >
            Pedidos pendentes
          </p>
          <p
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#b45309",
            }}
          >
            {pedidos.filter((p) => p.status === "pendente").length}
          </p>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#ecfdf3",
            border: "1px solid #bbf7d0",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#15803d",
              marginBottom: 4,
            }}
          >
            Pedidos entregues
          </p>
          <p
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#15803d",
            }}
          >
            {pedidos.filter((p) => p.status === "entregue").length}
          </p>
        </div>
      </div>

      {/* Filtro por status */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {(["todos", ...statusOpcoes] as FiltroStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: "bold",
              background: filtro === s ? "#111827" : "#e5e7eb",
              color: filtro === s ? "white" : "#111827",
            }}
          >
            {s === "todos"
              ? "Todos"
              : s === "pendente"
              ? "Pendentes"
              : s === "em preparo"
              ? "Em preparo"
              : s === "saiu para entrega"
              ? "Saiu para entrega"
              : "Entregues"}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {pedidosFiltrados.length === 0 ? (
          <p
            style={{
              color: "#6b7280",
              marginTop: 16,
            }}
          >
            Nenhum pedido encontrado.
          </p>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              style={{
                borderRadius: 12,
                borderLeft: `5px solid ${
                  statusCor[pedido.status] || "#e5e7eb"
                }`,
              }}
            >
              {/* Card com botões de impressão/PDF */}
              <PedidoComAcoes pedido={pedido} />

              {/* Ações de status + detalhes */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 6,
                  paddingInline: 14,
                  paddingBottom: 10,
                }}
              >
                {/* Botões de status */}
                {pedido.status !== "entregue" && (
                  <>
                    {pedido.status === "pendente" && (
                      <button
                        onClick={() =>
                          alterarStatus(pedido.id, "em preparo")
                        }
                        disabled={!!carregandoStatus}
                        style={{
                          padding: "6px 10px",
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        Iniciar preparo
                      </button>
                    )}

                    {pedido.status === "em preparo" && (
                      <button
                        onClick={() =>
                          alterarStatus(
                            pedido.id,
                            "saiu para entrega"
                          )
                        }
                        disabled={!!carregandoStatus}
                        style={{
                          padding: "6px 10px",
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        Saiu para entrega
                      </button>
                    )}

                    {pedido.status === "saiu para entrega" && (
                      <button
                        onClick={() =>
                          alterarStatus(pedido.id, "entregue")
                        }
                        disabled={!!carregandoStatus}
                        style={{
                          padding: "6px 10px",
                          background: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        Marcar como entregue
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => abrirDetalhes(pedido)}
                  style={{
                    padding: "6px 10px",
                    background: "#f97316",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  Ver detalhes
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalhes (igual ao seu) */}
      {pedidoDetalhes && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: 18,
              width: "95%",
              maxWidth: 520,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <h3
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Detalhes do pedido #{pedidoDetalhes.id.slice(0, 8)}
              </h3>
              <button
                onClick={fecharDetalhes}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginBottom: 4,
              }}
            >
              {new Date(
                pedidoDetalhes.criadoEm.seconds * 1000
              ).toLocaleString("pt-BR")}
            </p>

            <p
              style={{
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              👤 {pedidoDetalhes.nome || "Cliente sem nome"} (
              {pedidoDetalhes.email})
            </p>
            {pedidoDetalhes.telefone && (
              <p
                style={{
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                📞 {pedidoDetalhes.telefone}
              </p>
            )}
            {pedidoDetalhes.endereco && (
              <p
                style={{
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                📍 {pedidoDetalhes.endereco}
              </p>
            )}

            <div
              style={{
                marginTop: 8,
                padding: 10,
                background: "#f9fafb",
                borderRadius: 10,
              }}
            >
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Itens do pedido (
                {pedidoDetalhes.itens ? pedidoDetalhes.itens.length : 0}):
              </p>

              {(() => {
                const itens = pedidoDetalhes.itens ?? [];

                if (itens.length === 0) {
                  return (
                    <p
                      style={{
                        color: "#6b7280",
                      }}
                    >
                      Nenhum item neste pedido.
                    </p>
                  );
                }

                return itens.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: 12,
                      paddingBottom: 12,
                      borderBottom:
                        idx !== itens.length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "bold",
                        marginBottom: 4,
                      }}
                    >
                      {item.prato}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      Quantidade: {item.quantidade} | Preço: R${" "}
                      {(item.preco || 0).toFixed(2)}
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        color: "#2563eb",
                      }}
                    >
                      Subtotal: R$ {(item.total || 0).toFixed(2)}
                    </p>
                    {item.observacao && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          marginTop: 4,
                        }}
                      >
                        💬 {item.observacao}
                      </p>
                    )}
                  </div>
                ));
              })()}
            </div>

            <p
              style={{
                marginTop: 10,
                fontSize: 14,
              }}
            >
              <strong>Total do pedido:</strong>{" "}
              <span
                style={{
                  color: "#ea580c",
                  fontWeight: "bold",
                }}
              >
                R$ {Number(pedidoDetalhes.totalPedido || 0).toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}