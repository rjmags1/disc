import Link from 'next/link'
import { useRouter } from 'next/router'

function SettingsMenuButton({ label, href }) {
    const router = useRouter()
    
    const handleDivClick = function(e) {
        e.preventDefault()
        router.push(href)
    }

    return (
        <div data-testid="settings-menu-button-container"
            onClick={ handleDivClick }
            className="border rounded flex justify-center items-center
                mb-4 bg-neutral-900 hover:cursor-pointer">
            <Link href={ href }>
                <a>{ label }</a>
            </Link>
        </div>
    )
}

export default SettingsMenuButton