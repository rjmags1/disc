import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AccountSettingsMenu from '../../../components/settings/account/AccountSettingsMenu'

describe('AccountSettingsMenu', () => {
    test('renders div containing prof card, email sect, pass. sect', () => {
        render(<AccountSettingsMenu />)
        expect(screen.getByTestId("account-menu-container")).toBeInTheDocument()
        expect(screen.getByTestId("profile-card-container")).toBeInTheDocument()
        expect(screen.getByTestId("account-email-section-container")).toBeInTheDocument()
        expect(screen.getByTestId("account-password-section-container")).toBeInTheDocument()
    })

    test('successful add email reflected in ui', async () => {
        render(<AccountSettingsMenu />)
        const oldNumEmailListItems = screen.getAllByRole("listitem").length
        userEvent.type(screen.getByLabelText(/add email address/gi), "validEmail@test.com")
        userEvent.click(screen.getByTestId("add-email-container").firstElementChild.children[1])
        const newEmailListItems = await screen.findAllByRole("listitem")
        expect(newEmailListItems.length).toEqual(oldNumEmailListItems + 1)
    })

    //test('successful update password reflected in ui', () => {
    //})
})