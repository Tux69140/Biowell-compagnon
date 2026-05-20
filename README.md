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
npm install
npm run dev
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
npm run dev
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
4. relancer le terminal StackBlitz avec `npm run dev`.


## Déployer sur Vercel

Vercel peut déployer cette application comme un site statique Vite avec la commande par défaut :

```bash
npm run build
```

Le projet verrouille des versions stables de React, Vite, Vitest et TypeScript afin d'éviter qu'un déploiement sans fichier lock n'installe automatiquement une version majeure plus récente de TypeScript. La configuration TypeScript utilise aussi `moduleResolution: "Bundler"`, compatible avec Vite et les versions récentes de TypeScript.

## Scripts disponibles

```bash
npm run dev      # serveur de développement Vite, exposé aux environnements cloud
npm run build    # vérification TypeScript puis build de production
npm test         # tests Vitest
npm run preview  # prévisualisation du build Vite
```
