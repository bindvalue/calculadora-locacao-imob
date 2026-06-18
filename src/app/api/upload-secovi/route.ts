import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Lê a planilha usando a biblioteca xlsx
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converte os dados da planilha para JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: "A planilha está vazia." }, { status: 400 });
    }

    // Instancia o Supabase repassando o token de autenticação do Frontend
    const authHeader = request.headers.get("Authorization");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader || "",
          },
        },
      }
    );

    // Busca os bairros que já existem no banco para evitar erro de UNIQUE constraint
    const { data: existingRecords } = await supabase.from("secovi_valores").select("id, bairro");
    const existingMap = new Map();
    if (existingRecords) {
      existingRecords.forEach(record => {
        if (record.bairro) {
          existingMap.set(record.bairro.trim().toUpperCase(), record.id);
        }
      });
    }

    const bairrosToInsert = [];
    const bairrosToUpdate = [];

    for (const row of rawData as any[]) {
      // Procura as chaves de forma flexível (ignorando maiúsculas/minúsculas e espaços)
      const keys = Object.keys(row);
      const bairroKey = keys.find(k => k.toLowerCase().trim() === 'bairro');
      const valorKey = keys.find(k => k.toLowerCase().trim() === 'valor_m2' || k.toLowerCase().trim() === 'valor');
      const cidadeKey = keys.find(k => k.toLowerCase().trim() === 'cidade');
      const estadoKey = keys.find(k => k.toLowerCase().trim() === 'estado' || k.toLowerCase().trim() === 'uf');

      if (bairroKey && valorKey && row[bairroKey]) {
        const bairroNome = String(row[bairroKey]).trim().toUpperCase();
        let valorM2 = row[valorKey];

        // Tratamento numérico
        if (typeof valorM2 === 'string') {
          valorM2 = parseFloat(valorM2.replace(/\./g, '').replace(',', '.'));
        } else {
          valorM2 = Number(valorM2);
        }

        if (!isNaN(valorM2) && valorM2 > 0) {
          const existingId = existingMap.get(bairroNome);
          
          const registro = {
            bairro: bairroNome,
            cidade: cidadeKey && row[cidadeKey] ? String(row[cidadeKey]).trim() : "Belo Horizonte", // Fallback seguro
            estado: estadoKey && row[estadoKey] ? String(row[estadoKey]).trim().toUpperCase() : "MG", // Fallback seguro
            valor_default: Number(valorM2.toFixed(2)),
            valor_min: Number((valorM2 * 0.85).toFixed(2)),
            valor_max: Number((valorM2 * 1.15).toFixed(2)),
          };

          if (existingId) {
            bairrosToUpdate.push({ id: existingId, ...registro });
          } else {
            bairrosToInsert.push(registro);
          }
        }
      }
    }

    if (bairrosToInsert.length === 0 && bairrosToUpdate.length === 0) {
      return NextResponse.json({ 
        error: "Nenhum dado válido encontrado. Certifique-se de ter as colunas 'bairro' e 'valor_m2'." 
      }, { status: 400 });
    }

    // Executa as operações em duas etapas para maior segurança
    if (bairrosToUpdate.length > 0) {
      const { error: updateError } = await supabase.from("secovi_valores").upsert(bairrosToUpdate);
      if (updateError) throw updateError;
    }
    if (bairrosToInsert.length > 0) {
      const { error: insertError } = await supabase.from("secovi_valores").insert(bairrosToInsert);
      if (insertError) throw insertError;
    }

    const totalCount = bairrosToInsert.length + bairrosToUpdate.length;

    return NextResponse.json({ success: true, count: totalCount });
    
  } catch (error: any) {
    console.error("Erro na importação da planilha:", error);
    return NextResponse.json({ error: `Falha ao processar o arquivo: ${error.message}` }, { status: 500 });
  }
}