import { useState } from 'react'

import NewEmailSubmitFailedMessage from './NewEmailSubmitFailedMessage'

function AccountAddEmailInput({ updateDisplayedEmails, emails }) {
    const [newEmail, setNewEmail] = useState("")
    const [submitFailed, setSubmitFailed] = useState(false)
    const [invalidEmail, setInvalidEmail] = useState(false)

    const validEmail = function(email) {
        const lastAtIdx = email.lastIndexOf('@')
        const prefixLength = lastAtIdx
        const suffixLength = email.length - prefixLength - 1
        const lastDotIdx = email.lastIndexOf('.')
        const validEmail = (
            lastAtIdx < lastDotIdx
            && lastAtIdx > 0 
            && email.indexOf('@@') == -1 
            && lastDotIdx > 2 
            && (email.length - lastDotIdx) > 2
            && prefixLength <= 64
            && suffixLength <= 255
        )
        const previouslyRegistered = emails.indexOf(email) > -1

        return validEmail && !previouslyRegistered
    }

    const handleSubmit = function(e) {
        e.preventDefault()
        if (!validEmail(newEmail)) {
            setInvalidEmail(true)
            setSubmitFailed(true)
            return
        }
        setInvalidEmail(false)
        // add new email api call
        // if call failed setSubmitFailed(true) and return
        setSubmitFailed(false)
        setNewEmail("")
        updateDisplayedEmails(newEmail)
    }

    return (
        <div data-testid="add-email-container" className="mt-12 mb-1">
            <form onSubmit={ handleSubmit } >
                <label htmlFor="new-email">
                    <span className="block text-lg">Add email address</span>
                    <input type="text" value={ newEmail } id="new-email" name="new-email"
                        onChange={ e => setNewEmail(e.target.value) }
                        className="bg-light-gray border rounded border-white p-0.5 px-1
                            w-72">
                    </input>
                </label>
                <input type="submit" value="Add" 
                    className="mx-2 bg-purple border rounded border-white p-0.5 px-4
                        hover:cursor-pointer hover:bg-black" />
            </form>
            { submitFailed && 
            <NewEmailSubmitFailedMessage dueToInvalidEmail={ invalidEmail } />}
        </div>
    )
}

export default AccountAddEmailInput