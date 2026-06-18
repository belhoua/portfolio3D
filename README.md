# Portfolio 3D — Belhouari Othmane

Portfolio personnel d'un développeur Full Stack, construit avec **React + Vite + Tailwind CSS v4** et une scène **3D interactive en Three.js**.

## ✨ Fonctionnalités

- **Hero 3D interactif** (Three.js) : géométrie filaire + champ de ~1400 particules en profondeur, avec parallaxe qui suit la souris.
- **Cartes en relief (tilt 3D)** sur les sections Services et Portfolio : rotation en perspective vers le curseur + reflet lumineux.
- **Mode clair / sombre** (sombre par défaut), mémorisé dans le navigateur.
- **Animations au scroll** : apparition des sections, barres de compétences animées, barre de progression de lecture.
- **100 % responsive** (desktop, tablette, mobile avec menu latéral).
- **Icônes en SVG inline** (aucune dépendance externe) et palette sombre « obsidienne ».
- **6 projets** : 3 captures réelles + 3 covers dégradés designés.
- **Accessibilité** : focus clavier visible, `prefers-reduced-motion` respecté, repli propre si WebGL est indisponible.

## 🚀 Démarrer

```bash
npm install      # installe les dépendances
npm run dev      # serveur de développement (http://localhost:5173)
npm run build    # build de production dans /dist
npm run preview  # prévisualise le build de production
```

> Node.js 18+ recommandé.

## 🛠️ Personnaliser

Toutes les données éditables sont regroupées en haut de **`src/App.jsx`** :

| Constante  | Contenu                                              |
|------------|------------------------------------------------------|
| `ROLES`    | Les rôles affichés en machine à écrire dans le hero  |
| `SKILLS`   | Tes compétences et leurs niveaux (0–100)             |
| `STATS`    | Les chiffres clés (années, projets…)                 |
| `STACK`    | Les technologies du bandeau défilant                 |
| `SERVICES` | Les services proposés                                |
| `PROJECTS` | Tes projets — `type:'image'` (capture) ou `type:'cover'` (cover dégradé) |
| `ABOUT`    | Tes informations personnelles                        |
| `SOCIALS`  | **Tes liens GitHub / LinkedIn** (actuellement `#`)   |
| `EMAIL`    | Ton adresse e-mail                                   |

### À faire avant publication
1. Remplacer les liens `#` de `SOCIALS` par tes vrais profils GitHub et LinkedIn.
2. Vérifier/ajuster les niveaux dans `SKILLS`.
3. Remplacer les images dans `public/img/` et le CV `public/cv.pdf` si besoin.
4. Pour ajouter un projet avec une vraie capture : mets l'image dans `public/img/` puis ajoute `{ type:'image', src:'/img/ton-image.png', ... }` dans `PROJECTS`.

## 🎨 Design

- **Typographie** : Space Grotesk (titres) · Inter (texte) · JetBrains Mono (libellés).
- **Palette** : fond obsidienne très sombre, accent rose, lueurs violet/cyan, léger grain.
- **Icônes** : jeu de SVG inline dans `src/Icon.jsx` (pas de Font Awesome).
- Le design system (variables CSS, verre dépoli, boutons, effets 3D) est dans **`src/index.css`**.

## 📁 Structure

```
src/
  App.jsx        → page + données éditables
  ThreeHero.jsx  → scène 3D Three.js du hero
  TiltCard.jsx   → composant carte avec effet de relief 3D
  Icon.jsx       → jeu d'icônes SVG inline
  index.css      → design system (couleurs, verre, animations)
public/
  img/           → images (profil, projets)
  cv.pdf         → CV téléchargeable
```

---
Construit avec React, Three.js & Tailwind CSS.
