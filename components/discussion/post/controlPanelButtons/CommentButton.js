function CommentButton({ hideCommentBtn }) {
    // calling hideCommentBtn will result in the new comment button
    // being hidden, but will also result in a quill editor render
    // for creating a new comment

    return (
        <button className="w-full h-[35px] bg-purple rounded border 
            border-white hover:cursor-pointer hover:bg-violet-700 my-3 py-1"
            data-testid="new-comment-btn"
            onClick={ hideCommentBtn } >
            + New Comment
        </button>
    )
}

export default CommentButton