# Compagnon Bio-Well

Prototype web local pour sélectionner le rapport Bio-Well CSV le plus représentatif d'une série d'au moins 3 rapports d'une même personne.

L'application fonctionne entièrement dans le navigateur : les fichiers CSV importés ne sont pas envoyés à un serveur applicatif par ce projet.

## Tester rapidement

### Option la plus fiable : GitHub Codespaces

1. Ouvrir le dépôt sur GitHub.
2. Cliquer sur **Code** puis **Codespaces**.
3. Créer ou ouvrir un codespace.
4. Lancer :

```bash
pnpm install
pnpm run dev
```

Codespaces est l'option recommandée pour ce projet, car elle lance un environnement complet et affiche l'URL locale Vite transférée automatiquement.

### Option navigateur : StackBlitz

StackBlitz peut importer ce dépôt directement depuis GitHub :

```text
https://stackblitz.com/fork/github/OWNER/Biowell-compagnon
```

Remplacer `OWNER` par le compte ou l'organisation GitHub.

Le dépôt contient aussi `.stackblitzrc`, afin que StackBlitz lance explicitement :

```bash
pnpm run dev
```

#### Si StackBlitz mouline dans Firefox

Les erreurs de console suivantes viennent de la plateforme StackBlitz ou du navigateur, pas du code de l'application Bio-Well :

- chargement refusé de `googletagmanager.com` ;
- chargement refusé de `cdn.mxpnl.com` ;
- refus de connexion WebSocket vers `wss://stackblitz.com/cable`.

Elles sont souvent liées au blocage de pistage, aux extensions de confidentialité, au réseau ou au WebSocket StackBlitz. Dans ce cas, essayer dans cet ordre :

1. utiliser GitHub Codespaces ;
2. autoriser temporairement les WebSockets/anti-pistage pour StackBlitz ;
3. tester dans Chromium/Chrome ;
4. relancer le terminal StackBlitz avec `pnpm run dev`.

## Déployer sur Vercel

Vercel peut déployer cette application comme un site statique Vite avec la commande par défaut :

```bash
pnpm run build
```

Le projet verrouille des versions stables de React, Vite, Vitest et TypeScript afin d'éviter qu'un déploiement sans fichier lock n'installe automatiquement une version majeure plus récente de TypeScript. La configuration TypeScript utilise aussi `moduleResolution: "Bundler"`, compatible avec Vite et les versions récentes de TypeScript.

## Scripts disponibles

```bash
pnpm run dev         # serveur de développement Vite (localhost uniquement)
pnpm start           # alias de pnpm run dev
pnpm run epuriel:post # lance une fenêtre terminal Windows: Test POST API Epuriel - version simple
pnpm run build       # vérification TypeScript puis build de production
pnpm run test        # tests Vitest
pnpm run format      # formatage Prettier
pnpm run format:check # vérification du formatage Prettier
pnpm run lint        # lint ESLint
pnpm run typecheck   # vérification TypeScript détaillée
pnpm run check       # vérification complète format + lint + typecheck + test + build + e2e
pnpm run e2e        # tests Playwright (Chromium, Firefox, WebKit)
pnpm run e2e:install # installation des navigateurs Playwright
pnpm run preview     # prévisualisation du build Vite
```

## Test POST API Epuriel (version simple, Windows)

`pnpm run epuriel:post` ouvre une fenêtre de commande avec le titre exact :

**Test POST API Epuriel - version simple**

Le script exécute ensuite un `curl -X POST` avec un payload JSON par défaut `{"ping":"ok"`.

Tu peux surcharger l'URL et le payload en lançant directement :

```bash
scripts\test-post-epuriel-simple.bat "https://mon-endpoint.test/api" "{\"ping\":\"ok\"}"
```

L'invite de commande reste ouverte au final pour voir la réponse.
