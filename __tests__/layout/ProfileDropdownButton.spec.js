import { render, screen } from '@testing-library/react'

import ProfileDropdownButton from '../../components/layout/ProfileDropdownButton'

describe('profile dropdown button', () => {
    test('renders a div containing a button with passed text', () => {
        render(<ProfileDropdownButton label="test-label" />)
        expect(screen.getByTestId("profile-dropdown-button-container")).toBeInTheDocument()
        expect(screen.getByRole("button")).toBeInTheDocument()
        expect(screen.getByText("test-label")).toBeInTheDocument()
    })
})