"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ItemPedido = {
  pratoId: string;
  prato: string;
  preco: number;
  quantidade: number;
  total: number;
  observacao?: string;
};

type PedidoComAcoesProps = {
  pedido: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    endereco?: string;
    itens?: ItemPedido[];
    totalPedido: number;
    status: string;
    criadoEm: { seconds: number };
  };
};

export function PedidoComAcoes({ pedido }: PedidoComAcoesProps) {
  const itens = pedido.itens ?? [];

  // ------------ IMPRESSÃO APENAS DESTE PEDIDO ------------
  const handleImprimir = () => {
    const win = window.open("", "_blank", "width=380,height=600");

    if (!win) return;

    const dataStr = new Date(
      pedido.criadoEm.seconds * 1000
    ).toLocaleString("pt-BR");

    // HTML simples, pensado para bobina (largura 80mm)
    win.document.write(`
      <html>
        <head>
          <title>Pedido ${pedido.id.slice(0, 8)}</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: "Consolas", "Courier New", monospace;
              font-size: 12px;
              padding: 8px;
              width: 58mm; /* largura típica de bobina 58mm */
            }
            .linha {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .centro {
              text-align: center;
            }
            .negrito {
              font-weight: bold;
            }
            .espaco {
              margin-top: 4px;
            }
            .item {
              margin-bottom: 4px;
            }
            .item-obs {
              margin-left: 8px;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="centro negrito">RESTAURANT PRO</div>
          <div class="centro">Pedido #${pedido.id.slice(0, 8)}</div>
          <div class="centro">${dataStr}</div>

          <div class="linha"></div>

          <div class="espaco">
            <span class="negrito">Cliente:</span> ${pedido.nome ||
              "Cliente sem nome"}
          </div>
          <div>
            <span class="negrito">Email:</span> ${pedido.email}
          </div>
          ${
            pedido.telefone
              ? `<div><span class="negrito">Tel:</span> ${pedido.telefone}</div>`
              : ""
          }
          ${
            pedido.endereco
              ? `<div><span class="negrito">End:</span> ${pedido.endereco}</div>`
              : ""
          }

          <div class="linha"></div>
          <div class="negrito">ITENS</div>
          <div class="linha"></div>

          ${itens
            .map((item) => {
              const subtotal = (item.total || 0).toFixed(2);
              return `
                <div class="item">
                  ${item.quantidade}x ${item.prato}
                  <br/>
                  R$ ${subtotal}
                  ${
                    item.observacao
                      ? `<div class="item-obs">Obs: ${item.observacao}</div>`
                      : ""
                  }
                </div>
              `;
            })
            .join("")}

          <div class="linha"></div>
          <div class="negrito">
            Total: R$ ${Number(pedido.totalPedido || 0).toFixed(2)}
          </div>

          <div class="linha"></div>
          <div>Status: ${pedido.status}</div>

          <div class="linha"></div>
          <div class="centro">Obrigado!</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 200);
            }
          </script>
        </body>
      </html>
    `);

    win.document.close();
  };

  // ------------ PDF (opcional, a partir do mesmo HTML) ------------
  const handleDownloadPdf = async () => {
    // Vamos reutilizar o mesmo HTML, mas renderizando numa div temporária
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";

    const dataStr = new Date(
      pedido.criadoEm.seconds * 1000
    ).toLocaleString("pt-BR");

    container.innerHTML = `
      <div id="ticket" style="
        font-family: 'Consolas','Courier New',monospace;
        font-size:12px;
        padding:8px;
        width:220px;
      ">
        <div style="text-align:center;font-weight:bold">RESTAURANT PRO</div>
        <div style="text-align:center;">Pedido #${pedido.id.slice(0, 8)}</div>
        <div style="text-align:center;">${dataStr}</div>

        <hr/>

        <div style="margin-top:4px;">
          <span style="font-weight:bold;">Cliente:</span> ${pedido.nome ||
            "Cliente sem nome"}
        </div>
        <div>
          <span style="font-weight:bold;">Email:</span> ${pedido.email}
        </div>
        ${
          pedido.telefone
            ? `<div><span style="font-weight:bold;">Tel:</span> ${pedido.telefone}</div>`
            : ""
        }
        ${
          pedido.endereco
            ? `<div><span style="font-weight:bold;">End:</span> ${pedido.endereco}</div>`
            : ""
        }

        <hr/>
        <div style="font-weight:bold;">ITENS</div>
        <hr/>

        ${itens
          .map((item) => {
            const subtotal = (item.total || 0).toFixed(2);
            return `
              <div style="margin-bottom:4px;">
                ${item.quantidade}x ${item.prato}<br/>
                R$ ${subtotal}
                ${
                  item.observacao
                    ? `<div style="margin-left:8px;font-size:11px;">Obs: ${item.observacao}</div>`
                    : ""
                }
              </div>
            `;
          })
          .join("")}

        <hr/>
        <div style="font-weight:bold;">
          Total: R$ ${Number(pedido.totalPedido || 0).toFixed(2)}
        </div>
        <hr/>
        <div>Status: ${pedido.status}</div>
      </div>
    `;

    document.body.appendChild(container);

    const ticket = container.querySelector("#ticket") as HTMLElement;
    const canvas = await html2canvas(ticket, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", [80, 200]); // largura ~80mm, altura flexível
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = pageWidth / imgProps.width;
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`pedido-${pedido.id}.pdf`);

    document.body.removeChild(container);
  };

  // Os botões continuam sendo chamados da ListaPedidos
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* aqui só mostramos um cabeçalho bem resumido na tela */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div>
          <p
            style={{
              fontWeight: "bold",
              fontSize: 15,
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
            {new Date(pedido.criadoEm.seconds * 1000).toLocaleString(
              "pt-BR"
            )}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#374151",
              marginTop: 4,
            }}
          >
            👤 {pedido.nome || "Cliente sem nome"}{" "}
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              ({pedido.email})
            </span>
          </p>
          {pedido.telefone && (
            <p
              style={{
                fontSize: 13,
                color: "#374151",
              }}
            >
              📞 {pedido.telefone}
            </p>
          )}
          {pedido.endereco && (
            <p
              style={{
                fontSize: 13,
                color: "#374151",
              }}
            >
              📍 {pedido.endereco}
            </p>
          )}
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          marginBottom: 6,
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

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 6,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleImprimir}
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
          Imprimir pedido
        </button>

        <button
          onClick={handleDownloadPdf}
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
          Baixar PDF
        </button>
      </div>
    </div>
  );
}