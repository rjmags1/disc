import Layout from "../../components/layout/Layout";
import SettingsLayout from '../../components/layout/SettingsLayout'
import NotificationsMenu from '../../components/settings/notifications/NotificationsMenu'

function Page() {
    return <NotificationsMenu />
}

Page.getLayout = function getLayout(page) {
    return (
        <Layout>
            <SettingsLayout>
                { page }
            </SettingsLayout> 
        </Layout>
    )
}

export default Page