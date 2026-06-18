"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

type Ingrediente = { nome: string; valor: number };

type Prato = {
  id: string;
  nome: string;
  precoVenda: number;
  descricao: string;
  foto: string;
  ingredientes: Ingrediente[];
  custoTotal: number;
  lucroUnitario: number;
  ativo: boolean;
};

export default function ListaCardapio() {
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [nome, setNome] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState("");
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { nome: "", valor: 0 },
  ]);
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editFoto, setEditFoto] = useState("");
  const [editIngredientes, setEditIngredientes] = useState<Ingrediente[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "cardapio"), (snap) => {
      setPratos(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Prato[]
      );
    });
    return () => unsubscribe();
  }, []);

  const calcCusto = (ings: Ingrediente[]) =>
    ings.reduce((a, i) => a + Number(i.valor || 0), 0);

  const addIng = () =>
    setIngredientes([...ingredientes, { nome: "", valor: 0 }]);
  const rmIng = (i: number) =>
    setIngredientes(ingredientes.filter((_, x) => x !== i));
  const upIng = (i: number, campo: keyof Ingrediente, val: string) => {
    const n = [...ingredientes];
    if (campo === "valor") n[i].valor = parseFloat(val) || 0;
    else n[i].nome = val;
    setIngredientes(n);
  };

  const addIngE = () =>
    setEditIngredientes([...editIngredientes, { nome: "", valor: 0 }]);
  const rmIngE = (i: number) =>
    setEditIngredientes(editIngredientes.filter((_, x) => x !== i));
  const upIngE = (i: number, campo: keyof Ingrediente, val: string) => {
    const n = [...editIngredientes];
    if (campo === "valor") n[i].valor = parseFloat(val) || 0;
    else n[i].nome = val;
    setEditIngredientes(n);
  };

  const adicionarPrato = async () => {
    if (!nome || !precoVenda) {
      alert("Preencha nome e preço.");
      return;
    }
    const custo = calcCusto(ingredientes);
    const venda = parseFloat(precoVenda);
    try {
      setCarregando(true);
      await addDoc(collection(db, "cardapio"), {
        nome,
        precoVenda: venda,
        descricao,
        foto,
        ingredientes,
        custoTotal: custo,
        lucroUnitario: venda - custo,
        ativo: true,
      });
      setNome("");
      setPrecoVenda("");
      setDescricao("");
      setFoto("");
      setIngredientes([{ nome: "", valor: 0 }]);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  const removerPrato = async (id: string) => {
    if (confirm("Remover este prato?")) {
      await deleteDoc(doc(db, "cardapio", id));
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await updateDoc(doc(db, "cardapio", id), { ativo: !ativo });
  };

  const iniciarEdicao = (p: Prato) => {
    setEditandoId(p.id);
    setEditNome(p.nome);
    setEditPreco(String(p.precoVenda));
    setEditDescricao(p.descricao || "");
    setEditFoto(p.foto || "");
    setEditIngredientes(p.ingredientes || []);
  };

  const salvarEdicao = async (id: string) => {
    if (!editNome || !editPreco) {
      alert("Preencha nome e preço.");
      return;
    }
    const custo = calcCusto(editIngredientes);
    const venda = parseFloat(editPreco);
    await updateDoc(doc(db, "cardapio", id), {
      nome: editNome,
      precoVenda: venda,
      descricao: editDescricao,
      foto: editFoto,
      ingredientes: editIngredientes,
      custoTotal: custo,
      lucroUnitario: venda - custo,
    });
    setEditandoId(null);
  };

  const custoP = calcCusto(ingredientes);
  const vendaP = parseFloat(precoVenda) || 0;

  return (
    <div>
      <h2
        style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}
      >
        Cardápio
      </h2>

      {/* Formulário */}
      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          marginBottom: 24,
          background: "#f9f9f9",
        }}
      >
        <h3
          style={{
            marginBottom: 12,
            fontWeight: "bold",
          }}
        >
          Adicionar novo prato
        </h3>

        <label style={lbl}>Nome do prato</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Frango grelhado"
          style={inp}
        />

        <label style={lbl}>Preço de venda (R$)</label>
        <input
          type="number"
          value={precoVenda}
          onChange={(e) => setPrecoVenda(e.target.value)}
          placeholder="Ex: 22.90"
          style={inp}
        />

        <label style={lbl}>Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Acompanha arroz, feijão e salada"
          style={{ ...inp, minHeight: 60 }}
        />

        <label style={lbl}>URL da foto do prato</label>
        <input
          value={foto}
          onChange={(e) => setFoto(e.target.value)}
          placeholder="https://..."
          style={inp}
        />
        {foto && (
          <img
            src={foto}
            alt="preview"
            style={{
              width: "100%",
              maxHeight: 180,
              objectFit: "cover",
              borderRadius: 10,
              marginBottom: 10,
            }}
          />
        )}

        <label style={{ ...lbl, marginTop: 14 }}>
          Ingredientes e custos
        </label>
        {ingredientes.map((ing, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <input
              placeholder="Ingrediente"
              value={ing.nome}
              onChange={(e) => upIng(i, "nome", e.target.value)}
              style={{
                flex: 2,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
            <input
              type="number"
              placeholder="R$"
              value={ing.valor}
              onChange={(e) => upIng(i, "valor", e.target.value)}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={() => rmIng(i)}
              style={{
                padding: "8px 10px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addIng}
          style={{
            padding: "8px 14px",
            background: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          + Ingrediente
        </button>

        {vendaP > 0 && (
          <div
            style={{
              padding: 12,
              background: "#f0fdf4",
              borderRadius: 10,
              marginBottom: 14,
              fontSize: 14,
            }}
          >
            <p>
              <strong>Custo:</strong> R$ {custoP.toFixed(2)}
            </p>
            <p>
              <strong>Venda:</strong> R$ {vendaP.toFixed(2)}
            </p>
            <p
              style={{
                color:
                  vendaP - custoP >= 0 ? "#16a34a" : "#dc2626",
                fontWeight: "bold",
              }}
            >
              <strong>Lucro por prato:</strong> R${" "}
              {(vendaP - custoP).toFixed(2)}
            </p>
          </div>
        )}

        <button
          onClick={adicionarPrato}
          disabled={carregando}
          style={{
            padding: "10px 18px",
            background: carregando ? "#999" : "#ea580c",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          {carregando ? "Salvando..." : "Adicionar prato"}
        </button>
      </div>

      {/* Lista */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {pratos.map((prato) => (
          <div
            key={prato.id}
            style={{
              padding: 14,
              border: `2px solid ${
                prato.ativo ? "#16a34a" : "#e5e7eb"
              }`,
              borderRadius: 10,
              background: prato.ativo ? "#f0fdf4" : "#f9f9f9",
            }}
          >
            {editandoId === prato.id ? (
              <div>
                <label style={lbl}>Nome</label>
                <input
                  value={editNome}
                  onChange={(e) =>
                    setEditNome(e.target.value)
                  }
                  style={inp}
                />
                <label style={lbl}>Preço de venda (R$)</label>
                <input
                  type="number"
                  value={editPreco}
                  onChange={(e) =>
                    setEditPreco(e.target.value)
                  }
                  style={inp}
                />
                <label style={lbl}>Descrição</label>
                <textarea
                  value={editDescricao}
                  onChange={(e) =>
                    setEditDescricao(e.target.value)
                  }
                  style={{ ...inp, minHeight: 60 }}
                />
                <label style={lbl}>URL da foto</label>
                <input
                  value={editFoto}
                  onChange={(e) =>
                    setEditFoto(e.target.value)
                  }
                  placeholder="https://..."
                  style={inp}
                />
                {editFoto && (
                  <img
                    src={editFoto}
                    alt="preview"
                    style={{
                      width: "100%",
                      maxHeight: 160,
                      objectFit: "cover",
                      borderRadius: 10,
                      marginBottom: 10,
                    }}
                  />
                )}
                <label
                  style={{
                    ...lbl,
                    marginTop: 12,
                  }}
                >
                  Ingredientes
                </label>
                {editIngredientes.map((ing, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <input
                      placeholder="Ingrediente"
                      value={ing.nome}
                      onChange={(e) =>
                        upIngE(i, "nome", e.target.value)
                      }
                      style={{
                        flex: 2,
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
                    />
                    <input
                      type="number"
                      placeholder="R$"
                      value={ing.valor}
                      onChange={(e) =>
                        upIngE(i, "valor", e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
                    />
                    <button
                      onClick={() => rmIngE(i)}
                      style={{
                        padding: "8px 10px",
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addIngE}
                  style={{
                    padding: "8px 14px",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    marginBottom: 12,
                  }}
                >
                  + Ingrediente
                </button>
                <div
                  style={{
                    padding: 12,
                    background: "#f0fdf4",
                    borderRadius: 10,
                    marginBottom: 12,
                    fontSize: 14,
                  }}
                >
                  <p>
                    <strong>Custo:</strong> R${" "}
                    {calcCusto(editIngredientes).toFixed(2)}
                  </p>
                  <p>
                    <strong>Venda:</strong> R${" "}
                    {parseFloat(editPreco || "0").toFixed(2)}
                  </p>
                  <p
                    style={{
                      color:
                        parseFloat(editPreco || "0") -
                          calcCusto(editIngredientes) >=
                        0
                          ? "#16a34a"
                          : "#dc2626",
                      fontWeight: "bold",
                    }}
                  >
                    <strong>Lucro:</strong> R${" "}
                    {(
                      parseFloat(editPreco || "0") -
                      calcCusto(editIngredientes)
                    ).toFixed(2)}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => salvarEdicao(prato.id)}
                    style={{
                      padding: "8px 16px",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    style={{
                      padding: "8px 16px",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {prato.foto && (
                  <img
                    src={prato.foto}
                    alt={prato.nome}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 10,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {prato.nome}
                  </p>
                  {prato.descricao && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#555",
                      }}
                    >
                      {prato.descricao}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      display: "flex",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: "#2563eb",
                        fontWeight: "bold",
                      }}
                    >
                      Venda: R${" "}
                      {Number(prato.precoVenda || 0).toFixed(2)}
                    </span>
                    <span
                      style={{
                        color: "#dc2626",
                      }}
                    >
                      Custo: R${" "}
                      {Number(prato.custoTotal || 0).toFixed(2)}
                    </span>
                    <span
                      style={{
                        color: "#16a34a",
                        fontWeight: "bold",
                      }}
                    >
                      Lucro: R${" "}
                      {Number(prato.lucroUnitario || 0).toFixed(2)}
                    </span>
                  </div>
                  {prato.ingredientes?.length > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "#666",
                      }}
                    >
                      <strong>Ingredientes:</strong>{" "}
                      {prato.ingredientes.map((ing, i) => (
                        <span key={i}>
                          {ing.nome} (R${" "}
                          {Number(ing.valor).toFixed(2)})
                          {i <
                          prato.ingredientes.length - 1
                            ? ", "
                            : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 8,
                      padding: "2px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: "bold",
                      background: prato.ativo
                        ? "#16a34a"
                        : "#9ca3af",
                      color: "white",
                    }}
                  >
                    {prato.ativo
                      ? "Visível para clientes"
                      : "Oculto"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() =>
                      toggleAtivo(prato.id, prato.ativo)
                    }
                    style={{
                      padding: "6px 12px",
                      background: prato.ativo
                        ? "#f59e0b"
                        : "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {prato.ativo ? "Ocultar" : "Liberar"}
                  </button>
                  <button
                    onClick={() => iniciarEdicao(prato)}
                    style={{
                      padding: "6px 12px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removerPrato(prato.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  marginTop: 10,
  fontWeight: 600,
  fontSize: 14,
};
const inp: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  marginBottom: 4,
};