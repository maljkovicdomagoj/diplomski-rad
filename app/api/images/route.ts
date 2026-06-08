import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "abstract";
  const width = parseInt(searchParams.get("w") || "800", 10);
  const height = parseInt(searchParams.get("h") || "600", 10);

  // 1. Pokušaj koristiti Pexels API ako je ključ dostupan
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`,
        {
          headers: {
            Authorization: pexelsKey,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          // Nasumično odaberi jednu od prvih 15 slika
          const randomIndex = Math.floor(Math.random() * data.photos.length);
          const photo = data.photos[randomIndex];
          // Pexels koristi imgix pa podržava iste parametre za širinu, visinu i izrezivanje
          const imageUrl = `${photo.src.large2x}&w=${width}&h=${height}&fit=crop`;
          return NextResponse.redirect(imageUrl);
        }
      }
    } catch (err) {
      console.error("Pexels API greška, nastavljam na LoremFlickr:", err);
    }
  }

  // 2. Fallback na LoremFlickr (ako nema ključeva ili su limiti prekoračeni)
  const fallbackUrl = `https://loremflickr.com/${width}/${height}/${encodeURIComponent(query)}`;
  return NextResponse.redirect(fallbackUrl);
}
