import Link from 'next/link'

function LogoLink() {
    return (
        <header data-testid="logo-link-container" className="p-1 sm:p-3">
            <Link href="/">
                <a className='text-white text-lg font-mono'>
                    <em><strong>disc</strong></em>
                </a>
            </Link>
        </header>
    )
}

export default LogoLink