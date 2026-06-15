import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';

// Inicializa o Supabase com permissões de Service Role para o Backend
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Conversão do arquivo para ArrayBuffer e processamento com o xlsx
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    // Pega a primeira aba da planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converte para matriz ignorando estrutura complexa
    const rows = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    
    const recordsToUpsert = [];
    
    // Loop ignorando as 5 primeiras linhas (Cabeçalho do Secovi)
    for (let i = 5; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // AQUI VOCÊ PODE AJUSTAR OS ÍNDICES DA PLANILHA DO SECOVI
      const bairro = row[0]; // Assume Coluna A como Bairro
      const valorM2 = Number(row[2]); // Assume Coluna C como Valor m²

      // Validação Estrita
      if (typeof bairro === 'string' && bairro.trim() !== '' && !isNaN(valorM2) && valorM2 > 0) {
        recordsToUpsert.push({
          bairro: bairro.trim(),
          // Criamos uma margem sugerida de -15% e +15% com base no valor base do Secovi
          valor_min: Number((valorM2 * 0.85).toFixed(2)),
          valor_max: Number((valorM2 * 1.15).toFixed(2)),
          valor_default: Number(valorM2.toFixed(2)),
        });
      }
    }

    if (recordsToUpsert.length === 0) {
      return NextResponse.json({ error: 'Nenhum dado válido encontrado na planilha.' }, { status: 400 });
    }

    // Remove os dados antigos da tabela (Clear) antes de inserir os novos do Secovi
    await supabase
      .from('secovi_valores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); 

    // Faz o insert massivo
    const { error } = await supabase.from('secovi_valores').insert(recordsToUpsert);
    if (error) throw error;

    return NextResponse.json({ success: true, count: recordsToUpsert.length });
  } catch (error: any) {
    console.error("Erro no processamento do Secovi:", error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}