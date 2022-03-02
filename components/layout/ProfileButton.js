import { useState } from 'react'

import Image from 'next/image'
import ProfileDropdownMenu from './ProfileDropdownMenu'

function ProfileButton() {
    const [clicked, setClicked] = useState(false)

    return (
        <div data-testid="profile-button-container" 
            className="px-1 sm:p-3 flex flex-col items-center"
            onClick={() => { setClicked(!clicked)}}>
            <Image src="/profile-button-img.png" height="25" width="25"
                className="py-1 rounded-full"/>
            <Image src="/sort-down.png" height="10" width="10"
                data-testid="profile-button-arrow"
                className={ clicked ? "rotate-180" : "" }/>
            { clicked && <ProfileDropdownMenu /> }
        </div>
    )
}

export default ProfileButton