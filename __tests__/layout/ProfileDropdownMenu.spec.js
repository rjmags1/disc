import { render, screen } from '@testing-library/react'

import DropdownMenu from '../../components/layout/DropdownMenu'

describe('DropdownMenu', () => {
    test('renders a div containing settings and logout buttons', () => {
        render(<DropdownMenu />)

        expect(screen.getByTestId("dropdown-container")).
            toBeInTheDocument()

        expect(screen.getAllByRole("button").length).toEqual(2)

        expect(screen.getByText("Settings")).toBeInTheDocument()
        
        expect(screen.getByText("Log out")).toBeInTheDocument()
    })
})