import ProfileCardAvatar from './ProfileCardAvatar'

function ProfileCard({ name, email, avatarSrc }) {
    return (
        <div data-testid="profile-card-container">
            <ProfileCardAvatar src={ avatarSrc } />
            <h2>{ name }</h2>
            <h4>{ email }</h4>
        </div>
    )
}

export default ProfileCard