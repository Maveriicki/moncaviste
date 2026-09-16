import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const BIEN_PHOTOS_BUCKET = 'bien-photos'
const MAX_PHOTO_SIZE = 10 * 1024 * 1024
const MAX_PHOTOS_PER_UPLOAD = 30
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic']

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const agenceId = formData.get('agenceId')
  const bienId = formData.get('bienId')
  const files = formData.getAll('files').filter((item): item is File => item instanceof File)

  if (typeof agenceId !== 'string' || typeof bienId !== 'string') {
    return jsonError('Agence ou bien manquant.', 400)
  }

  if (files.length === 0) {
    return jsonError('Aucune photo reçue.', 400)
  }

  if (files.length > MAX_PHOTOS_PER_UPLOAD) {
    return jsonError(`Maximum ${MAX_PHOTOS_PER_UPLOAD} photos par envoi.`, 400)
  }

  const auth = await getAuthorizedClient(request, agenceId, bienId)
  if ('response' in auth) return auth.response

  for (const file of files) {
    const validationError = validatePhoto(file)
    if (validationError) return jsonError(validationError, 400)
  }

  try {
    await ensurePhotosBucket(auth.supabase)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Bucket Supabase Storage indisponible.',
      500
    )
  }

  const { data: lastPhoto } = await auth.supabase
    .from('bien_photos')
    .select('position')
    .eq('bien_id', bienId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  let position = (lastPhoto?.position ?? -1) + 1
  const uploaded: unknown[] = []

  for (const file of files) {
    const path = `${agenceId}/${bienId}/${crypto.randomUUID()}.${getExtension(file)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await auth.supabase.storage
      .from(BIEN_PHOTOS_BUCKET)
      .upload(path, buffer, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return jsonError(uploadError.message, 500)
    }

    const { data: publicUrl } = auth.supabase.storage
      .from(BIEN_PHOTOS_BUCKET)
      .getPublicUrl(path)

    const { data: photo, error: insertError } = await auth.supabase
      .from('bien_photos')
      .insert({
        bien_id: bienId,
        agence_id: agenceId,
        url: publicUrl.publicUrl,
        storage_path: path,
        position,
      })
      .select()
      .single()

    if (insertError) {
      // On ne laisse pas de fichier orphelin dans le bucket.
      await auth.supabase.storage.from(BIEN_PHOTOS_BUCKET).remove([path])
      return jsonError(insertError.message, 500)
    }

    uploaded.push(photo)
    position += 1
  }

  return NextResponse.json({ data: uploaded, error: null })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const agenceId = body?.agenceId
  const photoId = body?.photoId

  if (typeof agenceId !== 'string' || typeof photoId !== 'string') {
    return jsonError('Agence ou photo manquante.', 400)
  }

  const auth = await getAuthorizedClient(request, agenceId)
  if ('response' in auth) return auth.response

  const { data: photo } = await auth.supabase
    .from('bien_photos')
    .select('id, storage_path, agence_id')
    .eq('id', photoId)
    .maybeSingle()

  if (!photo || photo.agence_id !== agenceId) {
    return jsonError('Photo introuvable pour cette agence.', 404)
  }

  if (photo.storage_path) {
    await auth.supabase.storage.from(BIEN_PHOTOS_BUCKET).remove([photo.storage_path])
  }

  const { error } = await auth.supabase.from('bien_photos').delete().eq('id', photoId)

  if (error) return jsonError(error.message, 500)

  return NextResponse.json({ data: null, error: null })
}

async function getAuthorizedClient(
  request: NextRequest,
  agenceId: string,
  bienId?: string
) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!token) {
    return { response: jsonError('Session Supabase manquante.', 401) }
  }

  const supabase = createAdminClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return { response: jsonError('Session Supabase invalide.', 401) }
  }

  const { data: agence } = await supabase
    .from('agences')
    .select('id')
    .eq('id', agenceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!agence) {
    return { response: jsonError('Agence non autorisée.', 403) }
  }

  if (bienId) {
    const { data: bien } = await supabase
      .from('biens')
      .select('id')
      .eq('id', bienId)
      .eq('agence_id', agenceId)
      .maybeSingle()

    if (!bien) {
      return { response: jsonError('Bien non autorisé pour cette agence.', 403) }
    }
  }

  return { supabase }
}

async function ensurePhotosBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase.storage.getBucket(BIEN_PHOTOS_BUCKET)

  if (!error) return

  const { error: createError } = await supabase.storage.createBucket(BIEN_PHOTOS_BUCKET, {
    public: true,
    fileSizeLimit: MAX_PHOTO_SIZE,
    allowedMimeTypes: ALLOWED_IMAGE_TYPES,
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw createError
  }
}

function validatePhoto(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Format non supporté (${file.name}). Utilisez JPG, PNG, WebP, AVIF ou HEIC.`
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return `Photo trop lourde (${file.name}). Taille maximale : 10 Mo.`
  }

  return null
}

function getExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension && ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic'].includes(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension
  }

  return file.type.replace('image/', '') || 'jpg'
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ data: null, error }, { status })
}
