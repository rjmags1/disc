import { render, screen } from "@testing-library/react"

import Navbar from "../../components/layout/Navbar"

describe('Navbar', () => {
    test('renders nav containing logo, page title, home btn, notif. btn, prof. btn', () => {
        render(<Navbar />)
        expect(screen.getByRole("navigation")).toBeInTheDocument()
        expect(screen.getByRole("heading")).toBeInTheDocument()
        expect(screen.getByTestId("profile-button-container")).toBeInTheDocument()
        expect(screen.getByTestId("notifications-button-container")).toBeInTheDocument()
        expect(screen.getByTestId("logo-link-container")).toBeInTheDocument()
        expect(screen.getByTestId("home-button-container")).toBeInTheDocument()
        screen.debug()
    })
})