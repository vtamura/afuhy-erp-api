export type AccessVisibility = 'PUBLICA' | 'PRIVADA'
export type ShareAccessType = 'LEITURA' | 'EDICAO'

type EvaluateResourceAccessInput = {
  hasRestriction: boolean
  visibility?: AccessVisibility
  hasUserShare?: boolean
  restrictionCompanyId?: string | null
  ownerUserIds?: Array<number | string>
  viewerUserId?: number
  viewerCompanyId?: string
}

export function evaluateResourceAccess(
  input: EvaluateResourceAccessInput,
): boolean {
  const {
    hasRestriction,
    visibility,
    hasUserShare = false,
    restrictionCompanyId,
    ownerUserIds = [],
    viewerUserId,
    viewerCompanyId,
  } = input

  if (!hasRestriction) {
    return true
  }

  if (viewerUserId === undefined) {
    return false
  }

  if (visibility === 'PUBLICA') {
    return true
  }

  if (
    restrictionCompanyId &&
    viewerCompanyId &&
    String(restrictionCompanyId) === String(viewerCompanyId)
  ) {
    return true
  }

  const normalizedViewerUserId = Number(viewerUserId)
  const isOwner = ownerUserIds.some(
    (ownerUserId) => Number(ownerUserId) === normalizedViewerUserId,
  )

  if (isOwner) {
    return true
  }

  return hasUserShare
}

type EvaluateFolderManagementAccessInput = {
  visibility?: AccessVisibility
  ownerUserId?: number | string
  viewerUserId?: number
  shareAccessType?: ShareAccessType
}

export function evaluateFolderManagementAccess(
  input: EvaluateFolderManagementAccessInput,
): boolean {
  const { visibility, ownerUserId, viewerUserId, shareAccessType } = input

  if (viewerUserId === undefined) {
    return false
  }

  if (
    ownerUserId !== undefined &&
    Number(ownerUserId) === Number(viewerUserId)
  ) {
    return true
  }

  return visibility === 'PRIVADA' && shareAccessType === 'EDICAO'
}

type EvaluateFolderUploadAccessInput = {
  hasRestriction: boolean
  visibility?: AccessVisibility
  ownerUserId?: number | string
  viewerUserId?: number
  shareAccessType?: ShareAccessType
}

export function evaluateFolderUploadAccess(
  input: EvaluateFolderUploadAccessInput,
): boolean {
  const { hasRestriction, visibility, ownerUserId, viewerUserId, shareAccessType } =
    input

  if (viewerUserId === undefined) {
    return false
  }

  if (
    ownerUserId !== undefined &&
    Number(ownerUserId) === Number(viewerUserId)
  ) {
    return true
  }

  if (!hasRestriction || visibility === 'PUBLICA') {
    return true
  }

  return shareAccessType === 'EDICAO'
}
