import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LoginDatalist from '../../components/login/LoginDatalist'

describe('LoginDatalist', () => {
    const label = "test-label"
    const optionValues = ["Hogwarts", "Krusty Krab", "McDonalds"]

    test('renders a div containing label, input, datalist', () => {
        render(<LoginDatalist 
            label={ label } optionValues={ optionValues } />)

        expect(screen.getByTestId("datalist-container-test")).
            toBeInTheDocument()

        expect(screen.getByLabelText("test-label")).toBeInTheDocument()
        
        expect(screen.getByTestId("datalist-datalist-test")).
            toBeInTheDocument()
    })


    test('datalist should be required', () => {
        render(<LoginDatalist 
            label={ label } optionValues={ optionValues } />)

        expect(screen.getByRole("combobox")).toBeRequired()
    })


    test('renders all options and displays empty str on load', () => {
        render(<LoginDatalist
            label={ label } optionValues={ optionValues } />)

        expect(screen.getByTestId("datalist-datalist-test").
            children.length).toEqual(3)

        expect(screen.getByRole("combobox")).toHaveValue("")
    })


    test('handleChange callback on change', () => {
        const mockHandleChange = jest.fn()

        render(<LoginDatalist label={ label } 
            handleChange={ mockHandleChange }  
            optionValues={ optionValues } />)

        userEvent.type(screen.getByRole("combobox"), "four")

        expect(mockHandleChange).toHaveBeenCalledTimes(4)
    })
})