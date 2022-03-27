import Layout from '../components/layout/Layout'
import { useUser } from '../lib/hooks'
import Loading from '../components/lib/Loading'
import Head from 'next/head'

function Index() {
    const { loadingUserFromCache, user } = useUser({ redirectTo: "/login" })

    if (loadingUserFromCache || !user.authenticated) {
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
            Dashboard
        </>
    )
}

Index.getLayout = function getLayout(page) {
    return (
        <Layout>{ page }</Layout>
    )
}

export default Index