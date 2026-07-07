import { Text } from '@react-email/components'
import { EmailLayout, text } from './_components/email-layout'

export type UserCreatedEmailProps = {
    name: string
}

export default function UserCreatedEmail(props: UserCreatedEmailProps) {
    return (
        <EmailLayout
            preview="Sua conta Afuhy foi criada."
            title="Bem-vindo ao Afuhy"
        >
            <Text style={text}>
                Olá, {props.name}. Sua conta foi criada com sucesso.
            </Text>
            <Text style={text}>
                Agora você já pode acessar o ERP com suas credenciais.
            </Text>
        </EmailLayout>
    )
}

UserCreatedEmail.PreviewProps = {
    name: 'Maria Silva',
} satisfies UserCreatedEmailProps
