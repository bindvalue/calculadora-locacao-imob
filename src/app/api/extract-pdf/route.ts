import { NextResponse } from "next/server";
let pdfjsLib: any;

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

    // --- NOVO PARSER COM PDFJS (compatível com Next.js) ---
    if (!pdfjsLib) {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // 🔥 CRÍTICO: desabilita worker no ambiente Node (Next.js)
      pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      useWorkerFetch: false,
      isEvalSupported: false
    });
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);
    const content = await page.getTextContent();

    const items = content.items as any[];

    // Agrupar por posição Y (linhas)
    const linhasMap: Record<number, any[]> = {};

    items.forEach((item) => {
      const y = Math.round(item.transform[5]);

      if (!linhasMap[y]) linhasMap[y] = [];
      linhasMap[y].push(item);
    });

    // Ordenar linhas e colunas
    const linhas = Object.values(linhasMap).map((linha: any[]) =>
      linha.sort((a, b) => a.transform[4] - b.transform[4])
    );

    // Converter em texto estruturado
    const structuredLines = linhas.map((linha) =>
      linha.map((item) => item.str).join(" ").trim()
    );

    const extractedData: Array<{ bairro: string; valor_m2: number; tipo: string }> = [];

    // Regex mais confiável agora que a estrutura está correta
    const regex = /^(.+?)\s+(\d{2,3}[.,]\d{1,2})$/;

    for (const line of structuredLines) {
      if (!line || !/\d/.test(line)) continue;

      const match = line.match(regex);

      if (match) {
        const bairro = match[1].trim();
        const valor = parseFloat(match[2].replace(",", "."));

        if (isNaN(valor)) continue;

        extractedData.push({
          bairro,
          valor_m2: valor,
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