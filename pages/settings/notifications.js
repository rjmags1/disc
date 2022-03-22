import Layout from "../../components/layout/Layout";
import SettingsLayout from '../../components/layout/SettingsLayout'
import NotificationsMenu from '../../components/settings/notifications/NotificationsMenu'
import { useUser } from '../../lib/hooks'

function Notifications() {
    const { user } = useUser({ redirectTo: '/login' })

    return <NotificationsMenu />
}

Notifications.getLayout = function getLayout(page) {
    return (
        <Layout>
            <SettingsLayout>
                { page }
            </SettingsLayout> 
        </Layout>
    )
}

export default Notifications