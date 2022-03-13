import ProfileDropdownButton from './ProfileDropdownButton'

function ProfileDropdownMenu() {
    return (
        <div data-testid="profile-dropdown-container"
            className="fixed max-w-xs bg-purple text-white top-9 
                sm:top-12 rounded-b-md border-black z-10">
            <ProfileDropdownButton label="Settings" />
            <ProfileDropdownButton label="Log out" last={ true }/>
        </div>
    )
}

export default ProfileDropdownMenu