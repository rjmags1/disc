import { render, screen } from '@testing-library/react'

import PageHeader from '../../components/layout/PageHeader'

describe('PageHeader', () => {
    test('renders div containing header', () => {
        render(<PageHeader />)

        expect(screen.getByTestId("page-header-container")).
            toBeInTheDocument()

        expect(screen.getByRole("heading")).toBeInTheDocument()
    })


    test('header text denotes passed page name', () => {
        render(<PageHeader pageName={"dummy-page-name"} />)
        
        expect(screen.getByText("dummy-page-name")).toBeInTheDocument()
    })
})