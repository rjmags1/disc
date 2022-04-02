import { render, screen } from '@testing-library/react'

import ImageFailedUploadMessage from
    '../../../components/settings/account/ImageFailedUploadMessage'

describe('failed upload message', () => {
    test('renders a div containing fail upload alert text', () => {
        render(<ImageFailedUploadMessage />)

        expect(screen.getByTestId("failed-upload-message-container")).
            toBeInTheDocument()

        expect(screen.getByText(/upload/gi)).toBeInTheDocument()

        expect(screen.getByText(/failed/gi)).toBeInTheDocument()
    })
})