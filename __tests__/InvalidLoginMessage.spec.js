import { render, screen } from '@testing-library/react'

import InvalidLoginMessage from '../components/InvalidLoginMessage'

describe('InvalidLoginMessage', () => {
    test('renders div with invalid login fields message', () => {
        render(<InvalidLoginMessage />)
        expect(screen.getByTestId("invalid-message-container")).toBeInTheDocument()
    })
})