function AccountEmailList({ primary, emails }) {
    const emailListings = emails.map((email) => 
        <li key={ email }>
            { email }
            { email === primary && <span>PRIMARY</span> }
        </li>
    )
    return (
        <div data-testid="account-email-list-container">
            <ul>
                { emailListings }
            </ul>
        </div>
    )
}

export default AccountEmailList