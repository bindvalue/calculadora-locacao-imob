import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

// Rota de API protegida para extração de dados do FipeZAP
// Permite mais tempo para processar arquivos FipeZAP (que são grandes)
export const maxDuration = 60; 

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const tipoIndice = formData.get("tipoIndice") as string | null;

    // Validação mais segura do arquivo
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Arquivo inválido." },
        { status: 400 }
      );
    }

    if (!file || !tipoIndice) {
      return NextResponse.json(
        { error: "Arquivo PDF e Tipo de Índice são obrigatórios." },
        { status: 400 }
      );
    }

    // Limite de tamanho (evita travamento)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF muito grande (máx 5MB)." },
        { status: 400 }
      );
    }

    // Converte o arquivo de forma segura
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("PDF recebido - tamanho:", buffer.length);

    // Timeout para evitar travamento do servidor
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao processar PDF")), 8000)
    );

    // Processa o PDF (limitado)
    const pdfData: any = await Promise.race([
      pdfParse(buffer, { max: 1 }),
      timeout
    ]);
    
    if (!pdfData || !pdfData.text) {
      console.error("PDF sem texto ou falha no parse");
      return NextResponse.json({ error: "O PDF parece estar vazio ou criptografado." }, { status: 400 });
    }

    const text = pdfData.text;
    const lines = text.split("\n");

    const extractedData: Array<{ bairro: string; valor_m2: number; tipo: string }> = [];

    // REGEX FipeZAP Ultra-Flexível
    // Busca o nome do Bairro no começo da linha, ignora lixo de caracteres,
    // e pega o primeiro número decimal (ex: 75.4 ou 60,1) que encontrar.
    const regex = /^([A-Za-zÀ-ÿ\s\-]+?)\s+(?:.*?)\s*(\d{2,3}[.,]\d{1,2})/i;

    for (const line of lines) {
      // Defesa contra travamentos: Pula linhas que não contenham números
      if (!/\d/.test(line)) continue;

      // Remove linhas em branco para processar mais rápido
      if (!line.trim()) continue;

      const match = line.match(regex);
      if (match) {
        const bairroRaw = match[1].trim();
        const valorRaw = match[2];

        if (bairroRaw.toLowerCase().includes("bairro") || bairroRaw.toLowerCase().includes("cidade") || bairroRaw.toLowerCase().includes("município")) {
          continue;
        }

        // Apenas troca vírgula por ponto. Trata corretamente "71.7" e "62,1" sem distorcer o valor real
        const valorFormatado = parseFloat(valorRaw.replace(",", "."));

        extractedData.push({
          bairro: bairroRaw,
          valor_m2: valorFormatado,
          tipo: tipoIndice,
        });
      }
    }

    return NextResponse.json({ success: true, data: extractedData });

  } catch (error: any) {
    // Se estourar a memória ou travar, o console pegará o erro exato
    console.error("Erro interno catastrófico no PDF:", error);
    return NextResponse.json({ 
      error: "Falha ao processar o arquivo. Certifique-se de que o PDF não está corrompido ou protegido por senha.",
      details: error.message 
    }, { status: 500 });
  }
}