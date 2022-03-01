function ProfileButton() {
    return (
        <div data-testid="profile-button-container" className="p-1 sm:p-3">
            <input type="image" src="/profile-button-img.png" 
                className="rounded-full" width="30" height="30"/>
        </div>
    )
}

export default ProfileButton