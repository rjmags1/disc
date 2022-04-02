import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AccountAddEmailInput from 
    '../../../components/settings/account/AccountAddEmailInput'

describe('AccountAddEmailInput', () => {
    const testEmails = [
        "test-email-0@test.com",
        "test-email-1@test.com",
        "test-email-2@test.com"
    ]

    test('renders div containing input + button for adding new email', () => {
        render(<AccountAddEmailInput />)

        expect(screen.getByTestId("add-email-container")).toBeInTheDocument()

        expect(screen.getByRole("textbox")).toBeInTheDocument()

        expect(screen.getByRole("button")).toBeInTheDocument()
    })


    test('rejects previously registered emails w/ appropriate msg.', () => {
        const mockCb = jest.fn()

        render(<AccountAddEmailInput 
            emails={ testEmails } updateDisplayedEmails={ mockCb } />)

        userEvent.type(screen.getByLabelText(/add email address/gi),
            "test-email-0@test.com")

        userEvent.click(screen.getByRole("button"))

        expect(screen.getByTestId("email-submit-failed-msg-container")).
            toBeInTheDocument()

        expect(screen.getByText(/unable to register email/gi)).
            toBeInTheDocument()

        expect(screen.getByText(/previously registered email/gi)).
            toBeInTheDocument()

        expect(mockCb).not.toHaveBeenCalled()
    })
})