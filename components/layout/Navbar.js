import LogoLink from './LogoLink'
import PageHeader from './PageHeader'
import HomeButton from './HomeButton'
import NotificationsButton from './NotificationsButton'
import ProfileButton from './ProfileButton'

function Navbar({ pageName }) {
    return (
        <nav className='h-9 sm:h-12 flex flex-row bg-purple items-center px-2'>
            <LogoLink/>
            <PageHeader pageName={ pageName }/>
            <HomeButton />
            <NotificationsButton />
            <ProfileButton />
        </nav>
    )
}

export default Navbar