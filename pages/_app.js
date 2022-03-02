import React from 'react'

import '../styles/globals.css'
import Layout from '../components/layout/Layout'

function MyApp({ Component, pageProps, ...appProps }) {
    const pageName = Component.name
    const renderWithLayout = !appProps.router.pathname.match(/login/g)
    return renderWithLayout ? (
        <Layout pageName={ pageName } >
            <Component {...pageProps} />
        </Layout>
    ) :
    ( <Component {...pageProps} /> )
}

export default MyApp