# Riksdagskollen

Riksdagskollen är en civic-tech webbplats som gör riksdagens beslut tillgängliga för alla.

## Mål

Att visualisera och sammanfatta riksdagsbeslut så att medborgare enkelt kan förstå vad som beslutas och hur partierna röstar.

## Teknikstack

- **Ramverk:** Next.js (App Router)
- **Språk:** TypeScript
- **Styling:** Tailwind CSS
- **Data:** Mockad data (planerat: Riksdagens öppna data API)

## Kom igång

Kör utvecklingsservern:

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Projektstruktur

- `src/app`: Sidor och layout (Next.js App Router)
- `src/components`: Återanvändbara UI-komponenter (t.ex. `DecisionCard`, `PartyVotes`)
- `src/data`: Mockdata för utveckling
- `src/types`: TypeScript-definitioner för datamodeller
