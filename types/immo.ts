// ============================================================
//  Module Immobilier — Types
// ============================================================

export type BienKind =
  | 'maison'
  | 'appartement'
  | 'terrain'
  | 'local'
  | 'immeuble'
  | 'parking'

export type BienTransaction = 'vente' | 'location'

export type BienStatus =
  | 'brouillon'
  | 'disponible'
  | 'sous_compromis'
  | 'vendu'
  | 'loue'

export type EnergyGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface Agence {
  id:            string
  user_id:       string
  slug:          string
  name:          string
  logo_url:      string | null
  primary_color: string
  address:       string | null
  phone:         string | null
  email:         string | null
  website:       string | null
  is_active:     boolean
  created_at:    string
  updated_at:    string
}

export interface Bien {
  id:            string
  agence_id:     string
  reference:     string
  public_token:  string
  title:         string
  kind:          BienKind
  transaction:   BienTransaction
  status:        BienStatus
  price:         number
  charges:       number | null
  fees:          string | null
  surface:       number | null
  land_surface:  number | null
  rooms:         number | null
  bedrooms:      number | null
  bathrooms:     number | null
  floor:         number | null
  year_built:    number | null
  dpe:           EnergyGrade | null
  ges:           EnergyGrade | null
  city:          string | null
  postal_code:   string | null
  address:       string | null
  description:   string | null
  features:      string[]
  contact_name:  string | null
  contact_phone: string | null
  contact_email: string | null
  is_published:  boolean
  scans_count:   number
  created_at:    string
  updated_at:    string
}

export interface BienPhoto {
  id:           string
  bien_id:      string
  agence_id:    string
  url:          string
  storage_path: string | null
  caption:      string | null
  position:     number
  created_at:   string
}

export interface BienWithPhotos extends Bien {
  photos: BienPhoto[]
}

export interface AgenceStats {
  total_biens:   number
  biens_publies: number
  total_photos:  number
  total_scans:   number
  scans_7j:      number
}

export interface ImmoDashboardData {
  agence: Agence
  biens:  BienWithPhotos[]
  stats:  AgenceStats | null
}

// ─── Formulaire de saisie ───
export interface BienForm {
  title:         string
  reference:     string
  kind:          BienKind
  transaction:   BienTransaction
  status:        BienStatus
  price:         string
  charges:       string
  fees:          string
  surface:       string
  land_surface:  string
  rooms:         string
  bedrooms:      string
  bathrooms:     string
  floor:         string
  year_built:    string
  dpe:           EnergyGrade | ''
  ges:           EnergyGrade | ''
  city:          string
  postal_code:   string
  address:       string
  description:   string
  features:      string
  contact_name:  string
  contact_phone: string
  contact_email: string
  is_published:  boolean
}

// ─── Annonce publique (retour de get_bien_public) ───
export interface PublicBien {
  id:            string
  reference:     string
  title:         string
  kind:          BienKind
  transaction:   BienTransaction
  status:        BienStatus
  price:         number
  charges:       number | null
  fees:          string | null
  surface:       number | null
  land_surface:  number | null
  rooms:         number | null
  bedrooms:      number | null
  bathrooms:     number | null
  floor:         number | null
  year_built:    number | null
  dpe:           EnergyGrade | null
  ges:           EnergyGrade | null
  city:          string | null
  postal_code:   string | null
  description:   string | null
  features:      string[]
  contact_name:  string | null
  contact_phone: string | null
  contact_email: string | null
}

export interface PublicAgence {
  name:          string
  logo_url:      string | null
  primary_color: string | null
  phone:         string | null
  email:         string | null
  website:       string | null
}

export interface PublicPhoto {
  url:     string
  caption: string | null
}

export interface PublicListing {
  bien:   PublicBien
  agence: PublicAgence
  photos: PublicPhoto[]
}

export const BIEN_KIND_LABELS: Record<BienKind, string> = {
  maison:      'Maison',
  appartement: 'Appartement',
  terrain:     'Terrain',
  local:       'Local / commerce',
  immeuble:    'Immeuble',
  parking:     'Parking / box',
}

export const BIEN_STATUS_LABELS: Record<BienStatus, string> = {
  brouillon:      'Brouillon',
  disponible:     'Disponible',
  sous_compromis: 'Sous compromis',
  vendu:          'Vendu',
  loue:           'Loué',
}
