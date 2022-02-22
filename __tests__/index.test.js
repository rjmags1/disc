import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import Homepage from '../pages/index'

describe('Homepage', () => {
    it('renders a div', () => {
        render(<Homepage/>)

        expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
})
