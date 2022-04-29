import Navbar from './Navbar'

function Layout({ children, pageName }) {
    return (
        <>
            <Navbar pageName={ pageName } />
            <main>
                { children }
            </main>
        </>
    )
}

export default Layout