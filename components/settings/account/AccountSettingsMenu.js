import { useState, useEffect } from 'react'

import ProfileCard from './ProfileCard'
import AccountEmailSection from './AccountEmailSection'
import AccountPasswordSection from './AccountPasswordSection'

function AccountSettingsMenu() {
    const [name, setName] = useState("")
    const [emails, setEmails] = useState([])
    const [primaryEmail, setPrimaryEmail] = useState("")
    const [avatarSrc, setAvatarSrc] = useState("/profile-button-img.png")

    useEffect(() => {
        // client side (useEffect) fetch user account settings
        // then rel. setState calls in useEffect after fetch
        // dummy for now
        //setAvatarSrc("/dummy-src")
        setName("dummy-name")
        setPrimaryEmail("dummy-email-0")
        setEmails(["dummy-email-0", "dummy-email-1", "dummy-email-2"])
    }, [])

    const showNewEmail = function(newEmail) {
        setEmails(oldEmails => [...oldEmails, newEmail])
    }

    return  (
        <div data-testid="account-menu-container"
            className="bg-zinc-900 text-white h-full p-6 flex-auto w-3/4">
            <ProfileCard name={ name } email={ primaryEmail }
                avatarSrc={ avatarSrc } handleNewSrc={ setAvatarSrc }/>
            <AccountEmailSection primary={ primaryEmail }
                emails={ emails } updateDisplayedEmails={ showNewEmail } />
            <AccountPasswordSection />
        </div>
    )
}

export default AccountSettingsMenu