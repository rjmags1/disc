import AccountEmailList from './AccountEmailList'
import AccountAddEmailInput from './AccountAddEmailInput'

function AccountEmailSection({ primary, emails, updateDisplayedEmails }) {
    return (
        <div data-testid="account-email-section-container" className="mt-10">
            <h2 className="text-2xl ml-4">Email</h2>
            <div className="w-fit">
                <div className="border-2 border-light-gray rounded-md p-4 mt-3 pr-12">
                    <p className="text-sm mb-3">
                        You will only receive emails at your primary email address.
                    </p>
                    <p className="text-sm mb-3">
                        You can associate additional email addresses with your account for the purpose of recovering your account in the case of a forgotten password.
                    </p>
                    <p className="text-sm mb-3">
                        You can log in using any of your registered email addresses.
                    </p>
                    <AccountEmailList primary={ primary } emails={ emails }/>
                    <AccountAddEmailInput updateDisplayedEmails={ updateDisplayedEmails } emails={ emails }/>
                </div>
            </div>
        </div>
    )
}

export default AccountEmailSection