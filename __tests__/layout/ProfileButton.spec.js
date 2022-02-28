import { render, screen } from '@testing-library/react'

import ProfileButton from '../../components/layout/ProfileButton'

describe('ProfileButton', () => {
    test('renders div containing image button', () => {
        render(<ProfileButton />)
        expect(screen.getByTestId("profile-button-container")).toBeInTheDocument()
        expect(screen.getByRole("button")).toBeInTheDocument()
        expect(screen.getByRole("button")).toHaveAttribute("type", "image")
    })
})