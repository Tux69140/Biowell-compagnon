# Étude de création — Application de sélection du rapport Bio-Well le plus représentatif

## 1. Objectif du produit

Créer une application simple, en français, destinée à des praticiens Bio-Well, thérapeutes, chercheurs ou utilisateurs avancés, permettant d'identifier automatiquement le ou les rapports de mesure les plus représentatifs d'une série de rapports CSV Bio-Well appartenant à une seule personne.

L'application doit fonctionner sur un usage ponctuel : l'utilisateur importe au minimum 3 rapports CSV, lance l'analyse, obtient le nom du fichier le plus représentatif, puis peut éventuellement exporter les moyennes calculées au format CSV. Aucune analyse ne doit être historisée ni stockée durablement par défaut.

## 2. Cahier des charges fonctionnel — périmètre retenu

### 2.1 Fonctionnalités incluses dans le prototype partageable

- Importer au moins 3 fichiers CSV Bio-Well français.
- Accepter plus de 3 fichiers sans limite fixe côté métier.
- Rejeter individuellement les fichiers non exploitables tout en poursuivant l'analyse si au moins 3 fichiers restent valides.
- Extraire tous les paramètres numériques comparables présents dans les fichiers CSV valides.
- Remplacer les valeurs `-` par `0`.
- Ignorer, pour tout le lot d'analyse, les paramètres qui ne sont pas présents dans tous les fichiers valides.
- Calculer la moyenne ligne à ligne de chaque paramètre conservé.
- Comparer chaque rapport à ce profil moyen.
- Afficher uniquement le nom du ou des fichiers les plus représentatifs.
- Afficher une explication synthétique du choix.
- Signaler les rapports très éloignés tout en les incluant dans le calcul.
- Permettre l'export CSV des moyennes calculées via un bouton dédié.
- Afficher un avertissement clair indiquant que l'application ne produit pas de diagnostic médical.

### 2.2 Fonctionnalités explicitement exclues du prototype

- Gestion multi-personnes.
- Historique local des analyses.
- Stockage persistant des rapports importés.
- Tableau détaillé de tous les paramètres extraits.
- Ouverture ou visualisation complète du rapport sélectionné.
- Export PDF ou rapport HTML.
- Pondération manuelle ou métier des paramètres.
- Choix utilisateur des blocs de paramètres.
- Détection et exclusion automatique des valeurs aberrantes.
- Analyse chronologique ou prise en compte des horodatages.
- Prise en charge des PDF Bio-Well.
- Interface multilingue.

## 3. Hypothèses sur les fichiers Bio-Well

Les fichiers d'entrée sont des exports CSV français du logiciel Bio-Well. Le séparateur attendu est le point-virgule `;` et les nombres décimaux utilisent la virgule française. Les noms de fichiers peuvent varier, à condition d'être distinctifs. Les noms des personnes peuvent contenir des accents ou caractères spéciaux.

Le prototype ne vérifie pas que les rapports appartiennent à la même personne. Cette responsabilité est laissée à l'utilisateur, car l'usage prévu porte sur une seule personne et une série importée consciemment.

Les rapports d'exemple montrent une structure stable avec des sections de haut niveau comme `Paramètres`, `Champs d'énergie`, `Mode de vie`, `Centres nerveux`, `Ennéagramme`, `Yin Yang`, `Organes et systèmes`, puis de nombreux blocs `Les doigts et les secteurs`.

## 4. Modèle de données interne

Chaque valeur numérique exploitable doit être transformée en une entrée canonique :

```ts
type MetricKey = string;

type MetricValue = {
  key: MetricKey;
  value: number;
  sourceSection: string;
  sourceLabel: string;
  sourceColumn: string;
  rowIndex: number;
};
```

La clé canonique doit identifier une mesure de manière stable entre plusieurs fichiers. Elle ne doit pas être seulement le libellé visible, car certains libellés se répètent dans plusieurs sections ou sous-tableaux.

Format recommandé de clé :

```text
<section>/<sous-section éventuelle>/<ligne ou entité>/<colonne de mesure>
```

Exemples conceptuels :

```text
Paramètres/Stress/Valeur
Champs d'énergie/Gauche/Zone
Champs d'énergie/Gauche/Énergie
Centres nerveux/Énergie/Centre du système nerveux 1
Centres nerveux/Alignement/Centre du système nerveux 1
Organes et systèmes/Tête/Système/Énergie
Organes et systèmes/Tête/Système/Équilibre, %
Les doigts et les secteurs/Zone/Pouce gauche/Image entière
Les doigts et les secteurs/CE/Index droit/Côlon transverse
```

## 5. Règles de parsing CSV

### 5.1 Lecture

- Lire le fichier comme CSV avec séparateur `;`.
- Supporter les champs entourés de guillemets.
- Accepter l'encodage UTF-8 en priorité.
- Prévoir une tolérance d'encodage pour les exports Windows si nécessaire, par exemple Windows-1252, sans bloquer le prototype si les exemples sont en UTF-8.
- Supprimer les guillemets et espaces superflus sur les cellules.

### 5.2 Conversion numérique

- Une cellule vide n'est pas une valeur numérique exploitable.
- Une cellule `-` doit être convertie en `0`.
- Une cellule numérique française comme `3,05` doit devenir `3.05`.
- Une cellule numérique entière comme `68182` doit devenir `68182`.
- Une cellule non numérique inattendue dans une position attendue comme numérique rend le fichier non exploitable.

### 5.3 Fichier non exploitable

Un fichier doit être rejeté de l'analyse si :

- il ne peut pas être lu ;
- il ne respecte pas la structure CSV attendue ;
- il ne contient pas assez de paramètres numériques ;
- il contient une valeur non numérique inattendue dans une colonne identifiée comme numérique ;
- il provoque une ambiguïté de clé impossible à résoudre.

Le rejet d'un fichier doit produire un message utilisateur court, par exemple :

```text
Le fichier "rapport-2.csv" a été ignoré : valeur non numérique inattendue ligne 118, colonne Énergie.
```

L'analyse continue uniquement si au moins 3 fichiers restent exploitables.

## 6. Algorithme de représentativité

### 6.1 Principe général

L'algorithme doit travailler paramètre par paramètre, ligne à ligne, et non pas calculer une moyenne globale par rapport.

Pour chaque paramètre comparable :

1. extraire sa valeur dans chaque fichier valide ;
2. calculer la moyenne de cette valeur sur tous les fichiers valides ;
3. comparer la valeur de chaque rapport à cette moyenne ;
4. agréger les écarts du rapport ;
5. sélectionner le ou les rapports avec l'écart agrégé le plus faible.

### 6.2 Ensemble de paramètres utilisés

Soit `K_i` l'ensemble des clés de paramètres extraites du fichier valide `i`.

L'ensemble final des paramètres comparés est l'intersection :

```text
K = K_1 ∩ K_2 ∩ ... ∩ K_n
```

Tout paramètre absent d'au moins un fichier valide est ignoré pour tout le lot d'analyse.

### 6.3 Moyenne par paramètre

Pour chaque clé `k` conservée :

```text
mean[k] = somme(value[file][k]) / nombre_de_fichiers_valides
```

### 6.4 Score de distance recommandé

Le score recommandé pour le prototype est l'écart absolu moyen :

```text
score[file] = moyenne_sur_k( abs(value[file][k] - mean[k]) )
```

Le fichier avec le score le plus faible est le plus représentatif.

Cette méthode est préférable à une somme simple, car elle reste lisible même si le nombre de paramètres évolue. Elle est aussi plus robuste et plus explicable qu'une distance euclidienne pour un premier prototype.

### 6.5 Absence de normalisation

Aucune normalisation entre familles de paramètres n'est appliquée dans le prototype, conformément au besoin exprimé. Les valeurs sont comparées aux mêmes valeurs issues des autres rapports, clé par clé.

Conséquence à connaître : les paramètres ayant de grandes amplitudes numériques, par exemple certaines zones de doigts et secteurs, influencent davantage le score final que les petits paramètres comme `Stress` ou `CF`. Cette conséquence est acceptée pour le prototype, car tous les paramètres doivent être comparés sans pondération.

### 6.6 Gestion des égalités

Si plusieurs fichiers ont le même meilleur score, ou un score considéré équivalent à cause des arrondis numériques, l'application affiche tous les fichiers concernés.

Tolérance recommandée :

```text
abs(scoreA - scoreB) <= 1e-9
```

### 6.7 Rapport très éloigné

Aucun rapport très éloigné ne doit être exclu automatiquement. L'application peut toutefois signaler un rapport dont le score est nettement supérieur aux autres.

Règle simple recommandée pour le prototype :

```text
signaler si score[file] > 2 × médiane_des_scores
```

Ce signalement est informatif, sans incidence sur le calcul.

### 6.8 Explication du résultat

L'explication doit rester synthétique, sans tableau détaillé. Exemple :

```text
Le fichier "2026-01-16 11_48 - Stephane MIC.csv" est le plus représentatif, car son écart moyen aux moyennes calculées est le plus faible parmi les 3 fichiers analysés. Les moyennes ont été calculées paramètre par paramètre sur 1 420 paramètres communs.
```

En cas d'égalité :

```text
Deux fichiers sont aussi représentatifs selon le score calculé : "rapport-A.csv" et "rapport-B.csv".
```

## 7. Interface utilisateur

### 7.1 Écran principal

L'interface doit contenir :

- un titre clair ;
- un court paragraphe d'explication ;
- une zone de glisser-déposer ;
- un bouton `Analyser` ;
- une zone de résultat ;
- un bouton `Exporter les moyennes CSV`, visible après analyse réussie ;
- un encart d'avertissement non médical.

Texte d'introduction proposé :

```text
Importez au moins 3 rapports CSV Bio-Well d'une même personne. L'application calcule la moyenne de chaque paramètre commun aux rapports, puis sélectionne le rapport dont les valeurs sont globalement les plus proches de ces moyennes.
```

Avertissement proposé :

```text
Cette application fournit une aide statistique à la comparaison de rapports Bio-Well. Elle ne constitue pas un dispositif médical et ne produit aucun diagnostic.
```

### 7.2 États d'interface

- Aucun fichier importé.
- Fichiers importés mais moins de 3 fichiers.
- Analyse en cours.
- Analyse réussie.
- Analyse impossible, moins de 3 fichiers exploitables.
- Analyse réussie avec avertissements sur fichiers rejetés.
- Analyse réussie avec signalement de rapport très éloigné.

### 7.3 Responsive design

L'interface doit être responsive pour permettre une réutilisation future sur tablette ou Android. La même interface doit être conservée sur toutes les plateformes.

## 8. Export CSV des moyennes

L'export doit contenir les moyennes des paramètres réellement utilisés dans l'analyse.

Colonnes recommandées :

```csv
cle;section;libelle;colonne;moyenne;nombre_fichiers
```

Exemple :

```csv
Paramètres/Stress/Valeur;Paramètres;Stress;Valeur;3,30;3
Paramètres/Énergie/Valeur;Paramètres;Énergie;Valeur;53,79;3
```

L'export ne doit pas contenir de données personnelles inutiles. Le nom de la personne ne doit pas être ajouté à l'export sauf demande future explicite.

## 9. Confidentialité et stockage

Le fonctionnement cible est sans stockage durable :

- les fichiers importés sont traités en mémoire ;
- aucun historique n'est conservé ;
- aucune base de données n'est nécessaire ;
- aucun envoi réseau ne doit être effectué dans la version hors ligne ;
- l'utilisateur ne peut pas revenir à une analyse précédente après fermeture ou réinitialisation de l'application.

Pour une version web initiale éventuelle, le traitement doit idéalement rester côté navigateur pour éviter l'envoi des rapports vers un serveur.

## 10. Stack technique recommandée

### 10.1 Recommandation principale : TypeScript + React + Vite + Tauri

Stack recommandée pour le besoin exprimé :

- **TypeScript** pour la logique métier, le parsing et les tests.
- **React** pour l'interface.
- **Vite** pour le développement frontend rapide et simple.
- **Tauri** pour produire des applications desktop autonomes Linux et Windows, avec extension possible vers macOS.
- **Vitest** pour les tests unitaires du parser et de l'algorithme.
- **Papa Parse** ou parser CSV maison contrôlé pour lire les CSV.

Justification :

- technologie largement connue et facilement assistable par IA ;
- code frontend réutilisable en version web et desktop ;
- exécutable desktop plus léger qu'Electron ;
- bonne séparation possible entre moteur de calcul et interface ;
- première version web possible sans réécrire la logique ;
- packaging Linux et Windows réaliste.

### 10.2 Architecture recommandée

```text
src/
  core/
    csvParser.ts
    biowellParser.ts
    metrics.ts
    representativity.ts
    exportMeansCsv.ts
  ui/
    components/
    pages/
  app/
    App.tsx
  tests/
    fixtures/
```

Le dossier `core` doit rester indépendant de React et de Tauri. Cela permet de tester l'algorithme facilement et de le réutiliser plus tard dans une autre interface.

### 10.3 Alternatives étudiées

#### Flutter

Flutter est intéressant si Android devient rapidement prioritaire. Il permet une interface commune desktop et mobile. Son inconvénient ici est que le parsing, les tests et le packaging desktop peuvent être moins naturellement alignés avec une première version web partageable.

#### Electron

Electron est très connu et facile à déboguer, mais plus lourd. Comme l'utilisateur souhaite éviter les technologies lourdes si possible, Electron n'est pas recommandé en premier choix.

#### Python desktop

Python est très efficace pour les calculs et le parsing, mais produire un exécutable autonome propre, multiplateforme et simple à distribuer peut être plus fragile. Il reste utile pour prototyper l'algorithme, mais moins recommandé comme base produit.

## 11. PDR — plan de développement et de réalisation

### Phase 1 — Prototype web local

Objectif : obtenir rapidement un prototype testable dans un navigateur.

Livrables :

- interface React/Vite ;
- import drag-and-drop ;
- parser CSV Bio-Well ;
- calcul de représentativité ;
- affichage du résultat ;
- export CSV des moyennes ;
- tests unitaires sur les 3 rapports d'exemple.

### Phase 2 — Durcissement métier

Objectif : fiabiliser le traitement de lots réels.

Livrables :

- messages d'erreur plus précis ;
- tolérance encodage ;
- gestion des fichiers rejetés ;
- tests sur jeux de données variés ;
- documentation utilisateur courte.

### Phase 3 — Packaging desktop

Objectif : produire des exécutables autonomes Linux et Windows.

Livrables :

- intégration Tauri ;
- build Linux ;
- build Windows ;
- vérification sans réseau ;
- procédure d'installation ou exécutable portable.

### Phase 4 — Évaluation Android/macOS

Objectif : décider de la faisabilité mobile et macOS.

Livrables :

- build macOS si environnement de signature disponible ;
- étude Android Tauri ou réévaluation Flutter si Android devient stratégique ;
- décision technique avant développement mobile.

## 12. Définition du prototype partageable

Un prototype partageable correspond ici à une application utilisable par des testeurs non développeurs pour valider le flux métier, mais pas encore forcément à un produit final industrialisé.

Critères d'acceptation :

- l'utilisateur peut importer au moins 3 CSV Bio-Well français ;
- l'analyse fonctionne avec les 3 rapports d'exemple ;
- le résultat affiche le nom du rapport le plus représentatif ;
- les fichiers rejetés sont clairement listés ;
- l'analyse est bloquée si moins de 3 fichiers sont exploitables ;
- l'export des moyennes CSV fonctionne ;
- aucun stockage durable n'est réalisé ;
- l'avertissement non médical est visible ;
- le moteur de calcul est couvert par des tests automatisés.

## 13. Points d'attention pour le développement

- Les libellés peuvent se répéter dans différentes sections, donc la clé de paramètre doit inclure le contexte.
- Les grandes sections `Les doigts et les secteurs` contiennent beaucoup de paramètres ; elles auront mécaniquement une forte influence, puisque tous les paramètres sont conservés et non pondérés.
- Le rejet d'un fichier ne doit pas bloquer toute l'analyse si au moins 3 fichiers restent exploitables.
- L'application doit rester transparente : expliquer simplement que le rapport choisi est celui qui minimise l'écart moyen aux moyennes paramètre par paramètre.
- Les tests doivent inclure les valeurs `-`, les décimales françaises, les accents et les cas d'égalité.
