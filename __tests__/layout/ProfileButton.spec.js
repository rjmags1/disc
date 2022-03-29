import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ProfileButton from '../../components/layout/ProfileButton'
import Navbar from '../../components/layout/Navbar'

describe('ProfileButton', () => {
    test('renders div containing profile img and dropdown arrow img', () => {
        render(<ProfileButton />)

        expect(screen.getByTestId("profile-button-container")).
            toBeInTheDocument()

        expect(screen.getAllByRole("img").length).toEqual(2)
    })
    

    test(`if dropdown not showing, click on prof button causes
            dropdown to show and arrow to rotate`, () => {
        render(<ProfileButton />)

        expect(screen.queryByTestId("profile-dropdown-container")).toBeNull()

        expect(screen.getByTestId("profile-button-arrow").className).
            not.toMatch(/rotate-180/g)

        userEvent.click(screen.getByTestId("profile-button-container"))

        expect(screen.getByTestId("profile-dropdown-container")).
            toBeInTheDocument()

        expect(screen.getByTestId("profile-button-arrow").className).
            toMatch(/rotate-180/g)
    })


    test(`if dropdown showing, click on prof button removes
            dropdown and makes arrow unrotate`, () => {
        render(<ProfileButton />)

        userEvent.click(screen.getByTestId("profile-button-container"))

        expect(screen.getByTestId("profile-dropdown-container")).
            toBeInTheDocument()

        expect(screen.getByTestId("profile-button-arrow").className).
            toMatch(/rotate-180/g)

        userEvent.click(screen.getByTestId("profile-button-container"))

        expect(screen.queryByTestId("profile-dropdown-container")).toBeNull()

        expect(screen.getByTestId("profile-button-arrow").className).
            not.toMatch(/rotate-180/g)
    })


    test(`if dropdown showing, click outside or click on
        prof btn removes dropdown`, () => {
        render(<Navbar />)

        userEvent.click(screen.getByTestId("profile-button-container"))

        expect(screen.getByTestId("profile-dropdown-container")).
            toBeInTheDocument()

        userEvent.click(screen.getByTestId("logo-link-container"))

        expect(screen.queryByTestId("profile-dropdown-container")).toBeNull()

        userEvent.click(screen.getByTestId("profile-button-container"))

        expect(screen.queryByTestId("profile-dropdown-container")).
            toBeInTheDocument()

        userEvent.click(screen.getByTestId("profile-button-container"))

        expect(screen.queryByTestId("profile-dropdown-container")).toBeNull()
    })
})