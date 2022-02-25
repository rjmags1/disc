import { render, screen } from '@testing-library/react'

import Datalist from '../components/Datalist'

describe('Datalist', () => {
    const dlInfo = {
        label: "Organizations:",
        datalistId: "organizations",
        inputId: "organization",
        optionValues: ["Hogwarts", "Krusty Krab", "McDonalds"], // dummy
        labelTestId: "datalist-label-test",
        containerTestId: "datalist-container-test",
        datalistTestId: "datalist-datalist-test"
    }

    render(<Datalist info={ dlInfo } />)
    const datalist = screen.getByTestId("datalist-datalist-test")
    const container = screen.getByTestId("datalist-container-test")
    const label = screen.getByTestId("datalist-label-test")
    const input = screen.getByLabelText("Organizations:")

    test('renders a div containing label, input, datalist', () => {
        expect(container).toBeInTheDocument()
        expect(container.children.length).toEqual(3) // label, input, datalist
        expect(label).toBeInTheDocument()
        expect(input).toBeInTheDocument()
        expect(datalist).toBeInTheDocument()
    })

    test('datalist renders all options and displays empty str on load', () => {
        expect(datalist.children.length).toEqual(dlInfo.optionValues.length)
        expect(input.value).toEqual("")
    })
})