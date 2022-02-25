import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Datalist from '../components/Datalist'

describe('Datalist', () => {
    const datalistInfo = {
        label: "test-label",
        datalistId: "test",
        inputId: "test",
        optionValues: ["Hogwarts", "Krusty Krab", "McDonalds"],
        containerTestId: "datalist-container-test",
        datalistTestId: "datalist-datalist-test"
    }

    test('renders a div containing label, input, datalist', () => {
        render(<Datalist info={ datalistInfo } />)
        expect(screen.getByTestId("datalist-container-test")).toBeInTheDocument()
        expect(screen.getByLabelText("test-label")).toBeInTheDocument()
        expect(screen.getByRole("combobox")).toBeRequired()
        expect(screen.getByTestId("datalist-datalist-test")).toBeInTheDocument()
    })

    test('renders all options and displays empty str on load', () => {
        render(<Datalist info={ datalistInfo } />)
        expect(screen.getByTestId("datalist-datalist-test").children.length).toEqual(3)
        expect(screen.getByRole("combobox")).toHaveValue("")
    })

    test('required input', () => {
        render(<Datalist info={ datalistInfo } />)
        expect(screen.getByRole("combobox")).toBeRequired()
    })

    test('handleChange callback on change', () => {
        const mockHandleChange = jest.fn()
        render(<Datalist info={ datalistInfo } handleChange={ mockHandleChange } />)
        userEvent.type(screen.getByRole("combobox"), "four")
        expect(mockHandleChange).toHaveBeenCalledTimes(4)
    })
})