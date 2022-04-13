import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import NotificationsMenu from 
    '../../../components/settings/notifications/NotificationsMenu'

describe('NotificationsMenu', () => {
    test('renders div containing header, email settings, save button', () => {
        render(<NotificationsMenu />)

        expect(screen.getByTestId("notifications-menu-container")).
            toBeInTheDocument()

        expect(screen.getAllByRole("heading").length).toBeGreaterThan(0)

        expect(screen.getByText(/manage notifications/i)).
            toBeInTheDocument()

        expect(screen.getAllByTestId("notifications-setting-container")
            .length).toBeGreaterThan(0)

        expect(screen.getAllByRole("button").length).toBeGreaterThan(0)

        expect(screen.getByText(/save/i)).toBeInTheDocument()
    })


    test('toggle setting causes flipping of toggler label', () => {
        render(<NotificationsMenu />)

        const originalSettingButtonLabel = screen.
            getAllByRole("button")[0].textContent

        userEvent.click(screen.getAllByRole("button")[0])

        const newSettingButtonLabel = screen.getAllByRole("button")[0]

        expect(newSettingButtonLabel).not.toEqual(originalSettingButtonLabel)
    })
})