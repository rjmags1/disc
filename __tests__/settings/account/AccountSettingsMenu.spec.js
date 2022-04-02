import { render, screen } from '@testing-library/react'

import AccountSettingsMenu from 
    '../../../components/settings/account/AccountSettingsMenu'

describe('AccountSettingsMenu', () => {
    test('renders div containing prof card, email sect, pass. sect', () => {
        render(<AccountSettingsMenu />)

        expect(screen.getByTestId("account-menu-container")).
            toBeInTheDocument()

        expect(screen.getByTestId("profile-card-container")).
            toBeInTheDocument()

        expect(screen.getByTestId("account-email-section-container")).
            toBeInTheDocument()

        expect(screen.getByTestId("account-password-section-container")).
            toBeInTheDocument()
    })
})