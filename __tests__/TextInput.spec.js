import { render, screen } from '@testing-library/react'

import TextInput from '../components/TextInput'

describe('TextInput', () => {
    const textInputInfo = {
        label: "test-label",
        placeholderText: "test",
        inputId: "test-id",
        required: false,
        labelTestId: "text-input-label-test",
        containerTestId: "text-input-container-test",
    }

    render(<TextInput info={ textInputInfo }/>)
    const container = screen.getByTestId("text-input-container-test")
    const label = screen.getByTestId("text-input-label-test")
    const input = screen.getByLabelText("test-label")

    test('renders a div containing label and text input', () => {
        expect(container).toBeInTheDocument()
        expect(container.children.length).toEqual(2) // label, input
        expect(label).toBeInTheDocument()
        expect(input).toBeInTheDocument()
    })

    test('input renders with default text', () => {
        expect(input.placeholder).toEqual("test")
    })

    test('input is required', () => {
        expect(input.required).toEqual(textInputInfo.required)
    })
})