import AccountEmailList from './AccountEmailList'
import AccountAddEmailInput from './AccountAddEmailInput'

function AccountEmailSection({ primary, emails, updateDisplayedEmails }) {
    return (
        <div data-testid="account-email-section-container">
            <h2>Email</h2>
            <p>
                You will only receive emails at your primary email address.
            </p>
            <p>
                You can associate additional email addresses with your account for the purpose of recovering your account in the case of a forgotten password.
            </p>
            <p>
                You can log in using any of your registered email addresses.
            </p>
            <AccountEmailList primary={ primary } emails={ emails }/>
            <AccountAddEmailInput updateDisplayedEmails={ updateDisplayedEmails } emails={ emails }/>
        </div>
    )
}

export default AccountEmailSection