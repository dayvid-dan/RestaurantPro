"use client";

import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  Timestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { auth, provider, db } from "../lib/firebase";

type Prato = {
  id: string;
  nome: string;
  precoVenda: number;
  descricao: string;
  foto?: string;
  ativo: boolean;
};

type ItemCarrinho = {
  pratoId: string;
  prato: string;
  preco: number;
  quantidade: number;
  observacao: string;
};

type ItemPedido = {
  pratoId: string;
  prato: string;
  preco: number;
  quantidade: number;
  total: number;
  observacao: string;
};

type DadosCliente = {
  uid: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
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

type Avaliacao = {
  id?: string;
  pedidoId: string;
  uid: string;
  tempoEntrega: number;
  tempero: number;
  quantidade: number;
  comentario?: string;
  criadoEm: { seconds: number };
};

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

// coloque seu número de WhatsApp no formato 5538999999999
const WHATSAPP = "";

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
  border: "1px solid #e5e7eb",
  marginBottom: 8,
  background: "#fff",
  fontSize: 14,
};
const btnQtdPequeno: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
};

export default function PaginaCliente() {
  const [user] = useAuthState(auth);

  const [pratos, setPratos] = useState<Prato[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // cadastro/login
  const [mostraFormCadastro, setMostraFormCadastro] = useState(false);
  const [emailCadastro, setEmailCadastro] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [telefoneCadastro, setTelefoneCadastro] = useState("");
  const [enderecoCadastro, setEnderecoCadastro] = useState("");

  const [mostraFormLogin, setMostraFormLogin] = useState(false);
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // abas
  const [aba, setAba] = useState<"cardapio" | "pedidos" | "perfil">(
    "cardapio"
  );

  // perfil
  const [dadosCliente, setDadosCliente] =
    useState<DadosCliente | null>(null);
  const [mostraEditarPerfil, setMostraEditarPerfil] =
    useState(false);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [carregandoPerfil, setCarregandoPerfil] =
    useState(false);

  // avaliação dos pedidos
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [avaliandoPedidoId, setAvaliandoPedidoId] =
    useState<string | null>(null);
  const [tempoEntregaNota, setTempoEntregaNota] = useState(0);
  const [temperoNota, setTemperoNota] = useState(0);
  const [quantidadeNota, setQuantidadeNota] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] =
    useState("");
  const [salvandoAvaliacao, setSalvandoAvaliacao] =
    useState(false);

  // CARDÁPIO
  useEffect(() => {
    const q = query(
      collection(db, "cardapio"),
      where("ativo", "==", true)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPratos(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Prato[]
      );
    });
    return () => unsub();
  }, []);

  // AVALIAÇÕES DO USUÁRIO
  useEffect(() => {
    if (!user) {
      setAvaliacoes([]);
      return;
    }

    const q = query(
      collection(db, "avaliacoes"),
      where("uid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setAvaliacoes(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Avaliacao[]
      );
    });

    return () => unsub();
  }, [user]);

  // PEDIDOS DO USUÁRIO
  useEffect(() => {
    if (!user) {
      setPedidos([]);
      return;
    }
    const q = query(
      collection(db, "pedidos"),
      where("uid", "==", user.uid),
      orderBy("criadoEm", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPedidos(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Pedido[]
      );
    });
    return () => unsub();
  }, [user]);

  // PERFIL DO USUÁRIO (coleção "clientes")
  useEffect(() => {
  if (!user) {
    setDadosCliente(null);
    return;
  }

  const buscarDadosCliente = async () => {
    try {
      const docRef = doc(db, "clientes", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dados = docSnap.data() as DadosCliente;
        setDadosCliente(dados);
        setEditNome(dados.nome);
        setEditTelefone(dados.telefone);
        setEditEndereco(dados.endereco);
      } else {
        console.log("Nenhum documento em /clientes para", user.uid);
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados do cliente:", error);
    }
  };

  buscarDadosCliente();
}, [user]);

  // CADASTRO
const fazerCadastro = async () => {
  if (
    !emailCadastro ||
    !senhaCadastro ||
    !nomeCadastro ||
    !telefoneCadastro ||
    !enderecoCadastro
  ) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    setCarregando(true);

    const cred = await createUserWithEmailAndPassword(
      auth,
      emailCadastro,
      senhaCadastro
    );

    if (!cred.user) {
      alert("Usuário não retornado pelo Firebase.");
      return;
    }

    // Atualiza displayName
    await updateProfile(cred.user, { displayName: nomeCadastro });

    // Salva perfil na coleção "clientes"
    const uid = cred.user.uid;
    const perfil: DadosCliente = {
      uid,
      nome: nomeCadastro,
      email: emailCadastro,
      telefone: telefoneCadastro,
      endereco: enderecoCadastro,
    };

    await setDoc(doc(db, "clientes", uid), perfil);

    // JÁ ATUALIZA O STATE LOCAL
    setDadosCliente(perfil);
    setEditNome(perfil.nome);
    setEditTelefone(perfil.telefone);
    setEditEndereco(perfil.endereco);

    setMostraFormCadastro(false);
    setEmailCadastro("");
    setSenhaCadastro("");
    setNomeCadastro("");
    setTelefoneCadastro("");
    setEnderecoCadastro("");
    setSucesso(true);
    setTimeout(() => setSucesso(false), 2000);
  } catch (e: any) {
    console.error("Erro ao cadastrar:", e);
    alert(`Erro ao cadastrar: ${e.message}`);
  } finally {
    setCarregando(false);
  }
};
  // LOGIN
  const fazerLogin = async () => {
    if (!emailLogin || !senhaLogin) {
      alert("Preencha e-mail e senha.");
      return;
    }
    try {
      setCarregando(true);
      await signInWithEmailAndPassword(
        auth,
        emailLogin,
        senhaLogin
      );
      setMostraFormLogin(false);
      setEmailLogin("");
      setSenhaLogin("");
    } catch (e: any) {
      alert(`Erro ao fazer login: ${e.message}`);
    } finally {
      setCarregando(false);
    }
  };

  const loginComGoogle = async () => {
    try {
      setCarregando(true);
      await signInWithPopup(auth, provider);
      setMostraFormLogin(false);
      setMostraFormCadastro(false);
      setEmailLogin("");
      setSenhaLogin("");
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao entrar com Google: ${e.message}`);
    } finally {
      setCarregando(false);
    }
  };

  // CARRINHO
  const adicionarAoCarrinho = (prato: Prato) => {
    const itemExistente = carrinho.find(
      (item) => item.pratoId === prato.id
    );
    if (itemExistente) {
      setCarrinho(
        carrinho.map((item) =>
          item.pratoId === prato.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setCarrinho([
        ...carrinho,
        {
          pratoId: prato.id,
          prato: prato.nome,
          preco: prato.precoVenda,
          quantidade: 1,
          observacao: "",
        },
      ]);
    }
  };

  const removerDoCarrinho = (pratoId: string) => {
    setCarrinho(
      carrinho.filter((item) => item.pratoId !== pratoId)
    );
  };

  const atualizarQuantidade = (
    pratoId: string,
    novaQtd: number
  ) => {
    if (novaQtd < 1) {
      removerDoCarrinho(pratoId);
      return;
    }
    setCarrinho(
      carrinho.map((item) =>
        item.pratoId === pratoId
          ? { ...item, quantidade: novaQtd }
          : item
      )
    );
  };

  const atualizarObservacao = (pratoId: string, obs: string) => {
    setCarrinho(
      carrinho.map((item) =>
        item.pratoId === pratoId
          ? { ...item, observacao: obs }
          : item
      )
    );
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  // PERFIL – SALVAR
  const salvarPerfil = async () => {
    if (!user) return;
    if (!editNome || !editTelefone || !editEndereco) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      setCarregandoPerfil(true);

      await setDoc(doc(db, "clientes", user.uid), {
        uid: user.uid,
        nome: editNome,
        email: user.email,
        telefone: editTelefone,
        endereco: editEndereco,
      });

      const dados: DadosCliente = {
        uid: user.uid,
        nome: editNome,
        email: user.email || "",
        telefone: editTelefone,
        endereco: editEndereco,
      };

      setDadosCliente(dados);
      setTelefoneCadastro(editTelefone);
      setEnderecoCadastro(editEndereco);
      setMostraEditarPerfil(false);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2000);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar perfil.");
    } finally {
      setCarregandoPerfil(false);
    }
  };

  // ENVIAR PEDIDO
  const enviarPedido = async () => {
    if (!user) {
      alert("Faça login primeiro.");
      return;
    }
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    const telefoneFinal =
      dadosCliente?.telefone || telefoneCadastro;
    const enderecoFinal =
      dadosCliente?.endereco || enderecoCadastro;

    if (!telefoneFinal) {
      alert("Complete seu perfil com telefone.");
      return;
    }
    if (!enderecoFinal) {
      alert("Complete seu perfil com endereço.");
      return;
    }

    try {
      setCarregando(true);

      const itensFormatados: ItemPedido[] = carrinho.map(
        (item) => ({
          pratoId: item.pratoId,
          prato: item.prato,
          preco: item.preco,
          quantidade: item.quantidade,
          total: item.preco * item.quantidade,
          observacao: item.observacao,
        })
      );

      await addDoc(collection(db, "pedidos"), {
        uid: user.uid,
        nome:
          dadosCliente?.nome ||
          user.displayName ||
          "Sem nome",
        email: user.email || "",
        telefone: telefoneFinal,
        endereco: enderecoFinal,
        itens: itensFormatados,
        totalPedido: totalCarrinho,
        status: "pendente",
        criadoEm: Timestamp.now(),
      });

      setCarrinho([]);
      setSucesso(true);
      setAba("pedidos");
      setTimeout(() => setSucesso(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar pedido.");
    } finally {
      setCarregando(false);
    }
  };

  // SALVAR AVALIAÇÃO
  const salvarAvaliacao = async () => {
    if (!user || !avaliandoPedidoId) return;

    if (!tempoEntregaNota || !temperoNota || !quantidadeNota) {
      alert(
        "Avalie tempo de entrega, tempero e quantidade."
      );
      return;
    }

    try {
      setSalvandoAvaliacao(true);

      await addDoc(collection(db, "avaliacoes"), {
        pedidoId: avaliandoPedidoId,
        uid: user.uid,
        tempoEntrega: tempoEntregaNota,
        tempero: temperoNota,
        quantidade: quantidadeNota,
        comentario: comentarioAvaliacao,
        criadoEm: Timestamp.now(),
      });

      setAvaliandoPedidoId(null);
      setTempoEntregaNota(0);
      setTemperoNota(0);
      setQuantidadeNota(0);
      setComentarioAvaliacao("");
      alert("Obrigado pela sua avaliação!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar avaliação.");
    } finally {
      setSalvandoAvaliacao(false);
    }
  };

  return (
    <div
      style={{
        background: "#f3f4f6",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "#ea580c",
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "bold",
              margin: 0,
            }}
          >
            🍱 RestaurantPro
          </h1>
          <p
            style={{
              color: "#fed7aa",
              fontSize: 12,
              margin: 0,
            }}
          >
            Peça agora e receba em casa
          </p>
        </div>
        {user ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "2px solid white",
                }}
              />
            )}
            <button
              onClick={() => signOut(auth)}
              style={{
                padding: "6px 12px",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid white",
                borderRadius: 999,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Sair
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setMostraFormLogin(true);
                setMostraFormCadastro(false);
              }}
              style={{
                padding: "8px 14px",
                background: "white",
                color: "#ea580c",
                borderRadius: 999,
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMostraFormCadastro(true);
                setMostraFormLogin(false);
              }}
              style={{
                padding: "8px 14px",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid white",
                borderRadius: 999,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cadastrar
            </button>
          </div>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "16px 14px",
        }}
      >
        {!user ? (
          /* TELAS DE LOGIN / CADASTRO */
          <div>
            {mostraFormCadastro && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <h2
                  style={{
                    fontWeight: "bold",
                    marginBottom: 14,
                    fontSize: 18,
                  }}
                >
                  Criar conta
                </h2>
                <label style={lbl}>Nome completo</label>
                <input
                  type="text"
                  value={nomeCadastro}
                  onChange={(e) =>
                    setNomeCadastro(e.target.value)
                  }
                  placeholder="Seu nome"
                  style={inp}
                />
                <label style={lbl}>E-mail</label>
                <input
                  type="email"
                  value={emailCadastro}
                  onChange={(e) =>
                    setEmailCadastro(e.target.value)
                  }
                  placeholder="seu@email.com"
                  style={inp}
                />
                <label style={lbl}>Senha</label>
                <input
                  type="password"
                  value={senhaCadastro}
                  onChange={(e) =>
                    setSenhaCadastro(e.target.value)
                  }
                  placeholder="Mínimo 6 caracteres"
                  style={inp}
                />
                <label style={lbl}>Telefone</label>
                <input
                  type="tel"
                  value={telefoneCadastro}
                  onChange={(e) =>
                    setTelefoneCadastro(
                      e.target.value
                    )
                  }
                  placeholder="(38) 99999-9999"
                  style={inp}
                />
                <label style={lbl}>Endereço</label>
                <textarea
                  value={enderecoCadastro}
                  onChange={(e) =>
                    setEnderecoCadastro(
                      e.target.value
                    )
                  }
                  placeholder="Rua, número, bairro..."
                  style={{ ...inp, minHeight: 70 }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={fazerCadastro}
                    disabled={carregando}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: carregando
                        ? "#9ca3af"
                        : "#ea580c",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {carregando
                      ? "Criando..."
                      : "Criar conta"}
                  </button>
                  <button
                    onClick={() =>
                      setMostraFormCadastro(false)
                    }
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "#e5e7eb",
                      color: "#374151",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {mostraFormLogin && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <h2
                  style={{
                    fontWeight: "bold",
                    marginBottom: 14,
                    fontSize: 18,
                  }}
                >
                  Fazer login
                </h2>
                <label style={lbl}>E-mail</label>
                <input
                  type="email"
                  value={emailLogin}
                  onChange={(e) =>
                    setEmailLogin(e.target.value)
                  }
                  placeholder="seu@email.com"
                  style={inp}
                />
                <label style={lbl}>Senha</label>
                <input
                  type="password"
                  value={senhaLogin}
                  onChange={(e) =>
                    setSenhaLogin(e.target.value)
                  }
                  placeholder="Sua senha"
                  style={inp}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={fazerLogin}
                    disabled={carregando}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: carregando
                        ? "#9ca3af"
                        : "#ea580c",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {carregando
                      ? "Entrando..."
                      : "Entrar"}
                  </button>
                  <button
                    onClick={() =>
                      setMostraFormLogin(false)
                    }
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "#e5e7eb",
                      color: "#374151",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
                <p
                  style={{
                    textAlign: "center",
                    marginTop: 12,
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  Ou entre com Google
                </p>
                <button
                  onClick={loginComGoogle}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#fff",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  🔵 Entrar com Google
                </button>
              </div>
            )}

            {!mostraFormCadastro &&
              !mostraFormLogin && (
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: 60,
                  }}
                >
                  <div
                    style={{
                      fontSize: 64,
                      marginBottom: 16,
                    }}
                  >
                    🍱
                  </div>
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    Bem-vindo ao RestaurantPro!
                  </h2>
                  <p
                    style={{
                      color: "#6b7280",
                      marginBottom: 24,
                    }}
                  >
                    Faça login ou crie uma conta para
                    fazer seu pedido
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <button
                      onClick={() => {
                        setMostraFormLogin(true);
                        setMostraFormCadastro(false);
                      }}
                      style={{
                        padding: "14px 28px",
                        background: "#ea580c",
                        color: "white",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => {
                        setMostraFormCadastro(true);
                        setMostraFormLogin(false);
                      }}
                      style={{
                        padding: "14px 28px",
                        background: "#fff",
                        color: "#ea580c",
                        border:
                          "2px solid #ea580c",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      Criar conta
                    </button>
                  </div>

                  <button
                    onClick={loginComGoogle}
                    style={{
                      marginTop: 12,
                      padding: "10px 20px",
                      background: "#fff",
                      color: "#374151",
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    🔵 Entrar com Google
                  </button>
                </div>
              )}
          </div>
        ) : (
          <>
            {/* ABAS */}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 18,
                background: "#fff",
                padding: 5,
                borderRadius: 999,
                boxShadow:
                  "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <button
                onClick={() => setAba("cardapio")}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: "bold",
                  background:
                    aba === "cardapio"
                      ? "#ea580c"
                      : "transparent",
                  color:
                    aba === "cardapio"
                      ? "white"
                      : "#6b7280",
                }}
              >
                Cardápio
              </button>
              <button
                onClick={() => setAba("pedidos")}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: "bold",
                  background:
                    aba === "pedidos"
                      ? "#ea580c"
                      : "transparent",
                  color:
                    aba === "pedidos"
                      ? "white"
                      : "#6b7280",
                  position: "relative",
                }}
              >
                Meus Pedidos
                {pedidos.filter(
                  (p) =>
                    p.status !== "entregue"
                ).length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 10,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#dc2626",
                      color: "white",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {
                      pedidos.filter(
                        (p) =>
                          p.status !==
                          "entregue"
                      ).length
                    }
                  </span>
                )}
              </button>
              <button
                onClick={() => setAba("perfil")}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: "bold",
                  background:
                    aba === "perfil"
                      ? "#ea580c"
                      : "transparent",
                  color:
                    aba === "perfil"
                      ? "white"
                      : "#6b7280",
                }}
              >
                👤 Perfil
              </button>
            </div>

            {/* CARDÁPIO */}
            {aba === "cardapio" && (
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 12,
                  }}
                >
                  O que vai pedir hoje?
                </h2>
                {pratos.length === 0 ? (
                  <p
                    style={{
                      color: "#9ca3af",
                      textAlign: "center",
                      padding: 40,
                    }}
                  >
                    Nenhum prato disponível no
                    momento.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginBottom: 18,
                    }}
                  >
                    {pratos.map((prato) => (
                      <div
                        key={prato.id}
                        style={{
                          display: "flex",
                          background: "#fff",
                          borderRadius: 14,
                          overflow: "hidden",
                          boxShadow:
                            "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                      >
                        {prato.foto ? (
                          <img
                            src={prato.foto}
                            alt={prato.nome}
                            style={{
                              width: 110,
                              height: 110,
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 110,
                              height: 110,
                              background: "#f3f4f6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 36,
                              flexShrink: 0,
                            }}
                          >
                            🍽️
                          </div>
                        )}
                        <div
                          style={{
                            padding: 12,
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent:
                              "space-between",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontWeight:
                                  "bold",
                                fontSize: 15,
                                marginBottom: 4,
                              }}
                            >
                              {prato.nome}
                            </p>
                            {prato.descricao && (
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "#6b7280",
                                }}
                              >
                                {
                                  prato.descricao
                                }
                              </p>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems: "center",
                            }}
                          >
                            <p
                              style={{
                                color:
                                  "#ea580c",
                                fontWeight:
                                  "bold",
                                fontSize: 16,
                                margin: 0,
                              }}
                            >
                              R${" "}
                              {Number(
                                prato.precoVenda ||
                                  0
                              ).toFixed(2)}
                            </p>
                            <button
                              onClick={() =>
                                adicionarAoCarrinho(
                                  prato
                                )
                              }
                              style={{
                                padding:
                                  "6px 12px",
                                background:
                                  "#ea580c",
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight:
                                  "bold",
                                fontSize: 13,
                              }}
                            >
                              + Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {carrinho.length > 0 && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: 18,
                      boxShadow:
                        "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <h3
                      style={{
                        fontWeight: "bold",
                        marginBottom: 14,
                        fontSize: 16,
                      }}
                    >
                      🛒 Seu carrinho (
                      {carrinho.length} item
                      {carrinho.length !== 1
                        ? "ns"
                        : ""}
                      )
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      {carrinho.map((item) => (
                        <div
                          key={item.pratoId}
                          style={{
                            background:
                              "#f3f4f6",
                            borderRadius: 10,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "flex-start",
                              marginBottom: 8,
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontWeight:
                                    "bold",
                                  marginBottom: 2,
                                  fontSize: 14,
                                }}
                              >
                                {item.prato}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  color:
                                    "#6b7280",
                                }}
                              >
                                R${" "}
                                {item.preco.toFixed(
                                  2
                                )}{" "}
                                x{" "}
                                {
                                  item.quantidade
                                }{" "}
                                = R${" "}
                                {(
                                  item.preco *
                                  item.quantidade
                                ).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                removerDoCarrinho(
                                  item.pratoId
                                )
                              }
                              style={{
                                padding:
                                  "4px 8px",
                                background:
                                  "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight:
                                  "bold",
                              }}
                            >
                              ✕
                            </button>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <button
                              onClick={() =>
                                atualizarQuantidade(
                                  item.pratoId,
                                  item.quantidade -
                                    1
                                )
                              }
                              style={
                                btnQtdPequeno
                              }
                            >
                              -
                            </button>
                            <span
                              style={{
                                fontWeight:
                                  "bold",
                                minWidth: 30,
                                textAlign:
                                  "center",
                              }}
                            >
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() =>
                                atualizarQuantidade(
                                  item.pratoId,
                                  item.quantidade +
                                    1
                                )
                              }
                              style={
                                btnQtdPequeno
                              }
                            >
                              +
                            </button>
                          </div>

                          <textarea
                            value={
                              item.observacao
                            }
                            onChange={(e) =>
                              atualizarObservacao(
                                item.pratoId,
                                e.target.value
                              )
                            }
                            placeholder="Adicione uma observação (opcional)"
                            style={{
                              width: "100%",
                              padding: 8,
                              borderRadius: 6,
                              border:
                                "1px solid #e5e7eb",
                              fontSize: 12,
                              minHeight: 50,
                              fontFamily:
                                "system-ui, sans-serif",
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        borderTop:
                          "1px solid #e5e7eb",
                        paddingTop: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color:
                              "#6b7280",
                            fontWeight:
                              "bold",
                          }}
                        >
                          Total do carrinho
                        </span>
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight:
                              "bold",
                            color:
                              "#ea580c",
                          }}
                        >
                          R${" "}
                          {totalCarrinho.toFixed(
                            2
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={enviarPedido}
                      disabled={carregando}
                      style={{
                        width: "100%",
                        padding: 13,
                        background: carregando
                          ? "#9ca3af"
                          : "#ea580c",
                        color: "white",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight:
                          "bold",
                        fontSize: 16,
                        marginBottom: 8,
                      }}
                    >
                      {carregando
                        ? "Enviando..."
                        : "✅ Confirmar Pedido"}
                    </button>

                    <button
                      onClick={() =>
                        setCarrinho([])
                      }
                      style={{
                        width: "100%",
                        padding: 10,
                        background: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight:
                          "bold",
                      }}
                    >
                      Limpar carrinho
                    </button>

                    {sucesso && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 12,
                          background:
                            "#f0fdf4",
                          borderRadius: 10,
                          textAlign: "center",
                          color:
                            "#16a34a",
                          fontWeight:
                            "bold",
                        }}
                      >
                        ✅ Pedido enviado com
                        sucesso!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PEDIDOS */}
            {aba === "pedidos" && (
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 12,
                  }}
                >
                  Meus pedidos
                </h2>
                {pedidos.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#9ca3af",
                    }}
                  >
                    <p>
                      Você ainda não fez
                      nenhum pedido.
                    </p>
                    <button
                      onClick={() =>
                        setAba("cardapio")
                      }
                      style={{
                        marginTop: 12,
                        padding: "10px 20px",
                        background:
                          "#ea580c",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight:
                          "bold",
                      }}
                    >
                      Ver cardápio
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection:
                        "column",
                      gap: 10,
                    }}
                  >
                    {pedidos.map((pedido) => (
                      <div
                        key={pedido.id}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: 14,
                          boxShadow:
                            "0 1px 4px rgba(0,0,0,0.06)",
                          borderLeft: `5px solid ${
                            statusCor[
                              pedido.status
                            ] || "#e5e7eb"
                          }`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            flexWrap: "wrap",
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontWeight:
                                  "bold",
                                fontSize: 15,
                                marginBottom: 2,
                              }}
                            >
                              Pedido #
                              {pedido.id.slice(
                                0,
                                8
                              )}
                            </p>
                            <p
                              style={{
                                fontSize: 12,
                                color:
                                  "#6b7280",
                              }}
                            >
                              {new Date(
                                pedido
                                  .criadoEm
                                  .seconds *
                                  1000
                              ).toLocaleString(
                                "pt-BR"
                              )}
                            </p>
                          </div>
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "5px 12px",
                              borderRadius:
                                999,
                              background:
                                statusCor[
                                  pedido
                                    .status
                                ] ||
                                "#e5e7eb",
                              color:
                                "white",
                              fontSize: 12,
                              fontWeight:
                                "bold",
                            }}
                          >
                            {statusLabel[
                              pedido.status
                            ] ||
                              pedido.status}
                          </span>
                        </div>

                        <div
                          style={{
                            background:
                              "#f3f4f6",
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <p
                            style={{
                              fontWeight:
                                "bold",
                              marginBottom: 8,
                              fontSize: 13,
                            }}
                          >
                            Itens (
                            {pedido.itens
                              ?.length ||
                              0}
                            ):
                          </p>
                          {pedido.itens &&
                          pedido.itens.length >
                            0 ? (
                            pedido.itens.map(
                              (
                                item,
                                idx
                              ) => (
                                <div
                                  key={
                                    idx
                                  }
                                  style={{
                                    fontSize: 12,
                                    color:
                                      "#374151",
                                    marginBottom:
                                      idx !==
                                      pedido
                                        .itens
                                        .length -
                                        1
                                        ? 6
                                        : 0,
                                  }}
                                >
                                  <strong>
                                    {
                                      item.prato
                                    }
                                  </strong>{" "}
                                  x
                                  {
                                    item.quantidade
                                  }{" "}
                                  = R${" "}
                                  {(
                                    item.total ||
                                    0
                                  ).toFixed(
                                    2
                                  )}
                                  {item.observacao && (
                                    <p
                                      style={{
                                        fontSize: 11,
                                        color:
                                          "#6b7280",
                                        marginTop: 2,
                                      }}
                                    >
                                      💬{" "}
                                      {
                                        item.observacao
                                      }
                                    </p>
                                  )}
                                </div>
                              )
                            )
                          ) : (
                            <p
                              style={{
                                fontSize: 12,
                                color:
                                  "#6b7280",
                              }}
                            >
                              Nenhum item
                            </p>
                          )}
                        </div>

                        <p
                          style={{
                            fontSize: 13,
                            marginBottom: 4,
                          }}
                        >
                          <strong>
                            Total:
                          </strong>{" "}
                          <span
                            style={{
                              color:
                                "#ea580c",
                              fontWeight:
                                "bold",
                            }}
                          >
                            R${" "}
                            {Number(
                              pedido.totalPedido ||
                                0
                            ).toFixed(2)}
                          </span>
                        </p>

                        {pedido.telefone && (
                          <p
                            style={{
                              fontSize: 13,
                              color:
                                "#374151",
                              marginBottom: 2,
                            }}
                          >
                            📞{" "}
                            {
                              pedido.telefone
                            }
                          </p>
                        )}
                        {pedido.endereco && (
                          <p
                            style={{
                              fontSize: 13,
                              color:
                                "#374151",
                              marginBottom: 8,
                            }}
                          >
                            📍{" "}
                            {
                              pedido.endereco
                            }
                          </p>
                        )}

                        <a
                          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                            `Olá! Tenho uma dúvida sobre meu pedido #${pedido.id.slice(
                              0,
                              8
                            )}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display:
                              "inline-block",
                            padding:
                              "8px 12px",
                            background:
                              "#16a34a",
                            color: "white",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight:
                              "bold",
                            textDecoration:
                              "none",
                            marginBottom: 8,
                          }}
                        >
                          💬 WhatsApp
                        </a>

                        {/* Bloco de avaliação para pedidos entregues */}
                        {pedido.status ===
                          "entregue" &&
                          !avaliacoes.some(
                            (a) =>
                              a.pedidoId ===
                              pedido.id
                          ) && (
                            <div
                              style={{
                                marginTop: 8,
                                paddingTop: 10,
                                borderTop:
                                  "1px solid #e5e7eb",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight:
                                    "bold",
                                  marginBottom: 6,
                                }}
                              >
                                Avalie seu
                                pedido
                              </p>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexDirection:
                                    "column",
                                  gap: 6,
                                  fontSize: 13,
                                }}
                              >
                                <div>
                                  <span>
                                    Tempo de
                                    entrega:{" "}
                                  </span>
                                  {[1, 2, 3, 4, 5].map(
                                    (n) => (
                                      <button
                                        key={
                                          n
                                        }
                                        onClick={() =>
                                          setTempoEntregaNota(
                                            n
                                          )
                                        }
                                        style={{
                                          border:
                                            "none",
                                          background:
                                            "transparent",
                                          cursor:
                                            "pointer",
                                          fontSize: 18,
                                          color:
                                            n <=
                                            tempoEntregaNota
                                              ? "#facc15"
                                              : "#d1d5db",
                                        }}
                                      >
                                        ★
                                      </button>
                                    )
                                  )}
                                </div>
                                <div>
                                  <span>
                                    Tempero:{" "}
                                  </span>
                                  {[1, 2, 3, 4, 5].map(
                                    (n) => (
                                      <button
                                        key={
                                          n
                                        }
                                        onClick={() =>
                                          setTemperoNota(
                                            n
                                          )
                                        }
                                        style={{
                                          border:
                                            "none",
                                          background:
                                            "transparent",
                                          cursor:
                                            "pointer",
                                          fontSize: 18,
                                          color:
                                            n <=
                                            temperoNota
                                              ? "#facc15"
                                              : "#d1d5db",
                                        }}
                                      >
                                        ★
                                      </button>
                                    )
                                  )}
                                </div>
                                <div>
                                  <span>
                                    Quantidade:{" "}
                                  </span>
                                  {[1, 2, 3, 4, 5].map(
                                    (n) => (
                                      <button
                                        key={
                                          n
                                        }
                                        onClick={() =>
                                          setQuantidadeNota(
                                            n
                                          )
                                        }
                                        style={{
                                          border:
                                            "none",
                                          background:
                                            "transparent",
                                          cursor:
                                            "pointer",
                                          fontSize: 18,
                                          color:
                                            n <=
                                            quantidadeNota
                                              ? "#facc15"
                                              : "#d1d5db",
                                        }}
                                      >
                                        ★
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>

                              <textarea
                                value={
                                  comentarioAvaliacao
                                }
                                onChange={(e) =>
                                  setComentarioAvaliacao(
                                    e.target.value
                                  )
                                }
                                placeholder="Deixe um comentário (opcional)"
                                style={{
                                  marginTop: 8,
                                  width: "100%",
                                  padding: 8,
                                  borderRadius: 6,
                                  border:
                                    "1px solid #e5e7eb",
                                  fontSize: 12,
                                  minHeight: 50,
                                  fontFamily:
                                    "system-ui, sans-serif",
                                }}
                              />

                              <button
                                onClick={() => {
                                  setAvaliandoPedidoId(
                                    pedido.id
                                  );
                                  salvarAvaliacao();
                                }}
                                disabled={
                                  salvandoAvaliacao
                                }
                                style={{
                                  marginTop: 8,
                                  padding:
                                    "8px 12px",
                                  background:
                                    salvandoAvaliacao
                                      ? "#9ca3af"
                                      : "#16a34a",
                                  color:
                                    "white",
                                  border:
                                    "none",
                                  borderRadius: 8,
                                  cursor:
                                    "pointer",
                                  fontSize: 13,
                                  fontWeight:
                                    "bold",
                                }}
                              >
                                {salvandoAvaliacao
                                  ? "Enviando..."
                                  : "Enviar avaliação"}
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PERFIL */}
            {aba === "perfil" && (
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 12,
                  }}
                >
                  Meu Perfil
                </h2>

                {!mostraEditarPerfil ? (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: 18,
                      boxShadow:
                        "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        Nome
                      </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        {dadosCliente?.nome ||
                          "Não informado"}
                      </p>
                    </div>

                    <div
                      style={{
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        E-mail
                      </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        {user?.email}
                      </p>
                    </div>

                    <div
                      style={{
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        Telefone
                      </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        {dadosCliente?.telefone ||
                          "Não informado"}
                      </p>
                    </div>

                    <div
                      style={{
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        Endereço
                      </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        {dadosCliente?.endereco ||
                          "Não informado"}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setMostraEditarPerfil(
                          true
                        )
                      }
                      style={{
                        width: "100%",
                        padding: 12,
                        background:
                          "#ea580c",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight:
                          "bold",
                      }}
                    >
                      ✏️ Editar Perfil
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: 18,
                      boxShadow:
                        "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <h3
                      style={{
                        fontWeight: "bold",
                        marginBottom: 14,
                      }}
                    >
                      Editar Perfil
                    </h3>

                    <label style={lbl}>
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={editNome}
                      onChange={(e) =>
                        setEditNome(
                          e.target.value
                        )
                      }
                      style={inp}
                    />

                    <label style={lbl}>
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      style={{
                        ...inp,
                        background:
                          "#f3f4f6",
                        color:
                          "#6b7280",
                      }}
                    />

                    <label style={lbl}>
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={editTelefone}
                      onChange={(e) =>
                        setEditTelefone(
                          e.target.value
                        )
                      }
                      placeholder="(38) 99999-9999"
                      style={inp}
                    />

                    <label style={lbl}>
                      Endereço
                    </label>
                    <textarea
                      value={editEndereco}
                      onChange={(e) =>
                        setEditEndereco(
                          e.target.value
                        )
                      }
                      placeholder="Rua, número, bairro..."
                      style={{
                        ...inp,
                        minHeight: 70,
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={salvarPerfil}
                        disabled={carregandoPerfil}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: carregandoPerfil
                            ? "#9ca3af"
                            : "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: 10,
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {carregandoPerfil
                          ? "Salvando..."
                          : "✅ Salvar"}
                      </button>
                      <button
                        onClick={() =>
                          setMostraEditarPerfil(
                            false
                          )
                        }
                        style={{
                          flex: 1,
                          padding: 12,
                          background:
                            "#e5e7eb",
                          color:
                            "#374151",
                          border: "none",
                          borderRadius: 10,
                          cursor:
                            "pointer",
                          fontWeight:
                            "bold",
                        }}
                      >
                        Cancelar
                      </button>
                    </div>

                    {sucesso && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 12,
                          background:
                            "#f0fdf4",
                          borderRadius: 10,
                          textAlign: "center",
                          color:
                            "#16a34a",
                          fontWeight:
                            "bold",
                        }}
                      >
                        ✅ Perfil
                        atualizado!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BLOCO AJUDA */}
            <div
              style={{
                marginTop: 20,
                background: "#fff",
                borderRadius: 12,
                padding: 14,
                textAlign: "center",
                boxShadow:
                  "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Precisa de ajuda?
              </p>
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  "Olá! Preciso de ajuda com meu pedido."
                )}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "11px 22px",
                  background: "#16a34a",
                  color: "white",
                  borderRadius: 10,
                  fontWeight: "bold",
                  textDecoration: "none",
                  fontSize: 15,
                }}
              >
                💬 WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}