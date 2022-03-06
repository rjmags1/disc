import { render, screen } from '@testing-library/react'

import NewAvatarButton from '../../../components/settings/account/NewAvatarButton'

describe('NewAvatarButton', () => {
    test('renders div containing file input', () => {
        render(<NewAvatarButton />)
        expect(screen.getByTestId("new-avatar-btn-container")).toBeInTheDocument()
        expect(screen.getByTestId("new-avatar-input")).toBeInTheDocument()
    })

    //test('on successful file upload handleNewSrc called', () => {
    //})

    //test('on failed upload handleNewSrc not called', () => {
    //})

    //test('on failed upload ui gives user feedback', () => {
    //})
})