import Layout from '../components/layout/Layout'
import { useUser } from '../lib/hooks'
import Loading from '../components/lib/Loading'
import Head from 'next/head'
import Dashboard from '../components/dashboard/Dashboard'

function Index() {
    const { loading: loadingUser, user } = useUser({ redirectTo: "/login" })

    if (loadingUser || !user.authenticated) {
        return (
            <>
                <Head>
                    <title>Dashboard | disc</title>
                </Head>
                <Loading />
            </>
        )
    }

    return (
        <>
            <Head>
                <title>Dashboard | disc</title>
            </Head>
            <Dashboard />
        </>
    )
}

Index.getLayout = function getLayout(page) {
    return (
        <Layout pageName="Dashboard">{ page }</Layout>
    )
}

export default Index