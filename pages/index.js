import Layout from '../components/layout/Layout'
import { useUser } from '../lib/hooks'

function Index() {
    const { user } = useUser({ redirectTo: '/login' })

    return <div>Dashboard</div>
}

Index.getLayout = function getLayout(page) {
    return (
        <Layout>{ page }</Layout>
    )
}

export default Index