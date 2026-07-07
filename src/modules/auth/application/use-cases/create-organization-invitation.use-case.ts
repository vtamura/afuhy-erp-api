import { env } from '../../../../shared/config/env'
import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { OrganizationInvitationResponseDto } from '../dto'
import { toOrganizationInvitationResponseDto } from '../mappers/organization-response.mapper'
import type { AuthEmailNotifierPort } from '../ports/auth-email-notifier.port'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'

type CreateOrganizationInvitationUseCaseInput = {
    organizationId: string
    invitedByUserId: string
    email: string
    roleCodes: string[]
}

type TokenGenerator = {
    generate(): string
}

const INVITATION_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000

export class CreateOrganizationInvitationUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationInvitationRepository: OrganizationInvitationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
        private readonly roleRepository: RoleRepository,
        private readonly userRepository: UserRepository,
        private readonly tokenHasher: RefreshTokenHasherPort,
        private readonly tokenGenerator: TokenGenerator,
        private readonly emailNotifier?: AuthEmailNotifierPort,
    ) {}

    async execute(
        input: CreateOrganizationInvitationUseCaseInput,
    ): Promise<OrganizationInvitationResponseDto> {
        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const user = await this.userRepository.findByEmail(input.email)

        if (user) {
            const activeMember =
                await this.organizationUserRepository.findActiveByOrganizationAndUser(
                    {
                        organizationId: input.organizationId,
                        userId: user.id,
                    },
                )

            if (activeMember) {
                throw new ConflictError('Usuario ja e membro da organizacao')
            }
        }

        const roles = await this.getRoles(input.organizationId, input.roleCodes)
        const invitationToken = this.tokenGenerator.generate()
        const expiresAt = new Date(Date.now() + INVITATION_EXPIRES_IN_MS)
        const existingInvitation =
            await this.organizationInvitationRepository.findPendingByOrganizationAndEmail(
                {
                    organizationId: input.organizationId,
                    email: input.email,
                },
            )

        const invitation = existingInvitation
            ? await this.organizationInvitationRepository.rotatePending({
                  invitationId: existingInvitation.id,
                  tokenHash: this.tokenHasher.hash(invitationToken),
                  expiresAt,
                  roleIds: roles.map((role) => role.id),
              })
            : await this.organizationInvitationRepository.create({
                  organizationId: input.organizationId,
                  email: input.email,
                  invitedByUserId: input.invitedByUserId,
                  tokenHash: this.tokenHasher.hash(invitationToken),
                  expiresAt,
                  roleIds: roles.map((role) => role.id),
              })

        await this.enqueueOrganizationInvitationEmail({
            email: invitation.email,
            organizationName: organization.name,
            invitationToken,
            expiresAt,
        })

        return toOrganizationInvitationResponseDto(
            invitation,
            env.NODE_ENV === 'development' ? invitationToken : undefined,
        )
    }

    private async getRoles(organizationId: string, roleCodes: string[]) {
        const uniqueRoleCodes = Array.from(new Set(roleCodes))
        const roles = await this.roleRepository.findByOrganizationAndCodes({
            organizationId,
            codes: uniqueRoleCodes,
        })

        if (roles.length !== uniqueRoleCodes.length) {
            throw new NotFoundError('Role nao encontrada')
        }

        return roles
    }

    private async enqueueOrganizationInvitationEmail(input: {
        email: string
        organizationName: string
        invitationToken: string
        expiresAt: Date
    }): Promise<void> {
        try {
            await this.emailNotifier?.notifyOrganizationInvitation(input)
        } catch {
            // Invitation creation must not depend on email infrastructure.
        }
    }
}
