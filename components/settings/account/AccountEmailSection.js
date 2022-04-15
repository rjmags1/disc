import AccountEmailList from './AccountEmailList'
import AccountAddEmailInput from './AccountAddEmailInput'

function AccountEmailSection() {
    const primaryEmailMsg = `
        You will only receive emails at your primary email address.`
    const additionalEmailMsg = `
        You can associate additional email addresses with your account
        for the purpose of recovering your account in the case of 
        a forgotten password.`
    const registeredEmailLoginMsg = `
        You can log in using any of your registered email addresses.`

    return (
        <div data-testid="account-email-section-container" className="mt-10">
            <h2 className="text-2xl ml-4">Email</h2>
            <div className="">
                <div className="border-2 border-light-gray 
                    rounded-md p-4 mt-3 pr-12 max-w-[48rem]">
                    <p className="text-sm mb-3">{ primaryEmailMsg }</p>
                    <p className="text-sm mb-3">{ additionalEmailMsg }</p>
                    <p className="text-sm mb-3">{ registeredEmailLoginMsg }</p>
                    <AccountEmailList />
                    <AccountAddEmailInput />
                </div>
            </div>
        </div>
    )
}

export default AccountEmailSection