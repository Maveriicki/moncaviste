# Module Immobilier — photos + QR code

Une agence importe les photos d'un bien, l'application génère un QR code.
Collé sur l'annonce en vitrine, ce QR code ouvre sur le téléphone du visiteur
la galerie photos et l'annonce complète — sans application à installer, sans
compte à créer.

## 1. Installation

```bash
npm install
```

Variables d'environnement (`.env.local`, cf. `.env.local.example`) :

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client navigateur + lecture publique de l'annonce |
| `SUPABASE_SERVICE_ROLE_KEY` | upload des photos côté serveur (route API uniquement) |
| `NEXT_PUBLIC_APP_URL` | **domaine public** encodé dans le QR code |

> `NEXT_PUBLIC_APP_URL` doit pointer sur le domaine réellement utilisé en
> production : c'est cette URL qui est imprimée dans le QR code. La changer
> après impression rend les affiches déjà collées inopérantes.

## 2. Base de données

Appliquer la migration `supabase/migrations/002_immo_schema.sql` (SQL Editor
Supabase ou `supabase db push`). Elle crée :

- `agences` — un tenant par agent immobilier (lié à `auth.users`) ;
- `biens` — les annonces, avec `public_token` (cible du QR code) et `reference` ;
- `bien_photos` — les photos, ordonnées (`position` 0 = photo de couverture) ;
- `bien_scans` — un enregistrement par scan, pour les statistiques ;
- `get_bien_public(token)` — lecture publique filtrée (fonction `security definer`) ;
- `next_bien_reference(agence_id)` et `get_agence_stats(agence_id)`.

Le bucket Storage `bien-photos` est créé automatiquement au premier import.

### Confidentialité

Les tables ne sont **pas** lisibles publiquement : RLS restreint tout à
l'agence propriétaire. La page publique passe uniquement par
`get_bien_public()`, qui :

- refuse les brouillons et les annonces dépubliées (`is_published = false`) ;
- ne renvoie jamais l'adresse exacte (`biens.address`), réservée à l'interne ;
- incrémente le compteur de scans.

Le `public_token` fait 24 caractères hexadécimaux aléatoires : il n'est pas
devinable et n'expose pas le reste du portefeuille de l'agence.

## 3. Parcours agence

1. Connexion sur `/login`, puis `/immo/dashboard` (l'agence est créée
   automatiquement à la première visite).
2. **+ Nouveau bien** → saisie de l'annonce (type, prix, surface, DPE, etc.).
   La référence est proposée automatiquement (`REF-2026-001`).
3. Import des photos : glisser-déposer ou sélection multiple (JPG, PNG, WebP,
   AVIF, HEIC — 10 Mo par photo, 30 photos par envoi). La première photo sert
   de couverture ; les flèches réordonnent, chaque photo peut porter une légende.
4. **Affiche vitrine A4** → page prête à imprimer (titre, prix, points clés,
   grand QR code « Scannez pour voir toutes les photos »).
   Le QR code seul est aussi téléchargeable en PNG ou en SVG (pour un flyer ou
   une plaquette).
5. Le tableau de bord affiche le nombre de scans par bien : on voit
   immédiatement quelles vitrines fonctionnent.

Retirer une annonce de la vitrine : bouton **Retirer de la vitrine**
(`is_published = false`). Le QR code déjà collé cesse aussitôt d'afficher
l'annonce, sans rien supprimer.

## 4. Parcours visiteur

Scan du QR code → `/bien/<public_token>` : galerie plein écran (navigation
clavier et tactile), prix, caractéristiques, description, points forts, appel
ou email direct vers l'agence. Page mobile-first, aucune authentification.

## 5. Structure du code

| Chemin | Rôle |
| --- | --- |
| `app/immo/dashboard/` | espace agence (liste, création, édition, affiche) |
| `app/bien/[token]/` | annonce publique servie au scan |
| `app/api/immo/photos/` | upload/suppression des photos (service role, ownership vérifiée) |
| `features/immo-dashboard/components/` | formulaire, gestionnaire de photos, carte QR |
| `services/immo-*.service.ts` | accès données agence, photos, annonce publique |
| `lib/immo/` | URL publique du QR code, formatage prix/surfaces |
| `types/immo.ts` | types du module |
