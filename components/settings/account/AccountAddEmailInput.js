import { useState } from 'react'
import { useUser, useEmails } from '../../../lib/hooks'

import NewEmailSubmitFailedMessage from './NewEmailSubmitFailedMessage'
import { validEmail } from '../../../lib/validation'
import ButtonLoading from '../../lib/ButtonLoading'

function AccountAddEmailInput() {
    const [submitFailed, setSubmitFailed] = useState(false)
    const [invalidEmail, setInvalidEmail] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [uploading, setUploading] = useState(false)

    const { 
        user, 
        loading: loadingUser 
    } = useUser({ redirectTo: '/login' })

    const { 
        emails, 
        mutateEmails, 
        loading: loadingEmails 
    } = useEmails(user?.user_id)

    const validNewEmail = function() {
        const previouslyRegistered = emails.emails.indexOf(newEmail) > -1
        return validEmail(newEmail) && !previouslyRegistered
    }

    const handleClick = async function(event) {
        event.preventDefault()
        // early render button but only allow fxn once user, email loaded
        if (loadingUser || loadingEmails) return

        if (!validNewEmail()) {
            setInvalidEmail(true)
            setSubmitFailed(true)
            return
        }
        
        setUploading(true)
        setInvalidEmail(false)
        try {
            const resp = await fetch('/api/settings/email/create', {
                method: 'POST',
                headers: { "Content-Type" : "application/json" },
                body: JSON.stringify({ newEmail })
            })
            setSubmitFailed(!resp.ok)
            if (resp.ok) {
                setNewEmail("")
                mutateEmails()
            }
        }
        catch (error) {
            setSubmitFailed(true)
        }
        finally {
            setUploading(false)
        }
    }

    const normalAddButtonStyles = `mx-2 bg-purple border rounded border-white 
        p-0.5 px-4 inline-flex flex-row items-center justify-center
        hover:cursor-pointer hover:bg-black`

    const uploadingAddButtonStyles = `mx-2 bg-purple border rounded border-white
        p-0.5 px-4 inline-flex flex-row items-center justify-center
        hover:cursor-not-allowed`

    return (
        <div data-testid="add-email-container" 
            className="mt-12 mb-1">
                <label htmlFor="new-email">
                    <span className="block text-lg">Add email address</span>
                    <input type="text" value={ newEmail }
                        id="new-email" name="new-email"
                        onChange={ event => setNewEmail(event.target.value) }
                        className="bg-light-gray border rounded 
                            border-white p-0.5 px-1 w-72">
                    </input>
                </label>
                <button onClick={ handleClick } id="new-email-submit" 
                    disabled={ uploading ? true : "" }
                    className={ uploading ? 
                        uploadingAddButtonStyles : normalAddButtonStyles } >
                     
                    Add
                    { uploading && <ButtonLoading /> }
                </button>
            { submitFailed && 
            <NewEmailSubmitFailedMessage dueToInvalidEmail={ invalidEmail } />
            }
        </div>
    )
}

export default AccountAddEmailInput