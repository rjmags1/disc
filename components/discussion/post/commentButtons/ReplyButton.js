function ReplyButton({ setClicked }) {
    // calling setClicked triggers Editor render below control panel
    // containing this button

    return (
        <button className="px-1 hover:opacity-60" 
            data-testid="comment-reply-button"
            onClick={ () => setClicked(true) }>
            REPLY
        </button> 
    )
}

export default ReplyButton