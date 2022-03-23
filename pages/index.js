import Layout from '../components/layout/Layout'
import { useUser } from '../lib/hooks'
import Loading from '../components/lib/Loading'

function Index() {
    const { loadingUserFromCache, user } = useUser({ redirectTo: "/login" })

    if (loadingUserFromCache || !user.authenticated) return <Loading />
    return <div>Dashboard</div>
}

Index.getLayout = function getLayout(page) {
    return (
        <Layout>{ page }</Layout>
    )
}

export default Index