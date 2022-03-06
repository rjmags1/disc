import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AccountAddEmailInput from '../../../components/settings/account/AccountAddEmailInput'

const MAX_EMAIL_SUFFIX_LENGTH = 255
const MAX_EMAIL_PREFIX_LENGTH = 64

describe('AccountAddEmailInput', () => {
    const testEmails = ["test-email-0@test.com", "test-email-1@test.com", "test-email-2@test.com"]

    test('renders div containing input + button for adding new email', () => {
        render(<AccountAddEmailInput />)
        expect(screen.getByTestId("add-email-container")).toBeInTheDocument()
        expect(screen.getByRole("textbox")).toBeInTheDocument()
        expect(screen.getByRole("button")).toBeInTheDocument()
    })

    test('rejects previously registered emails w/ appropriate msg.', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb } />)
        userEvent.type(screen.getByLabelText(/add email address/gi), "test-email-0@test.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/previously registered email/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    test('reject @ in server name w/ appropriate msg.', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb } />)
        userEvent.type(screen.getByLabelText(/add email address/gi), "testuser@valid-subdom@in.@invalid-domain")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/typo/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    test('reject no @ in email', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb }/>)
        userEvent.type(screen.getByLabelText(/add email address/gi), "testuserattest-domain.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/typo/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    test('reject @@ in email', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb }/>)
        userEvent.type(screen.getByLabelText(/add email address/gi), "testuser@@test-domain.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/typo/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    test('reject empty email prefix', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb }/>)
        userEvent.type(screen.getByLabelText(/add email address/gi), "@t.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/typo/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    test('reject domain of < 2 characters', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb }/>)
        userEvent.type(screen.getByLabelText(/add email address/gi), "test@valid-subdomain.t")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/typo/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    test('reject excessive prefix length', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb }/>)
        userEvent.type(screen.getByLabelText(/add email address/gi), "prefix".repeat(Math.floor(MAX_EMAIL_PREFIX_LENGTH) / 6) + 1) + "@validSuffix.com"
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/typo/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    test('reject excessive suffix length', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb }/>)
        userEvent.type(screen.getByLabelText(/add email address/gi), "validPrefix@" + "suffix".repeat(Math.floor(MAX_EMAIL_SUFFIX_LENGTH / 6) + 1))
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
        expect(screen.getByText(/typo/gi)).toBeInTheDocument()
        expect(mockCb).not.toHaveBeenCalled()
    })

    //test('backend email register failure reflected in ui w/ appropriate msg')

    test('valid email add results in updateDisplayedEmails call + clears input', () => {
        const mockCb = jest.fn()
        render(<AccountAddEmailInput emails={ testEmails } updateDisplayedEmails={ mockCb }/>)
        userEvent.type(screen.getByLabelText(/add email address/gi), "test-email-3@test.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.queryByTestId("email-submit-failed-msg-container")).toBeNull()
        expect(mockCb).toHaveBeenCalled()
        expect(screen.getByLabelText(/add email address/gi)).toHaveValue("")
    })
})