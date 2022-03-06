import { useState } from 'react'

import Image from 'next/image'
import NewAvatarButton from './NewAvatarButton'

function ProfileCardAvatar({ src, handleNewSrc }) {
    return (
        <div data-testid="profile-card-avatar-container">
            <Image src={ src } width="40" height="40"/>
            <NewAvatarButton handleNewSrc={ handleNewSrc }/>
        </div>
    )
}

export default ProfileCardAvatar