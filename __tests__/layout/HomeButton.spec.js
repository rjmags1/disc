import { render, screen } from '@testing-library/react'

import HomeButton from '../../components/layout/HomeButton'

describe('HomeButton', () => {
    test('renders div containing image wrapped in anchor', () => {
        render(<HomeButton />)
        expect(screen.getByTestId("home-button-container")).toBeInTheDocument()
        expect(screen.getByRole("img")).toBeInTheDocument()
        expect(screen.getByRole("link")).toBeInTheDocument()
    })

    test('links to homepage', () => {
        render(<HomeButton />)
        expect(screen.getByRole("link")).toHaveAttribute("href", "/")
    })
})