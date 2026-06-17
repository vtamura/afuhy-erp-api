import {
    AddOrganizationMemberUseCase,
    CancelOrganizationInvitationUseCase,
    CreateOrganizationInvitationUseCase,
    CreateOrganizationUseCase,
    ListOrganizationInvitationsUseCase,
    ListOrganizationMembersUseCase,
    ListOrganizationRolesUseCase,
    ListOrganizationsUseCase,
    RemoveOrganizationMemberUseCase,
    UpdateMemberRolesUseCase,
} from '../../application/use-cases'
import {
    AddOrganizationMemberController,
    CancelOrganizationInvitationController,
    CreateOrganizationController,
    CreateOrganizationInvitationController,
    ListOrganizationInvitationsController,
    ListOrganizationMembersController,
    ListOrganizationRolesController,
    ListOrganizationsController,
    RemoveOrganizationMemberController,
    UpdateMemberRolesController,
} from '../../presentation/http/controllers'
import { createOrganizationsRouter } from '../../presentation/http/routes'
import type { AuthHttpRouterFactoryDependencies } from './auth-http-router-factory.types'

export function createOrganizationsHttpRouterFactory(
    deps: AuthHttpRouterFactoryDependencies,
) {
    const {
        organizationInvitationRepository,
        organizationRepository,
        organizationUserRepository,
        roleRepository,
        userRepository,
    } = deps.repositories
    const { refreshTokenHasher, secureTokenGenerator } = deps.security
    const {
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
        enforceUserLimitMiddleware,
    } = deps.middlewares

    const createOrganizationUseCase = new CreateOrganizationUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
    )
    const listOrganizationsUseCase = new ListOrganizationsUseCase(
        organizationRepository,
    )
    const listOrganizationMembersUseCase = new ListOrganizationMembersUseCase(
        organizationRepository,
        organizationUserRepository,
    )
    const listOrganizationRolesUseCase = new ListOrganizationRolesUseCase(
        organizationRepository,
        roleRepository,
    )
    const createOrganizationInvitationUseCase =
        new CreateOrganizationInvitationUseCase(
            organizationRepository,
            organizationInvitationRepository,
            organizationUserRepository,
            roleRepository,
            userRepository,
            refreshTokenHasher,
            secureTokenGenerator,
        )
    const listOrganizationInvitationsUseCase =
        new ListOrganizationInvitationsUseCase(
            organizationRepository,
            organizationInvitationRepository,
        )
    const cancelOrganizationInvitationUseCase =
        new CancelOrganizationInvitationUseCase(
            organizationRepository,
            organizationInvitationRepository,
        )
    const addOrganizationMemberUseCase = new AddOrganizationMemberUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
        userRepository,
    )
    const updateMemberRolesUseCase = new UpdateMemberRolesUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
    )
    const removeOrganizationMemberUseCase = new RemoveOrganizationMemberUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
    )

    return createOrganizationsRouter({
        createOrganizationController: new CreateOrganizationController(
            createOrganizationUseCase,
        ),
        listOrganizationsController: new ListOrganizationsController(
            listOrganizationsUseCase,
        ),
        listOrganizationMembersController:
            new ListOrganizationMembersController(
                listOrganizationMembersUseCase,
            ),
        listOrganizationRolesController: new ListOrganizationRolesController(
            listOrganizationRolesUseCase,
        ),
        createOrganizationInvitationController:
            new CreateOrganizationInvitationController(
                createOrganizationInvitationUseCase,
            ),
        listOrganizationInvitationsController:
            new ListOrganizationInvitationsController(
                listOrganizationInvitationsUseCase,
            ),
        cancelOrganizationInvitationController:
            new CancelOrganizationInvitationController(
                cancelOrganizationInvitationUseCase,
            ),
        addOrganizationMemberController: new AddOrganizationMemberController(
            addOrganizationMemberUseCase,
        ),
        updateMemberRolesController: new UpdateMemberRolesController(
            updateMemberRolesUseCase,
        ),
        removeOrganizationMemberController:
            new RemoveOrganizationMemberController(
                removeOrganizationMemberUseCase,
            ),
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
        enforceUserLimitMiddleware,
    })
}
