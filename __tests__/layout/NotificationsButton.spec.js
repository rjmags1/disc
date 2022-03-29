import { render, screen } from '@testing-library/react'

import NotificationsButton from '../../components/layout/NotificationsButton'

describe('NotificationsButton', () => {
    test('renders div containing image button', () => {
        render(<NotificationsButton />)

        expect(screen.getByTestId("notifications-button-container")).
            toBeInTheDocument()

        expect(screen.getByRole("button")).  toBeInTheDocument()

        expect(screen.getByRole("button")).toHaveAttribute("type", "image")
    })
})