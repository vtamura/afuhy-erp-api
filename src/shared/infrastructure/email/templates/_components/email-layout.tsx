import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

const main = {
    backgroundColor: '#f6f7f9',
    color: '#1f2937',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif',
    margin: '0',
    padding: '32px 16px',
}

const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    margin: '0 auto',
    maxWidth: '560px',
    padding: '32px',
}

export const heading = {
    color: '#111827',
    fontSize: '22px',
    fontWeight: '700',
    lineHeight: '1.3',
    margin: '0 0 16px',
}

export const text = {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 16px',
}

export const button = {
    backgroundColor: '#111827',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px 18px',
    textDecoration: 'none',
}

export const muted = {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '16px 0 0',
}

type EmailLayoutProps = {
    preview: string
    title: string
    children: ReactNode
}

export function EmailLayout(props: EmailLayoutProps) {
    return (
        <Html lang="pt-BR">
            <Head />
            <Preview>{props.preview}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={heading}>{props.title}</Heading>
                    {props.children}
                    <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
                    <Text style={muted}>
                        Se você não reconhece esta ação, ignore este email.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}
