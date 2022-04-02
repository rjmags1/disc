import { render, screen } from '@testing-library/react'

import AccountEmailList from 
    '../../../components/settings/account/AccountEmailList'

describe('AccountEmailList', () => {
    const testPrimaryEmail = "test-email-0@test.com"
    const testEmails = [
        "test-email-0@test.com",
        "test-email-1@test.com",
        "test-email-2@test.com"
    ]

    test('renders a div containing a list of emails', () => {
        render(<AccountEmailList 
            primary={ testPrimaryEmail } emails = { testEmails } />)

        expect(screen.getByTestId("account-email-list-container")).
            toBeInTheDocument()

        expect(screen.getByRole("list")).toBeInTheDocument()

        expect(screen.getAllByRole("listitem")).toHaveLength(3)
    })


    test('primary email marked as such, only one primary', () => {
        render(<AccountEmailList 
            primary={ testPrimaryEmail } emails = { testEmails } />)

        expect(screen.getAllByText(/primary/gi)).toHaveLength(1)
    })
})