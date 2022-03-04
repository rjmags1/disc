import { render, screen } from '@testing-library/react'

import SettingsMenuButton from '../../components/settings/SettingsMenuButton'

describe('SettingsMenuButton', () => {
    test('renders div containing link', () => {
        render(<SettingsMenuButton label="test-label" href="test-href" />)
        expect(screen.getByTestId("settings-menu-button-container")).toBeInTheDocument()
        expect(screen.getByRole("link")).toBeInTheDocument()
    })
})