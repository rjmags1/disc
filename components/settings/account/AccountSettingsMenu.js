import ProfileCard from './ProfileCard'
import AccountEmailSection from './AccountEmailSection'
import AccountPasswordSection from './AccountPasswordSection'

function AccountSettingsMenu() {
    return  (
        <div data-testid="account-menu-container"
            className="bg-zinc-900 text-white h-full p-6 flex-auto w-3/4
                overflow-auto">
            <ProfileCard />
            <AccountEmailSection />
            <AccountPasswordSection />
        </div>
    )
}

export default AccountSettingsMenu