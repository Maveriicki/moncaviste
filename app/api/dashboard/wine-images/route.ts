import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const WINE_IMAGES_BUCKET = 'wine-images'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file')
  const cavisteId = formData.get('cavisteId')

  if (!(file instanceof File) || typeof cavisteId !== 'string') {
    return jsonError('Image ou caviste manquant.', 400)
  }

  const auth = await getAuthorizedStorageClient(request, cavisteId)
  if ('response' in auth) return auth.response

  const validationError = validateImageFile(file)
  if (validationError) {
    return jsonError(validationError, 400)
  }

  try {
    await ensureWineImagesBucket(auth.supabase)
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : 'Bucket Supabase Storage indisponible.',
      500
    )
  }

  const extension = getImageExtension(file)
  const path = `${cavisteId}/${crypto.randomUUID()}.${extension}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error } = await auth.supabase.storage
    .from(WINE_IMAGES_BUCKET)
    .upload(path, fileBuffer, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return jsonError(error.message, 500)
  }

  const { data } = auth.supabase.storage
    .from(WINE_IMAGES_BUCKET)
    .getPublicUrl(path)

  return NextResponse.json({
    data: {
      path,
      publicUrl: data.publicUrl,
    },
    error: null,
  })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const imageUrl = body?.imageUrl
  const cavisteId = body?.cavisteId

  if (typeof imageUrl !== 'string' || typeof cavisteId !== 'string') {
    return jsonError('Image ou caviste manquant.', 400)
  }

  const auth = await getAuthorizedStorageClient(request, cavisteId)
  if ('response' in auth) return auth.response

  const path = getStoragePathFromPublicUrl(imageUrl)

  if (!path) {
    return NextResponse.json({ data: null, error: null })
  }

  if (!path.startsWith(`${cavisteId}/`)) {
    return jsonError('Image non autorisée pour ce caviste.', 403)
  }

  const { error } = await auth.supabase.storage
    .from(WINE_IMAGES_BUCKET)
    .remove([path])

  if (error) {
    return jsonError(error.message, 500)
  }

  return NextResponse.json({ data: null, error: null })
}

async function getAuthorizedStorageClient(
  request: NextRequest,
  cavisteId: string
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

  const { data: caviste } = await supabase
    .from('cavistes')
    .select('id')
    .eq('id', cavisteId)
    .eq('user_id', user.id)
    .single()

  if (!caviste) {
    return { response: jsonError('Caviste non autorisé.', 403) }
  }

  return { supabase }
}

async function ensureWineImagesBucket(
  supabase: ReturnType<typeof createAdminClient>
) {
  const { error } = await supabase.storage.getBucket(WINE_IMAGES_BUCKET)

  if (!error) return

  const { error: createError } = await supabase.storage.createBucket(
    WINE_IMAGES_BUCKET,
    {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    }
  )

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw createError
  }
}

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Format image non supporté. Utilisez JPG, PNG, WebP ou AVIF.'
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return 'Image trop lourde. Taille maximale : 5 Mo.'
  }

  return null
}

function getImageExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension && ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension
  }

  return file.type.replace('image/', '') || 'jpg'
}

function getStoragePathFromPublicUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl)
    const marker = `/storage/v1/object/public/${WINE_IMAGES_BUCKET}/`
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) return null

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ data: null, error }, { status })
}
