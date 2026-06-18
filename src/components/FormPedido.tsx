"use client";

import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  Timestamp,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../lib/firebase";

type Prato = {
  id: string;
  nome: string;
  precoVenda: number;
  descricao: string;
  custoTotal: number;
  lucroUnitario: number;
  ativo: boolean;
};

type ItemPedido = {
  pratoId: string;
  prato: string;
  preco: number;
  quantidade: number;
  total: number;
  observacao?: string;
};

export default function FormPedido() {
  const [user] = useAuthState(auth);
  const [pratos, setPratos] = useState<Prato[]>([]);
  const [pratoSelecionado, setPratoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "cardapio"), where("ativo", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Prato[];
      setPratos(lista);
    });
    return () => unsubscribe();
  }, []);

  const enviarPedido = async () => {
    if (!user) {
      alert("Você precisa fazer login primeiro.");
      return;
    }
    if (!pratoSelecionado) {
      alert("Escolha um prato antes de enviar.");
      return;
    }

    const prato = pratos.find((p) => p.id === pratoSelecionado);
    if (!prato) {
      alert("Prato inválido.");
      return;
    }

    if (quantidade < 1) {
      alert("Quantidade deve ser pelo menos 1.");
      return;
    }

    const total = Number(prato.precoVenda || 0) * quantidade;

    const item: ItemPedido = {
      pratoId: prato.id,
      prato: prato.nome,
      preco: Number(prato.precoVenda || 0),
      quantidade,
      total,
      observacao: observacao || "",
    };

    try {
      setCarregando(true);

      await addDoc(collection(db, "pedidos"), {
        uid: user.uid,
        nome: user.displayName || "Sem nome",
        email: user.email || "Sem e-mail",
        // se quiser, pode incluir telefone/endereço se tiver do perfil
        itens: [item],
        totalPedido: total,
        status: "pendente",
        criadoEm: Timestamp.now(),
      });

      setPratoSelecionado("");
      setQuantidade(1);
      setObservacao("");
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Ocorreu um erro ao enviar o pedido.");
    } finally {
      setCarregando(false);
    }
  };

  if (!user) {
    return (
      <p style={{ marginTop: 20 }}>
        Faça login para conseguir fazer um pedido.
      </p>
    );
  }

  const pratoAtual = pratos.find((p) => p.id === pratoSelecionado);

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        Fazer pedido
      </h2>

      {pratos.length === 0 ? (
        <p style={{ color: "#888" }}>Nenhum prato disponível no momento.</p>
      ) : (
        <>
          <label style={label}>Escolha o prato</label>
          <select
            value={pratoSelecionado}
            onChange={(e) => setPratoSelecionado(e.target.value)}
            style={input}
          >
            <option value="">Selecione um prato</option>
            {pratos.map((prato) => (
              <option key={prato.id} value={prato.id}>
                {prato.nome} — R${" "}
                {Number(prato.precoVenda || 0).toFixed(2)}
              </option>
            ))}
          </select>

          {pratoAtual && (
            <div
              style={{
                padding: 10,
                background: "#f0fdf4",
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              <p>
                <strong>{pratoAtual.nome}</strong>
              </p>
              {pratoAtual.descricao && (
                <p style={{ color: "#555" }}>{pratoAtual.descricao}</p>
              )}
              <p
                style={{
                  color: "#16a34a",
                  fontWeight: "bold",
                }}
              >
                R$ {Number(pratoAtual.precoVenda || 0).toFixed(2)} por unidade
              </p>
            </div>
          )}

          <label style={label}>Quantidade</label>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            style={input}
          />

          <label style={label}>Observação</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: sem cebola, sem pimenta..."
            style={{ ...input, minHeight: 80 }}
          />

          {pratoAtual && (
            <p
              style={{
                marginBottom: 12,
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              Total: R${" "}
              {(Number(pratoAtual.precoVenda || 0) * quantidade).toFixed(2)}
            </p>
          )}

          <button
            onClick={enviarPedido}
            disabled={carregando}
            style={{
              padding: "12px 18px",
              background: carregando ? "#999" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              width: "100%",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {carregando ? "Enviando..." : "Enviar pedido"}
          </button>

          {sucesso && (
            <p
              style={{
                marginTop: 12,
                color: "green",
                fontWeight: "bold",
              }}
            >
              Pedido enviado com sucesso!
            </p>
          )}
        </>
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
  border: "1px solid #d1d5db",
  background: "#fff",
  marginBottom: 8,
};