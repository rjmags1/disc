import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SettingToggler from '../../../components/settings/notifications/SettingToggler'

describe('SettingToggler', () => {
    test('renders div containing setting toggler', () => {
        const mockCb = jest.fn()
        render(<SettingToggler isOn={ false } handleClick={ mockCb } />)
        expect(screen.getByTestId("notifications-setting-toggler")).toBeInTheDocument()
        expect(screen.getByRole("button")).toBeInTheDocument()
    })

    test('render isOn status, callback on click', () => {
        const mockCb = jest.fn()
        render(<SettingToggler isOn={ false } handleClick={ mockCb } />)
        expect(screen.getByText(/enable/gi)).toBeInTheDocument()
        userEvent.click(screen.getByRole("button"))
        expect(mockCb).toHaveBeenCalled()
    })
})