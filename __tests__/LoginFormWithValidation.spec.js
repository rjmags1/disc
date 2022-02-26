import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LoginFormWithValidation from '../components/LoginFormWithValidation'

const MAX_EMAIL_SUFFIX_LENGTH = 255
const MAX_EMAIL_PREFIX_LENGTH = 64
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 64

describe('LoginFormWithValidation', () => {
    test('initial render div containing login form w/o invalid message', () => {
        render(<LoginFormWithValidation />)
        expect(screen.getByTestId("login-form-val-container"))
        expect(screen.getByRole("form")).toBeInTheDocument()
        expect(screen.queryByTestId("invalid-message-container")).toBeNull()
    })

    test('reject @ in server name', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        userEvent.type(screen.getByLabelText("Email:"), "testuser@valid-subdom@in.@invalid-domain")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('reject no @ in email', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        userEvent.type(screen.getByLabelText("Email:"), "testuserattest-domain.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('reject @@ in email', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        userEvent.type(screen.getByLabelText("Email:"), "testuser@@test-domain.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('reject empty email prefix', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        userEvent.type(screen.getByLabelText("Email:"), "@t.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('reject domain of less than 2 characters', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        userEvent.type(screen.getByLabelText("Email:"), "test@valid-subdomain.t")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('reject excessive prefix length', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        const excessivePrefixEmail = "prefix".repeat(Math.floor(MAX_EMAIL_PREFIX_LENGTH / 6) + 1) + "@validSuffix.com"
        userEvent.type(screen.getByLabelText("Email:"), excessivePrefixEmail)
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('reject excessive suffix length', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        const excessiveSuffixEmail = "validPrefix@" + "suffix".repeat(Math.floor(MAX_EMAIL_SUFFIX_LENGTH / 6) + 1)
        userEvent.type(screen.getByLabelText("Email:"), excessiveSuffixEmail)
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('reject invalid password length', () => {
        const { unmount } = render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "t".repeat(MIN_PASSWORD_LENGTH - 1))
        userEvent.type(screen.getByLabelText("Email:"), "test-user@valid-email.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
        unmount()

        render(<LoginFormWithValidation />)
        expect(screen.queryByTestId("invalid-message-container")).toBeNull()
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "t".repeat(MAX_PASSWORD_LENGTH + 1))
        userEvent.type(screen.getByLabelText("Email:"), "test-user@valid-email.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })

    test('do not reject valid email and password', () => {
        render(<LoginFormWithValidation />)
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        userEvent.type(screen.getByLabelText("Email:"), "test-user@valid-email.com")
        userEvent.click(screen.getByRole("button"))
        expect(screen.queryByTestId("invalid-message-container")).toBeNull()
    })
})