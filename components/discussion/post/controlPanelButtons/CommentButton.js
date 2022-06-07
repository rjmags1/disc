function CommentButton({ hideCommentBtn }) {

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