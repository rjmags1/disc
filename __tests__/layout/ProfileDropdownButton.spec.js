import { render, screen } from '@testing-library/react'

import DropdownButton from
    '../../components/layout/DropdownButton'

describe('profile dropdown button', () => {
    test('renders a div containing a button with passed text', () => {
        render(<DropdownButton label="test-label" />)

        expect(screen.getByTestId("dropdown-button-container")).
            toBeInTheDocument()

        expect(screen.getByRole("button")).toBeInTheDocument()

        expect(screen.getByText("test-label")).toBeInTheDocument()
    })


    test('if last, has rounded-b-md, (rounded bottom border)', () => {
        render(<DropdownButton last={ true } />)

        expect(screen.getByTestId("dropdown-button-container").
            className).toMatch(/rounded-b/i)
    })
})