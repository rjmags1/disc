import { render, screen } from '@testing-library/react'

import NormalLoginButton from '../../components/login/NormalLoginButton'

describe('NormalLoginButton', () => {
    test('renders button with basic login label', () => {
        render(<NormalLoginButton />)

        expect(screen.getByRole('button')).toBeInTheDocument()

        expect(screen.getByText(/login/gi)).
            toBeInTheDocument()
    })
})