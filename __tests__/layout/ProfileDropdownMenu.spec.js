import { render, screen } from '@testing-library/react'

import ProfileDropdownMenu from '../../components/layout/ProfileDropdownMenu'

describe('ProfileDropdownMenu', () => {
    test('renders a div containing settings and logout buttons', () => {
        render(<ProfileDropdownMenu />)
        expect(screen.getByTestId("profile-dropdown-container")).toBeInTheDocument()
        expect(screen.getAllByRole("button").length).toEqual(2)
        expect(screen.getByText("Settings")).toBeInTheDocument()
        expect(screen.getByText("Log out")).toBeInTheDocument()
    })
})