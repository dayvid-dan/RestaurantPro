"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

type Avaliacao = {
  id: string;
  pedidoId: string;
  uid: string;
  tempoEntrega: number;
  tempero: number;
  quantidade: number;
  comentario?: string;
  criadoEm: { seconds: number };
};

export default function ListaAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "avaliacoes"),
      orderBy("criadoEm", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Avaliacao[];
        setAvaliacoes(lista);
      },
      (error) => {
        console.error("Erro ao ler avaliações:", error);
      }
    );

    return () => unsub();
  }, []);

  const mediaTempo = useMemo(() => {
    if (!avaliacoes.length) return 0;
    return (
      avaliacoes.reduce(
        (acc, a) => acc + (a.tempoEntrega || 0),
        0
      ) / avaliacoes.length
    );
  }, [avaliacoes]);

  const mediaTempero = useMemo(() => {
    if (!avaliacoes.length) return 0;
    return (
      avaliacoes.reduce(
        (acc, a) => acc + (a.tempero || 0),
        0
      ) / avaliacoes.length
    );
  }, [avaliacoes]);

  const mediaQuantidade = useMemo(() => {
    if (!avaliacoes.length) return 0;
    return (
      avaliacoes.reduce(
        (acc, a) => acc + (a.quantidade || 0),
        0
      ) / avaliacoes.length
    );
  }, [avaliacoes]);

  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        Avaliações dos clientes
      </h2>

      {avaliacoes.length === 0 ? (
        <p style={{ color: "#6b7280" }}>
          Ainda não há avaliações cadastradas.
        </p>
      ) : (
        <>
          {/* Resumo geral */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <ResumoCard
              titulo="Tempo de entrega"
              valor={mediaTempo.toFixed(1)}
            />
            <ResumoCard
              titulo="Tempero"
              valor={mediaTempero.toFixed(1)}
            />
            <ResumoCard
              titulo="Quantidade"
              valor={mediaQuantidade.toFixed(1)}
            />
            <ResumoCard
              titulo="Total de avaliações"
              valor={String(avaliacoes.length)}
            />
          </div>

          {/* Lista detalhada */}
          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#111827",
                    color: "white",
                  }}
                >
                  <th style={th}>Data</th>
                  <th style={th}>Pedido</th>
                  <th style={th}>Tempo</th>
                  <th style={th}>Tempero</th>
                  <th style={th}>Quantidade</th>
                  <th style={th}>Comentário</th>
                </tr>
              </thead>
              <tbody>
                {avaliacoes.map((a) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom:
                        "1px solid #e5e7eb",
                      background: "#fff",
                    }}
                  >
                    <td style={td}>
                      {new Date(
                        a.criadoEm.seconds *
                          1000
                      ).toLocaleString("pt-BR")}
                    </td>
                    <td style={td}>
                      #{a.pedidoId.slice(0, 8)}
                    </td>
                    <td style={td}>
                      {a.tempoEntrega} ★
                    </td>
                    <td style={td}>
                      {a.tempero} ★
                    </td>
                    <td style={td}>
                      {a.quantidade} ★
                    </td>
                    <td
                      style={{
                        ...td,
                        maxWidth: 260,
                      }}
                    >
                      {a.comentario ? (
                        <span>{a.comentario}</span>
                      ) : (
                        <span
                          style={{
                            color: "#9ca3af",
                          }}
                        >
                          Sem comentário
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#111827",
        }}
      >
        {valor}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: 12,
};

const td: React.CSSProperties = {
  padding: "8px 12px",
  verticalAlign: "top",
};