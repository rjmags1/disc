import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ProfileButton from '../../components/layout/ProfileButton'

describe('ProfileButton', () => {
    test('renders div containing profile image and dropdown arrow', () => {
        render(<ProfileButton />)
        expect(screen.getByTestId("profile-button-container")).toBeInTheDocument()
        expect(screen.getAllByRole("img").length).toEqual(2)
    })
    
    test('on click dropdown menu appears and arrow flips', () => {
        render(<ProfileButton />)
        expect(screen.queryByTestId("profile-dropdown-container")).toBeNull()
        expect(screen.getByTestId("profile-button-arrow").className).toEqual("")
        userEvent.click(screen.getByTestId("profile-button-container"))
        expect(screen.getByTestId("profile-dropdown-container")).toBeInTheDocument()
        expect(screen.getByTestId("profile-button-arrow").className).toMatch(/rotate-180/g)
        userEvent.click(screen.getByTestId("profile-button-container"))
    })

    test('if dropdown showing, another click on button removes dropdown', () => {
        render(<ProfileButton />)
        userEvent.click(screen.getByTestId("profile-button-container"))
        expect(screen.getByTestId("profile-dropdown-container")).toBeInTheDocument()
        userEvent.click(screen.getByTestId("profile-button-container"))
        expect(screen.queryByTestId("profile-dropdown-container")).toBeNull()
    })

    test('if dropdown showing, click outside removes dropdown', () => {
    })
})