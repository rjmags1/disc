import { render, screen } from '@testing-library/react'

import NewEmailSubmitFailedMessage from '../../../components/settings/account/NewEmailSubmitFailedMessage'

describe('NewEmailSubmitFailedMessage', () => {
    test('renders div w text indicating new email', () => {
        render(<NewEmailSubmitFailedMessage dueToInvalidEmail={ true }/>)
        expect(screen.getByTestId("email-submit-failed-msg-container")).toBeInTheDocument()
        expect(screen.getByText(/unable to register email/gi)).toBeInTheDocument()
    })

    test('message text indicates email invalid if is reason for failure', () => {
        render(<NewEmailSubmitFailedMessage dueToInvalidEmail={ true } />)
        expect(screen.getByText(/typos/gi)).toBeInTheDocument()
        expect(screen.getByText(/previously registered/gi)).toBeInTheDocument()
    })

    test('message tells user to check network if failure not due to bad email', () => {
        render(<NewEmailSubmitFailedMessage dueToInvalidEmail={ false } />)
        expect(screen.getByText(/check network connection/gi)).toBeInTheDocument()
    })
})