import { render, screen } from "@testing-library/react"

import Login from "../../pages/login.js"

describe('Login', () => {
    test('renders div containing logo and LoginFormWithValidation', () => {
        render(<Login />)
        expect(screen.getByTestId("login-page-container")).toBeInTheDocument()
        expect(screen.getByTestId("login-form-val-container")).toBeInTheDocument()
        expect(screen.getByRole("img")).toBeInTheDocument()
    })

    test('login page does not render navbar', () => {
        render(<Login />)
        expect(screen.queryByRole("navigation")).toBeNull()
    })
})