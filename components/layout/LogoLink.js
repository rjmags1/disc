import Image from 'next/image'
import Link from 'next/link'

function LogoLink() {
    return (
        <div data-testid="logo-link-container" className="p-1 sm:p-3">
            <Link href="/">
                <a className='text-white text-lg font-mono'>
                    <em><strong>disc</strong></em>
                </a>
            </Link>
        </div>
    )
}

export default LogoLink