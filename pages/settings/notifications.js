import Layout from "../../components/layout/Layout";
import SettingsLayout from '../../components/layout/SettingsLayout'
import NotificationsMenu from '../../components/settings/notifications/NotificationsMenu'
import { useUser } from '../../lib/hooks'
import Loading from '../../components/lib/Loading'
import Head from 'next/head'

function Notifications() {
    const { loading: loadingUser, user } = useUser({ redirectTo: "/login" })

    if (loadingUser || !user.authenticated) return <Loading />
    return (
        <>
            <Head>
                <title>Notifications | disc</title>
            </Head>
            <NotificationsMenu />
        </>
    )
}

Notifications.getLayout = function getLayout(page) {
    return (
        <Layout pageName="Settings - Notifications">
            <SettingsLayout>
                { page }
            </SettingsLayout> 
        </Layout>
    )
}

export default Notifications