import Link from 'next/link'

function HomeButton() {
    return (
        <div data-testid="home-button-container"
            className="hidden sm:block p-1">
            <Link href="/">
                <a>
                    <img src="/home.png" width="30" height="30" layout="fixed" />
                </a>
            </Link>
        </div>
    )
}

export default HomeButton