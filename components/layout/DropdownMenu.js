import DropdownButton from './DropdownButton'

function DropdownMenu() {
    return (
        <div data-testid="dropdown-container"
            className="fixed w-fit bg-purple text-white top-9 
                sm:top-12 rounded-b-md border-black right-0">
            <DropdownButton label="Home" href="/" hamburgerItem={ true }/>
            <DropdownButton label="Notifications" hamburgerItem={ true }/>
            <DropdownButton label="Settings" href="/settings/account"/>
            <DropdownButton label="Log out" last={ true } 
                href="/logout"/>
        </div>
    )
}

export default DropdownMenu