import { useState } from 'react'

import Image from 'next/image'
import NewAvatarButton from './NewAvatarButton'

function ProfileCardAvatar({ src }) {
    const [currSrc, setCurrSrc] = useState(src)

    return (
        <div data-testid="profile-card-avatar-container">
            <Image src={ currSrc } width="40" height="40"/>
            <NewAvatarButton handleNewSrc={ setCurrSrc }/>
        </div>
    )
}

export default ProfileCardAvatar