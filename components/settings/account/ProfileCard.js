import ProfileCardAvatar from './ProfileCardAvatar'

function ProfileCard({ name, email, avatarSrc }) {
    return (
        <div data-testid="profile-card-container">
            <h2 className="text-2xl ml-4">Profile</h2>
            <div className="w-max">
                <div className="flex border-2 border-light-gray rounded-md
                    mt-3 p-4 pr-8">
                    <ProfileCardAvatar src={ avatarSrc } />
                    <div className="ml-8 flex flex-col justify-center">
                        <h3 className="text-xl my-1">{ name }</h3>
                        <h4 className="text-xs my-1">{ email }</h4>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default ProfileCard