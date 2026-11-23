# Elf Psotnik - Psotek chatbot proxy

Mały Cloudflare Worker, ktory przekazuje wiadomosci z chatbota na stronie do
Claude (przez OpenRouter), zeby klucz API nie trafial do kodu strony.

Wdrozony pod: https://elf-psotnik-bot.sergiuszserafin26.workers.dev

## Deploy

```
cd worker
CLOUDFLARE_API_TOKEN=... npx wrangler deploy
```

## Ustawienie/zmiana klucza OpenRouter

```
cd worker
CLOUDFLARE_API_TOKEN=... npx wrangler secret put OPENROUTER_API_KEY
```

Klucz nigdy nie trafia do `wrangler.toml` ani do repo - zyje tylko jako
sekret w Cloudflare.
