import OutsideClickHandler from 'react-outside-click-handler'
import { useState } from 'react'

import Image from 'next/image'
import DropdownMenu from './DropdownMenu'

function ProfileButton() {
    const [displayDropdown, setDisplayDropdown] = useState(false)

    return (
        <OutsideClickHandler onOutsideClick={ () => setDisplayDropdown(false) }>
            <div data-testid="profile-button-container" 
                className="hidden sm:flex flex-col items-center 
                    mx-1 hover:cursor-pointer"
                onClick={() => { setDisplayDropdown(!displayDropdown) }}>
                <Image src="/profile-button-img.png" height="25" 
                    width="25" layout="fixed" className="py-1 rounded-full"/>
                <Image src="/sort-down.png" height="10" width="10"
                    layout="fixed" data-testid="profile-button-arrow"
                    className={ displayDropdown ? "rotate-180" : "" }/>
                { displayDropdown && <DropdownMenu /> }
            </div>
        </OutsideClickHandler>
    )
}

export default ProfileButton