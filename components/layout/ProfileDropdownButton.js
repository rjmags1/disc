function ProfileDropdownButton({ label, last }) {
    const baseStyles = "p-1 hover:bg-violet-500"
    const styles = last ? baseStyles + " rounded-b-md" : baseStyles
    return (
        <div data-testid="profile-dropdown-button-container"
            className={ styles }>
            <button>{ label }</button>
        </div>
    )
}

export default ProfileDropdownButton