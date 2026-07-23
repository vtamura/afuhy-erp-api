import { Button, Text } from '@react-email/components'
import { env } from '../../../config/env'
import { buildEmailTokenUrl } from '../email-url'
import { button, EmailLayout, muted, text } from './_components/email-layout'

export type PasswordResetEmailProps = {
    name: string
    resetUrl: string
    expiresAt: Date
}

export default function PasswordResetEmail(props: PasswordResetEmailProps) {
    return (
        <EmailLayout
            preview="Use o link para redefinir sua senha."
            title="Redefinição de senha"
        >
            <Text style={text}>
                Olá, {props.name}. Recebemos uma solicitação para redefinir sua
                senha.
            </Text>
            <Button href={props.resetUrl} style={button}>
                Redefinir senha
            </Button>
            <Text style={muted}>
                Este link expira em {props.expiresAt.toLocaleString('pt-BR')}.
            </Text>
        </EmailLayout>
    )
}

PasswordResetEmail.PreviewProps = {
    name: 'Maria Silva',
    resetUrl: buildEmailTokenUrl(env.PASSWORD_RESET_PATH, 'preview-token'),
    expiresAt: new Date('2026-01-01T00:30:00.000Z'),
} satisfies PasswordResetEmailProps
