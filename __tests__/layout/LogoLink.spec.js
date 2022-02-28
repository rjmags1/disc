import { render, screen } from '@testing-library/react'

import LogoLink from '../../components/layout/LogoLink'

describe('LogoLink', () => {
    test('renders a div containing img wrapped in anchor', () => {
        render(<LogoLink />)
        expect(screen.getByTestId("logo-link-container")).toBeInTheDocument()
        expect(screen.getByRole("link")).toBeInTheDocument()
        expect(screen.getByRole("img")).toBeInTheDocument()
    })

    test('links to homepage', () => {
        render(<LogoLink />)
        expect(screen.getByRole("link")).toHaveAttribute("href", "/")
    })
})