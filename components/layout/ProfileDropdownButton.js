function ProfileDropdownButton({ label }) {
    return (
        <div data-testid="profile-dropdown-button-container"
            className="p-1">
            <button>{ label }</button>
        </div>
    )
}

export default ProfileDropdownButton