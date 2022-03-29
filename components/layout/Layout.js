import Navbar from './Navbar'

function Layout({ children, pageName }) {
    return (
        <>
            <Navbar pageName={ pageName } />
            <div className="h-9 sm:h-12"></div>
            <main className="h-full top-9">{ children }</main>
        </>
    )
}

export default Layout