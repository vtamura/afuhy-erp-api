import {
    updateFinancialObligationSchema,
    updateFinancialTransactionSchema,
} from './financial.schema'

const authUser = {
    userId: '3ccbcefd-b996-4362-94bb-46955de8813e',
    sessionId: 'a4565ba8-f85a-4a06-a6a1-56f0a827f725',
    organizationId: '59452bb1-ee59-45d3-8ab7-d35f3c12d53c',
}
const id = '00000000-0000-4000-8000-000000000001'

describe('financial update schemas', () => {
    it('parses partial transaction updates', () => {
        expect(
            updateFinancialTransactionSchema.parse({
                id,
                authUser,
                description: 'Descricao atualizada',
            }),
        ).toMatchObject({ id, description: 'Descricao atualizada' })
    })

    it('parses partial obligation updates', () => {
        expect(
            updateFinancialObligationSchema.parse({
                id,
                authUser,
                amount: '10.00',
            }),
        ).toMatchObject({ id, amount: '10.00' })
    })
})
