import LogoLink from './LogoLink'
import PageHeader from './PageHeader'
import HomeButton from './HomeButton'
import NotificationsButton from './NotificationsButton'
import ProfileButton from './ProfileButton'
import Hamburger from './Hamburger'

function Navbar({ pageName }) {
    return (
        <nav className='h-[48px] flex 
            bg-purple items-center px-2 fixed w-full z-50'>
            <LogoLink/>
            <PageHeader pageName={ pageName }/>
            <div className="sm:w-full flex items-center justify-end">
                <HomeButton />
                <NotificationsButton />
                <ProfileButton />
            </div>
            <Hamburger />
        </nav>
    )
}

export default Navbar