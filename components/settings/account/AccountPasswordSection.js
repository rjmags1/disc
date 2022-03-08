function AccountPasswordSection() {
    const handleClick = function() {
        // api call telling server to send reset password email to user
    }

    return (
        <div data-testid="account-password-section-container"
            className="mt-10">
            <div className="ml-4">
                <h2 className="text-2xl">Password</h2>
                <button onClick={ handleClick }
                    className="mt-2 bg-red-600 border border-white rounded
                        p-1 hover:cursor-pointer hover:bg-black px-4">
                    Reset Password
                </button>
            </div>
        </div>
    )
}

export default AccountPasswordSection