function CommentEditButton({ setClicked }) {
    // calling setClicked triggers Editor render beneath control panel
    // containing this button

    return (
        <button className="px-1 hover:opacity-60" onClick={ setClicked }
            data-testid="comment-edit-button">
            EDIT
        </button>
    )
}

export default CommentEditButton