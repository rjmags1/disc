import Link from 'next/link'
import { useRouter } from 'next/router'

function SettingsMenuButton({ label, href }) {
    const router = useRouter()
    
    const handleDivClick = function(event) {
        event.preventDefault()
        router.push(href)
    }

    return (
        <div data-testid="settings-menu-button-container"
            onClick={ handleDivClick }
            className="text-white w-48 flex items-center justify-center 
                rounded-md border-2 p-1 mb-3 bg-purple hover:bg-black
                hover:cursor-pointer">
            <Link href={ href }>
                <a>{ label }</a>
            </Link>
        </div>
    )
}

export default SettingsMenuButton