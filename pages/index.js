import Navbar from "../components/layout/Navbar"

function Dashboard() {
    return <div>Dashboard</div>
}

Page.getLayout = function getLayout(page) {
    return <Navbar>{ page }</Navbar>
}

export default Dashboard