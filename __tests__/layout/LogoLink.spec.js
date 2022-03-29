import { render, screen } from '@testing-library/react'

import LogoLink from '../../components/layout/LogoLink'

describe('LogoLink', () => {
    test('renders a div containing anchor with text disc', () => {
        render(<LogoLink />)

        expect(screen.getByTestId("logo-link-container")).toBeInTheDocument()
        
        expect(screen.getByText("disc")).toBeInTheDocument()
    })

    
    test('link href points to index (dashboard)', () => {
        render(<LogoLink />)

        expect(screen.getByRole("link")).toHaveAttribute("href", "/")
    })
})