import { render, screen } from '@testing-library/react'

import EmailLoginButton from '../../components/login/EmailLoginButton'

describe('EmailLoginButton', () => {
    test('renders button with email me label', () => {
        render(<EmailLoginButton />)

        expect(screen.getByRole('button')).toBeInTheDocument()

        expect(screen.getByText(/email me login link/gi)).
            toBeInTheDocument()
    })
})