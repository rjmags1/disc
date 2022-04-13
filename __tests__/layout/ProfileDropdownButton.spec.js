import { render, screen } from '@testing-library/react'

import ProfileDropdownButton from
    '../../components/layout/ProfileDropdownButton'

describe('profile dropdown button', () => {
    test('renders a div containing a button with passed text', () => {
        render(<ProfileDropdownButton label="test-label" />)

        expect(screen.getByTestId("profile-dropdown-button-container")).
            toBeInTheDocument()

        expect(screen.getByRole("button")).toBeInTheDocument()

        expect(screen.getByText("test-label")).toBeInTheDocument()
    })


    test('if last, has rounded-b-md, (rounded bottom border)', () => {
        render(<ProfileDropdownButton last={ true } />)

        expect(screen.getByTestId("profile-dropdown-button-container").
            className).toMatch(/rounded-b/i)
    })
})