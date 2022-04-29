import LogoLink from './LogoLink'
import PageHeader from './PageHeader'
import HomeButton from './HomeButton'
import NotificationsButton from './NotificationsButton'
import ProfileButton from './ProfileButton'
import Hamburger from './Hamburger'

function Navbar({ pageName }) {
    return (
        <nav className='h-[48px] flex flex-row 
            bg-purple items-center px-2 fixed w-full z-10'>
            <LogoLink/>
            <PageHeader pageName={ pageName }/>
            <HomeButton />
            <NotificationsButton />
            <ProfileButton />
            <Hamburger />
        </nav>
    )
}

export default Navbar