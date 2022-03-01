import React from 'react'

import '../styles/globals.css'
import Layout from '../components/layout/Layout'

function MyApp({ Component, pageProps, ...appProps }) {
    const pageName = Component.name
    const renderWithLayout = !appProps.router.pathname.match(/login/g)
    const LayoutComponent = renderWithLayout ? Layout : React.Fragment
    return (
        <LayoutComponent pageName={ pageName }>
            <Component {...pageProps} />
        </LayoutComponent>
    )
}

export default MyApp