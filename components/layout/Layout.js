import Navbar from './Navbar'

function Layout({ children, pageName }) {
    console.log(pageName)
    return (
        <>
            <Navbar pageName={ pageName }/>
            <main >{ children }</main>
        </>
    )
}

export default Layout