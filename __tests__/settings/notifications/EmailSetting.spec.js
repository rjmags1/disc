import { screen, render } from '@testing-library/react'

import EmailSetting from 
    '../../../components/settings/notifications/EmailSetting'

describe('EmailSetting', () => {
    test('renders a div containing header w/ label text and toggler', () => {
        render(<EmailSetting label="test-label" status={ false } />)

        expect(screen.getByTestId("notifications-setting-container")).
            toBeInTheDocument()

        expect(screen.getByRole("heading")).toBeInTheDocument()

        expect(screen.getByText(/test-label/gi)).toBeInTheDocument()

        expect(screen.getByTestId("notifications-setting-toggler")).
            toBeInTheDocument()
    })
})