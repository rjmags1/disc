function AccountPasswordSection() {
    const handleClick = function() {
        // api call telling server to send reset password email to user
    }

    return (
        <div data-testid="account-password-section-container">
            <h2>Password</h2>
            <button onClick={ handleClick }>Reset Password</button>
        </div>
    )
}

export default AccountPasswordSection