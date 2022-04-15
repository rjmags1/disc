import ProfileCard from './ProfileCard'
import AccountEmailSection from './AccountEmailSection'
import AccountPasswordSection from './AccountPasswordSection'

function AccountSettingsMenu() {
    return  (
        <div data-testid="account-menu-container"
            className="bg-zinc-900 text-white h-full p-6 w-full 
                md:w-[calc(100%-15rem)] relative md:left-60">
            <ProfileCard />
            <AccountEmailSection />
            <AccountPasswordSection />
        </div>
    )
}

export default AccountSettingsMenu