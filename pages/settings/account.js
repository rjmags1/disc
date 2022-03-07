import Layout from "../../components/layout/Layout";
import SettingsLayout from '../../components/layout/SettingsLayout'
import AccountSettingsMenu from '../../components/settings/account/AccountSettingsMenu'

function Page() {
    return <AccountSettingsMenu />
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