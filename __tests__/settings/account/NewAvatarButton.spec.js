import { render, screen } from '@testing-library/react'

import NewAvatarButton from 
    '../../../components/settings/account/NewAvatarButton'

describe('NewAvatarButton', () => {
    test('renders div containing file input', () => {
        render(<NewAvatarButton />)

        expect(screen.getByTestId("new-avatar-btn-container")).
            toBeInTheDocument()

        expect(screen.getByTestId("new-avatar-input")).toBeInTheDocument()
    })
})