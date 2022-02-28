import LogoLink from './LogoLink'
import PageHeader from './PageHeader'
import HomeButton from './HomeButton'
import NotificationsButton from './NotificationsButton'
import ProfileButton from './ProfileButton'

function Navbar({ pageName }) {
    return (
        <nav>
            <LogoLink/>
            <PageHeader page={ pageName }/>
            <HomeButton />
            <NotificationsButton />
            <ProfileButton />
        </nav>
    )
}

export default Navbar