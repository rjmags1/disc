import { render, screen } from '@testing-library/react'

import ProfileCard from '../../../components/settings/account/ProfileCard'

describe('ProfileCard', () => {
    test('renders a div containing prof. card. avatar and 2 headers', () => {
        render(<ProfileCard avatarSrc="/test-src" name="test-name" email="test-email"/>)
        expect(screen.getByTestId("profile-card-container")).toBeInTheDocument()
        expect(screen.getByTestId("profile-card-avatar-container")).toBeInTheDocument()
        expect(screen.getAllByRole("heading").length).toEqual(2)
    })

    test('renders passed name, email', () => {
        render(<ProfileCard avatarSrc="/test-src" name="test-name" email="test-email"/>)
        expect(screen.getByText("test-name")).toBeInTheDocument()
        expect(screen.getByText("test-email")).toBeInTheDocument()
    })
})