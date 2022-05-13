function NoPostSelected() {
    return (
        <div data-testid="no-post-selected-icon"
            className="flex items-center justify-center flex-col w-full
                opacity-75">
            <img src="/discussion-icon.png" width="240" />
            <span className="text-xl text-white">
                Select a post
            </span>
        </div>
    )
}

export default NoPostSelected