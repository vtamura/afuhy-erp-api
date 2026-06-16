import type { RequestHandler } from 'express'
import {
    ForbiddenError,
    UnauthorizedError,
} from '../../../../../shared/domain/errors'
import type { OrganizationUserRepository } from '../../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../../domain/repositories/role.repository'

type AuthorizePermissionOptions = {
    organizationIdParam?: string
}

export function createAuthorizePermissionMiddleware(
    organizationUserRepository: OrganizationUserRepository,
    roleRepository: RoleRepository,
) {
    return (
            permissionCode: string,
            options: AuthorizePermissionOptions = {},
        ): RequestHandler =>
        async (req, _res, next) => {
            try {
                const authUser = req.authUser

                if (!authUser) {
                    throw new UnauthorizedError('Usuario nao autenticado')
                }

                if (!authUser.organizationId) {
                    throw new ForbiddenError('Organizacao nao selecionada')
                }

                const routeOrganizationId = options.organizationIdParam
                    ? req.params[options.organizationIdParam]
                    : undefined

                if (
                    routeOrganizationId &&
                    routeOrganizationId !== authUser.organizationId
                ) {
                    throw new ForbiddenError(
                        'Organizacao selecionada nao corresponde a rota',
                    )
                }

                const organizationUser =
                    await organizationUserRepository.findActiveByOrganizationAndUser(
                        {
                            organizationId: authUser.organizationId,
                            userId: authUser.userId,
                        },
                    )

                if (!organizationUser) {
                    throw new ForbiddenError(
                        'Usuario sem vinculo ativo com a organizacao',
                    )
                }

                const hasPermission = await roleRepository.userHasPermission({
                    userId: authUser.userId,
                    organizationId: authUser.organizationId,
                    permissionCode,
                })

                if (!hasPermission) {
                    throw new ForbiddenError('Permissao insuficiente')
                }

                return next()
            } catch (error) {
                return next(error)
            }
        }
}
