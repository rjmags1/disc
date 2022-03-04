import { render, screen } from '@testing-library/react'

import SettingsMenuPane from '../../components/settings/SettingsMenuPane'

describe('SettingsMenuPane', () => {
    test('renders div containing acct. and notif. links', () => {
        render(<SettingsMenuPane />)
        expect(screen.getByTestId("settings-menu-pane-container")).toBeInTheDocument()
        expect(screen.getAllByRole("link").length).toEqual(2)
        expect(screen.getByText("Account")).toBeInTheDocument()
        expect(screen.getByText("Notifications")).toBeInTheDocument()
    })
})