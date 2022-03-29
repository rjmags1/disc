import Layout from "../../components/layout/Layout";
import SettingsLayout from '../../components/layout/SettingsLayout'
import AccountSettingsMenu from '../../components/settings/account/AccountSettingsMenu'
import { useUser } from '../../lib/hooks'
import Loading from '../../components/lib/Loading'
import Head from 'next/head'

function Account() {
    const { loadingUserFromCache, user } = useUser({ redirectTo: "/login" })

    if (loadingUserFromCache || !user.authenticated) return <Loading />

    return (
        <>
            <Head>
                <title>Account | disc</title>
            </Head>
            <AccountSettingsMenu />
        </>
        
    )
}

Account.getLayout = function getLayout(page) {
    return (
        <Layout pageName="Settings - Account">
            <SettingsLayout>
                { page }
            </SettingsLayout>
        </Layout>
    )
}

export default Account