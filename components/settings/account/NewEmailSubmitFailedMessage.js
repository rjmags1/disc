function NewEmailSubmitFailedMessage({ dueToInvalidEmail }) {
    const message = dueToInvalidEmail ? 
        "Unable to register email entered. Check for typos or if adding a previously registered email." :
        "Unable to register email entered. Check network connection and/or perform other troubleshooting and try again."

    return (
        <div data-testid="email-submit-failed-msg-container">
            { message }
        </div>
    )
}

export default NewEmailSubmitFailedMessage