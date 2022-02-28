import Image from 'next/image'
import Link from 'next/link'

function LogoLink() {
    return (
        <div data-testid="logo-link-container">
            <Link href="/">
                <a><Image src="/logo.png" width="30" height="30"/></a>
            </Link>
        </div>
    )
}

export default LogoLink