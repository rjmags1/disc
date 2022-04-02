function NewEmailSubmitFailedMessage({ dueToInvalidEmail }) {
    const invalidEmailMsg = `
        Unable to register email entered. Check for typos or
        if you are attempting to add a previously registered email.`
    const otherInvalidMsg = `
        Unable to register email entered. Check network connection 
        and/or perform other troubleshooting and try again.`

    return (
        <div data-testid="email-submit-failed-msg-container">
            { dueToInvalidEmail ? invalidEmailMsg : otherInvalidMsg }
        </div>
    )
}

export default NewEmailSubmitFailedMessage