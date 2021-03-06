import { useUser, useEmails } from '../../../lib/hooks'
import Loading from '../../../components/lib/Loading'

function AccountEmailList() {
    const { 
        user, 
        loading: loadingUser 
    } = useUser({ redirectTo: '/login' })

    const { 
        emails, 
        loading: loadingEmails 
    } = useEmails(user?.user_id)

    if (loadingEmails || loadingUser) return <Loading /> 

    const { primary_email: primaryEmail } = user

    const emailListings = emails.emails.map((email) => 
        <li key={ email } 
            className="bg-purple border-2 border-white rounded
                p-2 pl-4 mb-2 flex items-center justify-between">
            <span className="overflow-hidden text-ellipsis">
                { email }
            </span>
            { email === primaryEmail && 
            <span className="text-xs bg-zinc-900 border
                rounded py-0.5 px-4 mr-4">
                PRIMARY
            </span>
            }
        </li>
    )
    
    return (
        <div data-testid="account-email-list-container"
            className="my-6">
            <ul className="">
                { emailListings }
            </ul>
        </div>
    )
}

export default AccountEmailList