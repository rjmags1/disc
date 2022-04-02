import { render, screen } from '@testing-library/react'

import AccountEmailSection from 
    '../../../components/settings/account/AccountEmailSection'

describe('AccountEmailSection', () => {
    const testEmails = [
        "test-email-0@test.com",
        "test-email-1@test.com",
        "test-email-2@test.com"
    ]

    test(`renders div w/ sect. header, info a/b sect.,
        email list + input`, () => {
        render(<AccountEmailSection
            primary="test-email-0" emails={ testEmails } />)

        expect(screen.getByTestId("account-email-section-container"))
            .toBeInTheDocument()

        expect(screen.getByRole("heading")).toBeInTheDocument()

        expect(screen.getByText("Email")).toBeInTheDocument()

        expect(screen.getByText(/primary email address/gi)).
            toBeInTheDocument()

        expect(screen.getByText(/can associate additional email addresses/gi))
            .toBeInTheDocument()

        expect(screen.getByText(
            /can log in using any of your registered email addresses/gi)).
            toBeInTheDocument()

        expect(screen.getByTestId("account-email-list-container")).
            toBeInTheDocument()

        expect(screen.getByTestId("add-email-container")).toBeInTheDocument()
    })

})