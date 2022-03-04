import { render, screen } from '@testing-library/react'

import FailedUploadMessage from '../../components/settings/FailedUploadMessage'

describe('failed upload message', () => {
    test('renders a div containing fail upload alert text', () => {
        render(<FailedUploadMessage />)
        expect(screen.getByTestId("failed-upload-message-container")).toBeInTheDocument()
        expect(screen.getByText(/upload/gi)).toBeInTheDocument()
        expect(screen.getByText(/failed/gi)).toBeInTheDocument()
    })
})