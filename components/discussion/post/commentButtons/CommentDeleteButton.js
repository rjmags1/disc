function CommentDeleteButton({ postId, commentId, markDeleted }) {

    const handleClick = async () => {
        // optimistically mark the relevant comment as deleted before 
        // attempting to update the backend, causing the entire control panel
        // to be removed and the comment content to be obscured
        markDeleted()
        try {
            await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentId }/delete/${ true }`,
                { method: 'PUT' }
            )
        }
        catch (error) { console.error(error) }
    }

    return (
        <button className="px-1 hover:opacity-60" onClick={ handleClick } 
            data-testid="comment-delete-button">
            DELETE
        </button>
    )
}

export default CommentDeleteButton