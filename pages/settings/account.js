import Layout from "../../components/layout/Layout";
import SettingsLayout from '../../components/layout/SettingsLayout'
import AccountSettingsMenu from '../../components/settings/account/AccountSettingsMenu'
import { useUser } from '../../lib/hooks'

function Account() {
    const { user } = useUser({ redirectTo: '/login' })

    return <AccountSettingsMenu />
}

Account.getLayout = function getLayout(page) {
    return (
        <Layout>
            <SettingsLayout>
                { page }
            </SettingsLayout>
        </Layout>
    )
}

export default Account