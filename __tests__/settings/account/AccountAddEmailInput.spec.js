import { render, screen } from '@testing-library/react'

import AccountAddEmailInput from '../../../components/settings/account/AccountAddEmailInput'

describe('AccountAddEmailInput', () => {
    test('renders new email input with add email address label', () => {
        render(<AccountAddEmailInput />)

        expect(screen.getByRole('textbox')).toBeInTheDocument()

        expect(screen.getByText(/add email address/i)).
            toBeInTheDocument()
    })

    test('renders button to submit new email with add label', () => {
        render(<AccountAddEmailInput />)

        expect(screen.getByRole('button')).toBeInTheDocument()

        expect(screen.getByText(/^add$/i)).toBeInTheDocument()
    })
})