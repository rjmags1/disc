import { render, screen } from '@testing-library/react'

import InvalidLoginMessage from '../../components/login/InvalidLoginMessage'

describe('InvalidLoginMessage', () => {
    test('renders div with invalid login fields message', () => {

        render(<InvalidLoginMessage />)

        expect(screen.getByTestId("invalid-message-container")).
            toBeInTheDocument()

        expect(screen.getByText(/invalid/i)).toBeInTheDocument()

        expect(screen.getByText(/account information/i)).toBeInTheDocument()
    })
})