import {
    BadRequestError,
    UnauthorizedError,
} from '../../../../shared/domain/errors'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { PasswordHasherPort } from '../ports/password-hasher.port'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'

type AcceptOrganizationInvitationUseCaseInput = {
    token: string
    name?: string
    password?: string
}

export class AcceptOrganizationInvitationUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationInvitationRepository: OrganizationInvitationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
        private readonly roleRepository: RoleRepository,
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasherPort,
        private readonly tokenHasher: RefreshTokenHasherPort,
    ) {}

    async execute(
        input: AcceptOrganizationInvitationUseCaseInput,
    ): Promise<void> {
        const tokenHash = this.tokenHasher.hash(input.token)
        const invitation =
            await this.organizationInvitationRepository.findByTokenHash(
                tokenHash,
            )

        if (!invitation?.isUsable) {
            throw new UnauthorizedError('Convite invalido')
        }

        const organization = await this.organizationRepository.findById(
            invitation.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new UnauthorizedError('Convite invalido')
        }

        const existingUser = await this.userRepository.findByEmail(
            invitation.email,
        )
        const user = existingUser?.isActive
            ? existingUser
            : await this.createInvitedUser(input, invitation.email)
        const organizationUser =
            await this.organizationUserRepository.createOrReactivate({
                organizationId: invitation.organizationId,
                userId: user.id,
            })

        await this.roleRepository.replaceOrganizationUserRoles({
            organizationUserId: organizationUser.id,
            roleIds: invitation.roles.map((role) => role.id),
        })
        await this.organizationInvitationRepository.markAsAccepted(
            invitation.id,
        )
    }

    private async createInvitedUser(
        input: AcceptOrganizationInvitationUseCaseInput,
        email: string,
    ) {
        if (!input.name || !input.password) {
            throw new BadRequestError(
                'Nome e senha sao obrigatorios para novos usuarios',
            )
        }

        const passwordHash = await this.passwordHasher.hash(input.password)

        return this.userRepository.create({
            name: input.name,
            email,
            passwordHash,
        })
    }
}
