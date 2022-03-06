import { render, screen } from '@testing-library/react'

import ProfileCardAvatar from '../../../components/settings/account/ProfileCardAvatar'

describe('ProfileCardAvatar', () => {
    test('renders div containing avatar and new pic button', () => {
        render(<ProfileCardAvatar src="/profile-button-image-png"/>)
        expect(screen.getByTestId("profile-card-avatar-container")).toBeInTheDocument()
        expect(screen.getByRole("img")).toBeInTheDocument()
        expect(screen.getByTestId("new-avatar-input")).toBeInTheDocument()
    })
})