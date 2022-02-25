import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TextInput from '../components/TextInput'

describe('TextInput', () => {
    const textInputInfo = {
        label: "test-label",
        inputId: "test-id",
        containerTestId: "text-input-container-test",
    }

    test('renders a div containing label and text input', () => {
        render(<TextInput info={ textInputInfo }/>)
        expect(screen.getByLabelText("test-label")).toBeInTheDocument()
        expect(screen.getByRole("textbox")).toBeInTheDocument()
        expect(screen.getByTestId("text-input-container-test").children.length).toEqual(2)
    })

    test('input renders with empty string default value', () => {
        render(<TextInput info={ textInputInfo }/>)
        expect(screen.getByRole("textbox")).toHaveValue("")
    })

    test('input is required', () => {
        render(<TextInput info={ textInputInfo }/>)
        expect(screen.getByLabelText("test-label")).toBeRequired()
    })

    test('handleChange callback on change', () => {
        const mockCallback = jest.fn()
        render(<TextInput info={ textInputInfo } handleChange={ mockCallback }/>)
        userEvent.type(screen.getByRole("textbox"), "four")
        expect(mockCallback).toHaveBeenCalledTimes(4)
    })
})