function PostInfo({ info }) {
    return (
        <div data-testid="post-info-container"
            className="w-full">
            { info.postId }
        </div>
    )
}

export default PostInfo