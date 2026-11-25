# Compagnon Bio-Well

Application web pour sélectionner le rapport Bio-Well CSV le plus représentatif d'une série d'au moins 3 rapports d'une même personne.

L'application fonctionne entièrement dans le navigateur : les fichiers CSV importés ne sont pas envoyés à un serveur applicatif par ce projet.

En production : <https://biowell.biovibralyon.fr>

## Prérequis

- Node.js 22 ou plus récent (la CI tourne sous Node 22) ;
- pnpm, dans la version fixée par le champ `packageManager` de `package.json` (fournie automatiquement par corepack).

```bash
pnpm install
pnpm run dev
```

## Tester rapidement

### GitHub Codespaces

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
https://stackblitz.com/fork/github/Tux69140/Biowell-compagnon
```

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

## Déployer en production (o2switch)

Le site est un build statique Vite hébergé chez o2switch, dans le dossier `~/biowell.biovibralyon.fr` du compte. Le déploiement est manuel, par `rsync` via l'hôte SSH `o2switch` défini dans `~/.ssh/config`.

1. Partir de `main` à jour et vérifier :

   ```bash
   git switch main && git pull
   pnpm install --frozen-lockfile
   pnpm run check
   ```

2. Sauvegarder la version en ligne sur le serveur :

   ```bash
   ssh o2switch 'mkdir -p ~/sauvegardes && tar czf ~/sauvegardes/biowell-$(date +%F).tar.gz -C ~ biowell.biovibralyon.fr/index.html biowell.biovibralyon.fr/assets'
   ```

3. Envoyer le build, dans cet ordre (nouveaux fichiers, bascule par `index.html`, puis suppression des anciens fichiers de `assets/` uniquement) :

   ```bash
   rsync -av --chmod=D755,F644 dist/assets/ o2switch:biowell.biovibralyon.fr/assets/
   rsync -av --chmod=F644 dist/index.html o2switch:biowell.biovibralyon.fr/
   rsync -av --delete --chmod=D755,F644 dist/assets/ o2switch:biowell.biovibralyon.fr/assets/
   ```

   Ne pas toucher à `.htaccess` (redirection HTTPS), `cgi-bin` ni `.well-known` (certificat).

4. Vérifier le site en ligne avec les tests e2e :

   ```bash
   E2E_APP_URL=https://biowell.biovibralyon.fr/ pnpm run e2e
   ```

Pour revenir à la version précédente, extraire la sauvegarde sur le serveur : `ssh o2switch 'tar xzf ~/sauvegardes/biowell-AAAA-MM-JJ.tar.gz -C ~'`.

## Dépendances

Les versions sont fixées dans `package.json` et `pnpm-lock.yaml`. Dependabot propose les mises à jour tous les deux mois (configuration dans `.github/dependabot.yml`) ; les alertes de sécurité arrivent sans attendre.

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
pnpm run e2e         # tests Playwright (Chromium, Firefox) sur dist/, ou sur E2E_APP_URL
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
