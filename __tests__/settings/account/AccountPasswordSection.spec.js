import { render, screen } from '@testing-library/react'

import AccountPasswordSection from '../../../components/settings/account/AccountPasswordSection'

describe('AccountPasswordSection', () => {
    test('renders div containing header and reset password button', () => {
        render(<AccountPasswordSection />)
        expect(screen.getByTestId("account-password-section-container")).toBeInTheDocument()
        expect(screen.getByRole("heading")).toBeInTheDocument()
        expect(screen.getByRole("button")).toBeInTheDocument()
        expect(screen.getByText("Password")).toBeInTheDocument()
        expect(screen.getAllByText(/reset password/gi).length).toBeGreaterThan(0)
    })

    //test('button click causes reset password via email api call')
})