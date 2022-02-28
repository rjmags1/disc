import Link from 'next/link'
import Image from 'next/image'

function HomeButton() {
    return (
        <div data-testid="home-button-container">
            <Link href="/">
                <a><Image src="/home.png" width="30" height="30"/></a>
            </Link>
        </div>
    )
}

export default HomeButton