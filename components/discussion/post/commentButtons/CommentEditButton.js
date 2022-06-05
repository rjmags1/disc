function CommentEditButton({ setClicked }) {
    return (
        <button className="px-1 hover:opacity-60" onClick={ setClicked }
            data-testid="comment-edit-button">
            EDIT
        </button>
    )
}

export default CommentEditButton