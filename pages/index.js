import Layout from '../components/layout/Layout'

function Page() {
    return <div>Dashboard</div>
}

Page.getLayout = function getLayout(page) {
    return (
        <Layout>{ page }</Layout>
    )
}

export default Page