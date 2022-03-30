import { render, screen } from '@testing-library/react'

import LoginForm from '../../components/login/LoginForm'

describe('LoginForm', () => {
    test(`renders div containing:
        form w/ Datalist, 2 TextInputs, 1 submit btn;
        1 email sign in button`, () => {
        render(<LoginForm />)

        expect(screen.getByTestId("login-form-container")).toBeInTheDocument()

        expect(screen.getByRole("form")).toBeInTheDocument()

        expect(screen.getByRole("form").children.length).toEqual(4)

        expect(screen.getByLabelText("Organization:")).toBeInTheDocument()

        expect(screen.getByLabelText("Email:")).toBeInTheDocument()

        expect(screen.getByLabelText("Password:")).toBeInTheDocument()

        expect(screen.getByText("Submit")).toBeInTheDocument()

        expect(screen.getByText(/email me login link/gi)).toBeInTheDocument()
    })


    test('initial render doesnt have invalid message', () => {
        render(<LoginForm />)

        expect(screen.queryByText(/invalid/gi)).toBeNull()
    })
})