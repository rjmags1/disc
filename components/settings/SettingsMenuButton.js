import Link from 'next/link'

function SettingsMenuButton({ label, href }) {
    return (
        <div data-testid="settings-menu-button-container">
            <Link href={ href }>
                <a>{ label }</a>
            </Link>
        </div>
    )
}

export default SettingsMenuButton