import { Button, Text } from '@react-email/components'
import { button, EmailLayout, muted, text } from './_components/email-layout'

export type OrganizationInvitationEmailProps = {
    organizationName: string
    invitationUrl: string
    expiresAt: Date
}

export default function OrganizationInvitationEmail(
    props: OrganizationInvitationEmailProps,
) {
    return (
        <EmailLayout
            preview={`Você foi convidado para ${props.organizationName}.`}
            title="Convite para organização"
        >
            <Text style={text}>
                Você foi convidado para participar da organização{' '}
                {props.organizationName}.
            </Text>
            <Button href={props.invitationUrl} style={button}>
                Aceitar convite
            </Button>
            <Text style={muted}>
                Este convite expira em {props.expiresAt.toLocaleString('pt-BR')}
                .
            </Text>
        </EmailLayout>
    )
}

OrganizationInvitationEmail.PreviewProps = {
    organizationName: 'Afuhy Tecnologia',
    invitationUrl:
        'http://localhost:3000/invitations/accept?token=preview-token',
    expiresAt: new Date('2026-01-08T00:00:00.000Z'),
} satisfies OrganizationInvitationEmailProps
