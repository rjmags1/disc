import Link from 'next/link'
import Image from 'next/image'

function HomeButton() {
    return (
        <div data-testid="home-button-container"
            className="p-1 sm:p-3 mt-1">
            <Link href="/">
                <a>
                    <Image src="/home.png" width="30" 
                        height="30" layout="fixed" />
                </a>
            </Link>
        </div>
    )
}

export default HomeButton