import Image from 'next/image'
import NewAvatarButton from './NewAvatarButton'

function ProfileCardAvatar({ src, handleNewSrc }) {
    return (
        <div data-testid="profile-card-avatar-container"
            className="flex flex-col items-center justify-center">
            <Image src={ src } width="70" height="70"
                className="rounded-full"/>
            <NewAvatarButton handleNewSrc={ handleNewSrc }/>
        </div>
    )
}

export default ProfileCardAvatar