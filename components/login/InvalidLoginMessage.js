function InvalidLoginMessage() {
    return (
        <div data-testid="invalid-message-container" 
            className="text-center mt-6 border-solid border-2 
            border-slate rounded-md bg-red-800 p-1.5">
            The account information you have entered is invalid. Please enter valid credentials and resubmit.
        </div>
    )
}

export default InvalidLoginMessage