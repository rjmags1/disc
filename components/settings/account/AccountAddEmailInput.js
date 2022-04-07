import { useState } from 'react'
import { useUser, useEmails } from '../../../lib/hooks'

import NewEmailSubmitFailedMessage from './NewEmailSubmitFailedMessage'
import { validEmail } from '../../../lib/validation'

function AccountAddEmailInput() {
    const [submitFailed, setSubmitFailed] = useState(false)
    const [invalidEmail, setInvalidEmail] = useState(false)
    const [newEmail, setNewEmail] = useState("")

    const { user: { user_id: userId } } = useUser()
    const { emails, mutateEmails } = useEmails(userId)

    const validNewEmail = function() {
        console.log(typeof(emails.emails))
        const previouslyRegistered = emails.emails.indexOf(newEmail) > -1
        return validEmail(newEmail) && !previouslyRegistered
    }

    const handleSubmit = function(e) {
        e.preventDefault()
        if (!validNewEmail()) {
            setInvalidEmail(true)
            setSubmitFailed(true)
            return
        }
        setInvalidEmail(false)
        // add new email api call
        // if call failed setSubmitFailed(true) and return
        // setSubmitFailed(false)
        // setNewEmail("")
        // updateDisplayedEmails(newEmail)
        const body = {
            userId: userId,
            newEmail: newEmail
        }
        try {
            mutateEmails(async () => {
                const resp = await fetch('/api/settings/email/create', {
                    method: 'POST',
                    headers: { "Content-Type" : "application/json" },
                    body: JSON.stringify(body)
                })
                if (!resp.ok) setSubmitFailed(true)
                else {
                    setSubmitFailed(false)
                    setNewEmail("")
                }
                return { emails: [...emails.emails, newEmail] }
            })
        }
        catch (error) {
            setSubmitFailed(true)
            console.error(error)
        }
    }

    return (
        <div data-testid="add-email-container" className="mt-12 mb-1">
            <form onSubmit={ handleSubmit } >
                <label htmlFor="new-email">
                    <span className="block text-lg">Add email address</span>
                    <input type="text" value={ newEmail }
                        id="new-email" name="new-email"
                        onChange={ e => setNewEmail(e.target.value) }
                        className="bg-light-gray border rounded 
                            border-white p-0.5 px-1 w-72">
                    </input>
                </label>
                <input type="submit" value="Add" id="new-email-submit"
                    className="mx-2 bg-purple border rounded
                        border-white p-0.5 px-4 
                        hover:cursor-pointer hover:bg-black" />
            </form>
            { submitFailed && 
            <NewEmailSubmitFailedMessage
                dueToInvalidEmail={ invalidEmail } /> }
        </div>
    )
}

export default AccountAddEmailInput