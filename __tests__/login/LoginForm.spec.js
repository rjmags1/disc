import { render, screen } from '@testing-library/react'

import LoginForm from '../../components/login/LoginForm'

describe('LoginForm', () => {
    test('renders form w/ Datalist, 2 TextInputs, 1 submit btn, 1 email sign in button', () => {
        render(<LoginForm />)
        expect(screen.getByRole("form")).toBeInTheDocument()
        expect(screen.getByRole("form").children.length).toEqual(4)
        expect(screen.getByLabelText("Organization:")).toBeInTheDocument()
        expect(screen.getByLabelText("Email:")).toBeInTheDocument()
        expect(screen.getByLabelText("Password:")).toBeInTheDocument()
        expect(screen.getByText("Submit")).toBeInTheDocument()
        expect(screen.getByText(/email me login link/gi)).toBeInTheDocument()
    })
})