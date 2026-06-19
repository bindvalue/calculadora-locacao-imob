import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('A chave da API do Google Places não foi configurada.');
    return NextResponse.json(
      { error: 'Erro interno do servidor: A chave da API não está configurada.' },
      { status: 500 }
    );
  }

  if (!input) {
    return NextResponse.json(
      { error: 'Parâmetro de busca "input" ausente.' },
      { status: 400 }
    );
  }

  // Usar 'regions' para buscar bairros e cidades, e restringir ao Brasil.
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&types=(regions)&language=pt_BR&components=country:BR&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.status !== 'OK') {
      console.error('Erro da API do Google Places:', data.error_message || data.status);
      return NextResponse.json(
        { error: 'Falha ao buscar dados da API do Google.', details: data.error_message || data.status },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao fazer fetch para a API do Google Places:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao contatar a API do Google.' },
      { status: 500 }
    );
  }
}