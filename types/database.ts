// ============================================================
//  MonCaviste SaaS — Database Types
//  Générés depuis le schéma Supabase
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type WineColor    = 'rouge' | 'blanc' | 'rose' | 'effervescent'
export type WineDryness  = 'sec' | 'demi-sec' | 'moelleux'
export type WineTannin   = 'leger' | 'souple' | 'tannique'
export type CavistePlan  = 'free' | 'pro' | 'premium'

// ─── Caviste (tenant) ───
export interface Caviste {
  id:            string
  user_id:       string
  slug:          string
  name:          string
  logo_url:      string | null
  primary_color: string
  address:       string | null
  phone:         string | null
  website:       string | null
  plan:          CavistePlan
  is_active:     boolean
  settings:      CavisteSettings
  created_at:    string
  updated_at:    string
}

export interface CavisteSettings {
  languages:           string[]
  screensaver_timeout: number
  kiosk_mode:          boolean
  admin_password:      string
  show_stock:          boolean
}

// ─── Wine ───
export interface Wine {
  id:           string
  caviste_id:   string
  name:         string
  color:        WineColor
  style:        string | null
  region:       string | null
  appellation:  string | null
  price:        number
  dryness:      WineDryness | null
  tannin:       WineTannin | null
  vintage:      number | null
  in_stock:     boolean
  stock_qty:    number | null
  foods:        string[]
  occasions:    string[]
  degustation:  string | null
  accord:       string | null
  description:  string | null
  temperature:  string | null
  garde:        string | null
  profil:       WineProfil
  image_url:    string | null
  position:     number
  created_at:   string
  updated_at:   string
}

export interface WineProfil {
  tanins:  number  // 0–100
  acidite: number
  corps:   number
  fruit:   number
  sucre:   number
}

// ─── Conversation ───
export interface Conversation {
  id:          string
  caviste_id:  string
  session_id:  string
  lang:        string
  messages:    ChatMessage[]
  answers:     QuestionnaireAnswers
  results:     string[]  // wine ids
  started_at:  string
  ended_at:    string | null
}

export interface ChatMessage {
  role:    'user' | 'bot'
  content: string
  ts:      string
}

export interface QuestionnaireAnswers {
  occasion?: string | null
  food?:     string | null
  color?:    WineColor | null
  tannin?:   WineTannin | null
  budget?:   number | null
}

// ─── Wine Rating ───
export interface WineRating {
  id:          string
  wine_id:     string
  caviste_id:  string
  session_id:  string
  score:       number
  created_at:  string
}

// ─── Stats dashboard ───
export interface CavisteStats {
  total_wines:         number
  wines_in_stock:      number
  total_conversations: number
  conversations_today: number
  avg_rating:          number | null
  top_wine:            { name: string; avg: number } | null
}

// ─── API responses ───
export type ApiSuccess<T> = { data: T; error: null }
export type ApiError      = { data: null; error: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Forms ───
export interface RegisterForm {
  email:      string
  password:   string
  shop_name:  string
}

export interface LoginForm {
  email:    string
  password: string
}

export interface WineForm {
  name:        string
  color:       WineColor
  style:       string
  region:      string
  price:       number
  dryness:     WineDryness
  tannin:      WineTannin | ''
  vintage:     number | ''
  in_stock:    boolean
  foods:       string
  occasions:   string
  description: string
  accord:      string
  degustation: string
  temperature: string
  garde:       string
}
