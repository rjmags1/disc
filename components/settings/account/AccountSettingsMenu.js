import { useUser } from '../../../lib/hooks'

import ProfileCard from './ProfileCard'
import AccountEmailSection from './AccountEmailSection'
import AccountPasswordSection from './AccountPasswordSection'

function AccountSettingsMenu() {
    const { user } = useUser()
    const {
        f_name: firstName,
        l_name: lastName,
        primary_email: primaryEmail,
        avatar_url: avatarUrl
    } = user
    const fullName = `${ firstName } ${ lastName }`

    return  (
        <div data-testid="account-menu-container"
            className="bg-zinc-900 text-white h-full p-6 flex-auto w-3/4
                overflow-auto">
            <ProfileCard name={ fullName } email={ primaryEmail }
                avatarSrc={ avatarUrl } />
            <AccountEmailSection />
            <AccountPasswordSection />
        </div>
    )
}

export default AccountSettingsMenu