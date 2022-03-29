import ProfileDropdownButton from './ProfileDropdownButton'

function ProfileDropdownMenu() {
    return (
        <div data-testid="profile-dropdown-container"
            className="fixed w-fit bg-purple text-white top-9 
                sm:top-12 rounded-b-md border-black right-0">
            <ProfileDropdownButton label="Settings" href="/settings/account"/>
            <ProfileDropdownButton label="Log out" last={ true } 
                href="/logout"/>
        </div>
    )
}

export default ProfileDropdownMenu