function ReplyButton({ parentId, ancestorId, setClicked }) {
    return (
        <button className="px-1 hover:opacity-60" 
            data-testid="comment-reply-button"
            onClick={ () => setClicked(true) }>
            REPLY
        </button> 
    )
}

export default ReplyButton