import { useEffect } from 'react'

function InvalidLoginMessage({ failedAttempts }) {
    const pulseTime = 100

    useEffect(() => {
        const invalidMsgContainer = document.getElementById(
            "invalid-message-container")
        invalidMsgContainer.style.opacity = "0.5"
        setTimeout(() => { invalidMsgContainer.style = "" }, pulseTime)
    }, [failedAttempts])

    const messageText = `
        The account information you have entered is invalid. 
        Please enter valid credentials and resubmit.
        `

    return (
        <div data-testid="invalid-message-container"
            id="invalid-message-container"
            className={`text-center mt-6 border-solid border-2
            border-white rounded-md bg-red-800 p-1.5
            transition-opacity duration-[${ pulseTime }]`}>
            { messageText }
        </div>
    )
}

export default InvalidLoginMessage