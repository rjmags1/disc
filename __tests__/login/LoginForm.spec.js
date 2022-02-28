import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LoginForm from '../../components/login/LoginForm'

describe('LoginForm', () => {
    test('renders form w/ Datalist, 2 TextInputs, 1 submit btn', () => {
        render(<LoginForm />)
        expect(screen.getByRole("form")).toBeInTheDocument()
        expect(screen.getByRole("form").children.length).toEqual(4)
        expect(screen.getByLabelText("Organization:")).toBeInTheDocument()
        expect(screen.getByLabelText("Email:")).toBeInTheDocument()
        expect(screen.getByLabelText("Password:")).toBeInTheDocument()
        expect(screen.getByRole("button")).toBeInTheDocument()
    })

    test('submit button only works when all fields filled', () => {
        const mockValidateCallback = jest.fn()
        render(<LoginForm validate={ mockValidateCallback } />)
        userEvent.click(screen.getByRole("button"))
        expect(mockValidateCallback).not.toHaveBeenCalled()
        userEvent.type(screen.getByLabelText("Organization:"), "test-org")
        userEvent.type(screen.getByLabelText("Email:"), "test-email")
        userEvent.type(screen.getByLabelText("Password:"), "test-password")
        userEvent.click(screen.getByRole("button"))
        expect(mockValidateCallback).toHaveBeenCalled()
    })

    // TODO: implement LoginValidator
    //test('invalid fields rejected + appropriate ui feedback', () => {
    //})

    // TODO: implement dashboard page
    //test('valid fields redirect user to dashboard', () => {
    // })
})