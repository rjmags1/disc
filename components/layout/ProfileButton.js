import OutsideClickHandler from 'react-outside-click-handler'
import { useState } from 'react'

import Image from 'next/image'
import ProfileDropdownMenu from './ProfileDropdownMenu'

function ProfileButton() {
    const [displayDropdown, setDisplayDropdown] = useState(false)

    return (
        <OutsideClickHandler onOutsideClick={ () => setDisplayDropdown(false) }>
            <div data-testid="profile-button-container" 
                className="px-1 sm:p-3 flex flex-col items-center"
                onClick={() => { setDisplayDropdown(!displayDropdown) }}>
                <Image src="/profile-button-img.png" height="25" width="25" layout="fixed"
                    className="py-1 rounded-full"/>
                <Image src="/sort-down.png" height="10" width="10" layout="fixed"
                    data-testid="profile-button-arrow"
                    className={ displayDropdown ? "rotate-180" : "" }/>
                { displayDropdown && <ProfileDropdownMenu /> }
            </div>
        </OutsideClickHandler>
    )
}

export default ProfileButton