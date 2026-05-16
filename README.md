# MonCaviste SaaS — Guide d'installation

## Stack technique
- **Next.js 14** (App Router)
- **Supabase** (Auth + PostgreSQL + RLS)
- **TypeScript**
- **Vercel** (hébergement)

---

## 1. Installation des dépendances

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## 2. Variables d'environnement

Copie `.env.local.example` en `.env.local` et remplis les valeurs :

```bash
cp .env.local.example .env.local
```

Les clés se trouvent dans ton dashboard Supabase :
**Settings → API → Project URL & anon key & service_role key**

Sur Vercel, ajoute ces variables dans :
**Settings → Environment Variables**

---

## 3. Base de données Supabase

Dans **Supabase Dashboard → SQL Editor**, exécute dans cet ordre :

```sql
-- Copie le contenu de :
supabase/migrations/001_initial_schema.sql
```

Ce script crée :
- `cavistes` — les comptes cavistes (tenants)
- `wines` — le catalogue de chaque caviste
- `conversations` — historique des sessions client
- `wine_ratings` — notes clients
- Toutes les politiques **Row Level Security**
- Le trigger de création automatique du profil caviste

---

## 4. Architecture multi-tenant

```
URL publique :  https://ton-domaine.com/{slug-du-caviste}
Dashboard :     https://ton-domaine.com/dashboard
Auth :          https://ton-domaine.com/login
                https://ton-domaine.com/register
```

### Flux de données
```
Client (tablette) → /{slug} → [tenant]/page.tsx (SSR)
                            → Supabase: getCavisteBySlug()
                            → Supabase: getPublicWines()
                            → WidgetClient.tsx (hydration)
```

### Isolation des données
- Chaque caviste a un `id` unique (UUID)
- Tous les vins sont liés à `caviste_id`
- Les **Row Level Security** Supabase empêchent un caviste d'accéder aux données d'un autre
- Le widget public ne voit que les vins `in_stock = true`

---

## 5. Structure des fichiers générés

```
├── lib/
│   └── supabase.ts          ← Client + tous les helpers
├── types/
│   └── database.ts          ← Types TypeScript complets
├── middleware.ts             ← Protection des routes
├── app/
│   ├── login/page.tsx        ← Auth
│   ├── register/page.tsx     ← Inscription caviste
│   ├── dashboard/
│   │   ├── layout.tsx        ← Sidebar + nav
│   │   ├── page.tsx          ← Vue d'ensemble + stats
│   │   └── wines/
│   │       ├── page.tsx      ← Catalogue (CRUD)
│   │       └── new/page.tsx  ← Formulaire vin
│   └── [tenant]/
│       └── page.tsx          ← Widget public
├── components/
│   └── widget/
│       └── WidgetClient.tsx  ← Widget client complet
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 6. Pages dashboard à créer ensuite

### `/dashboard/wines/[id]/page.tsx` — Édition d'un vin
Réutilise `WineFormPage` avec `params.id`.

### `/dashboard/wines/import/page.tsx` — Import CSV
```tsx
// Parse le CSV et appelle importWinesFromCSV()
import { importWinesFromCSV } from '@/lib/supabase'
```

### `/dashboard/stats/page.tsx` — Statistiques
```tsx
// Utilise getCavisteStats() + getConversations()
import { getCavisteStats, getConversations } from '@/lib/supabase'
```

### `/dashboard/settings/page.tsx` — Paramètres
```tsx
// Met à jour caviste.settings via updateCavisteProfile()
import { updateCavisteProfile } from '@/lib/supabase'
```

---

## 7. Déploiement Vercel

```bash
# Push sur GitHub
git add .
git commit -m "feat: MonCaviste SaaS initial"
git push

# Vercel déploie automatiquement
# Ajoute les variables d'env dans Vercel Dashboard
```

---

## 8. Ajouter un caviste manuellement (dev)

```sql
-- Dans Supabase SQL Editor
-- 1. Crée un user via Auth
-- Le trigger handle_new_user() crée automatiquement le caviste

-- Pour vérifier :
SELECT * FROM public.cavistes;
```

---

## 9. Sécurité — checklist

- [x] RLS activé sur toutes les tables
- [x] Service role key uniquement côté serveur (API routes)
- [x] Anon key uniquement pour le client
- [x] Middleware protège `/dashboard`
- [x] Slug unique par caviste
- [ ] À faire : rate limiting sur les API publiques
- [ ] À faire : validation des inputs côté serveur
- [ ] À faire : CSP headers dans next.config.js
