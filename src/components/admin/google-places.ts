"use server";

export async function fetchGooglePlaces(query: string) {
  if (!query) {
    return [];
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("API Key não configurada no servidor (verifique o arquivo .env)");
  }
  
  // types=(regions) é o filtro correto para bairros/cidades na API do Google
  // location e radius (50km) priorizam fortemente resultados na região de Belo Horizonte / MG
  const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    query
  )}&types=(regions)&components=country:br&location=-19.9167,-43.9345&radius=50000&language=pt-BR&key=${apiKey}`;

  try {
    const response = await fetch(googleUrl);
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    throw new Error("Falha ao buscar locais");
  }
}