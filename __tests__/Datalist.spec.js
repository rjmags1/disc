import { render, screen } from '@testing-library/react'

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
        expect(screen.getByTestId("datalist-datalist-test")).toBeInTheDocument()
    })

    test('renders all options and displays empty str on load', () => {
        render(<Datalist info={ datalistInfo } />)
        expect(screen.getByTestId("datalist-datalist-test").)
    })

    test('required input', () => {
    })

    test('handleChange callback on change or option select;', () => {
    })
})