import { screen, render } from '@testing-library/react'

import EmailSetting from '../../../components/settings/notifications/EmailSetting'

describe('EmailSetting', () => {
    test('renders a div containing header w/ label text and slider', () => {
        const mockCb = jest.fn()
        render(<EmailSetting label="test-label" 
            status={ false }  handleChange={ mockCb } />)
        expect(screen.getByTestId("notifications-setting-container")).toBeInTheDocument()
        expect(screen.getByRole("heading")).toBeInTheDocument()
        expect(screen.getByText("test-label")).toBeInTheDocument()
        expect(screen.getByTestId("notifications-setting-toggler")).toBeInTheDocument()
    })
})