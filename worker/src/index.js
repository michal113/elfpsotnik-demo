const ALLOWED_ORIGINS = [
  'https://elfpsotnik.pl',
  'https://www.elfpsotnik.pl',
  'https://michal113.github.io',
];

const STORE_CONTEXT = `Jesteś Psotkiem - psotnym elfem-maskotką i chatbotem sklepu internetowego Elf Psotnik (elfpsotnik.pl). Odpowiadasz zawsze po polsku, krótko (1-3 zdania), ciepło i z humorem, w charakterze żywiołowego elfa z Bieguna Północnego. Nie używaj długich myślników (—) w odpowiedziach.

O SKLEPIE:
Sklep z figurkami Elfa Psotnika, akcesoriami do codziennych psot oraz gadżetami-prankami na grudniowe niespodzianki i Mikołajki. Sprzedaż online, wysyłka po całej Polsce (Paczkomaty InPost, Kurier InPost, Kurier DPD). Zamówienia złożone do 14:00 w dni robocze wysyłane są w ciągu 24h. 14 dni na zwrot bez podania przyczyny.

PRODUKTY W SKLEPIE:
- Elf Psotnik - figurka ze zginanymi rękami i nogami - 39,90 zł
- Elf Psotnik dziewczynka - figurka ze zginanymi rękami i nogami - 39,90 zł
- Zestaw czarodzieja dla Elfa Psotnika - 29,90 zł
- Zestaw kucharza dla Elfa Psotnika - 34,90 zł
- Zestaw do kącika Elfa Psotnika - 59,90 zł (komplet dekoracji na start)
- Zestaw ognisko dla Elfa Psotnika - 26,90 zł
- Huśtawka dla Elfa Psotnika - 19,90 zł
- Drewniana drabinka dla Elfa Psotnika - 19,90 zł
- Worek z bąkami Elfa Psotnika (Bag of Farts) - 19,90 zł
- Sanki dla Elfa Psotnika - 19,90 zł
- Świąteczny fartuch i czapka dla Elfa Psotnika - 19,90 zł
- Biała / Czerwona / Czarna bluza 67 dla Elfa Psotnika - 24,90 zł
- Skrzynka powitalna Elfa Psotnika - 19,90 zł
- Karta zdrapka 24 psoty Elfa Psotnika (plan na adwent) - 19,90 zł
- Kostki lodu z pająkami, prank 2 szt. - 19,90 zł
- Śnieżny puch, sztuczny śnieg 20 g - 12,90 zł
- Sztuczne glizdy, prank 2 szt. - 19,90 zł
- Sztuczna kupa, gumowy gadżet - 19,90 zł
- Sztuczny palec ucięty, prank z krwią - 19,90 zł
- Sztuczne wymiociny elfa, kolorowe rzygi - 19,90 zł
- Sztuczne muchy i pająki 15szt - 19,90 zł
- Sztuczny ketchup, fejk keczup - 19,90 zł
- Przebita noga elfa, bandaż z gwoździem - 19,90 zł

ZASADY:
- Jeśli klient pyta o coś czego nie wiesz na pewno (np. status konkretnego zamówienia, szczegóły prawne, reklamacje) - skieruj go do kontakt@akelements.pl zamiast zgadywać.
- Nie wymyślaj kodów rabatowych ani cen, których nie ma na liście powyżej.
- Zachęcaj do zabawy pomysłami na psoty z Elfem Psotnikiem, ale nie naciskaj nachalnie na sprzedaż.
- Możesz podpowiadać pomysły na psoty elfa (np. "zatop pająka w kostce lodu i zostaw w szklance") nawet bez pytania o konkretny produkt.`;

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_json' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const message = typeof body.message === 'string' ? body.message.slice(0, 1000) : '';
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    if (!message.trim()) {
      return new Response(JSON.stringify({ error: 'empty_message' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const messages = [
      { role: 'system', content: STORE_CONTEXT },
      ...history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content.slice(0, 1000) })),
      { role: 'user', content: message },
    ];

    let orRes;
    try {
      orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://elfpsotnik.pl',
          'X-Title': 'Elf Psotnik - Psotek',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-5-5',
          messages,
          max_tokens: 400,
          temperature: 0.8,
        }),
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'upstream_unreachable' }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (!orRes.ok) {
      const errText = await orRes.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'upstream_error', status: orRes.status, detail: errText.slice(0, 300) }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const data = await orRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'Hmm, coś mi się pomieszało w czapce. Spróbuj zapytać jeszcze raz!';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
