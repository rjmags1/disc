import { useState, useEffect } from 'react'

import ProfileCard from './ProfileCard'
import AccountEmailSection from './AccountEmailSection'
import AccountPasswordSection from './AccountPasswordSection'

function AccountSettingsMenu() {
    const [emails, setEmails] = useState([])
    const [primaryEmail, setPrimaryEmail] = useState("")
    const [avatarSrc, setAvatarSrc] = useState("/profile-button-img.png")

    let name
    useEffect(() => {
        // client side (useEffect) fetch user account settings
        // then rel. setState calls in useEffect after fetch
        // dummy for now
        name = "dummy-name"
        //setAvatarSrc("/dummy-src")
        setPrimaryEmail("dummy-email-0")
        setEmails(["dummy-email-0", "dummy-email-1", "dummy-email-2"])
    }, [])

    const showNewEmail = function(newEmail) {
        setEmails(oldEmails => [...oldEmails, newEmail])
    }

    return  (
        <div data-testid="account-menu-container"
            className="flex-auto min-w-fit">
            <ProfileCard name={ name } email={ primaryEmail } avatarSrc={ avatarSrc } handleNewSrc={ setAvatarSrc }/>
            <AccountEmailSection primary={ primaryEmail } emails={ emails } updateDisplayedEmails={ showNewEmail } />
            <AccountPasswordSection />
        </div>
    )
}

export default AccountSettingsMenu