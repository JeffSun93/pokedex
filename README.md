# Pokédex

A Smogon-style Pokédex built with React, TypeScript, and Vite. Covers all 1025 Pokémon with Chinese/English bilingual support and locally hosted images.

## Features

- **1025 Pokémon** — full National Dex coverage
- **Bilingual UI** — Chinese (简体) and English names & descriptions
- **Tier browser** — browse Pokémon by Smogon usage tier (OU, UU, RU, NU, PU, Ubers, etc.)
- **Strategy analyses** — per-Pokémon Smogon analysis viewer
- **Filtering & search** — filter by type, tier, or name
- **Local images** — no external image requests at runtime

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router v7 |
| HTTP | Axios |
| Lint | ESLint + typescript-eslint |

## Getting Started

```bash
npm install
npm run dev        # starts dev server on http://localhost:5173
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

### Data Scripts

Run these to refresh the local data files under `src/data/`:

```bash
npm run data:all        # run all fetch/patch steps in sequence
npm run data:fetch      # fetch base Pokémon data from PokéAPI
npm run data:zh         # patch in Chinese names
npm run data:abilities  # patch in ability data
npm run data:tiers      # patch in Smogon tier assignments
npm run data:analyses   # fetch Smogon strategy analyses
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── AnalysisView  # Smogon strategy text display
│   ├── FilterBar     # Type/tier/name filters
│   ├── Header        # Site navigation
│   ├── PokemonCard   # Grid card view
│   ├── PokemonListRow# List row view
│   ├── PokemonModal  # Detail modal
│   ├── StatBar       # Base stat visualisation
│   ├── TierBadge     # Tier label chip
│   └── TypeBadge     # Type label chip
├── pages/
│   ├── PokedexPage       # / — main Pokédex grid/list
│   ├── TiersIndexPage    # /tiers — tier overview
│   └── TierPage          # /tiers/:slug — per-tier Pokémon list
├── data/
│   ├── pokemon.json      # All Pokémon data (generated)
│   └── analyses/         # Smogon analyses (generated)
├── hooks/
├── types/
└── utils/
```

## Routes

| Path | Page |
|------|------|
| `/` | Main Pokédex (search, filter, browse) |
| `/tiers` | Tier index |
| `/tiers/:slug` | Pokémon list for a specific tier |
