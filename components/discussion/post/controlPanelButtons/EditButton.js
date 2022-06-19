function EditButton({ editPost }) {
    // editPost called when user clicks this button, which will cause
    // the displayed post and its comment threads to be swapped out 
    // for a quill editor containing the current post contents

    return (
        <div data-testid="post-edit-button-container" 
            className="h-[25px] text-sm" >
            <button className="flex items-center justify-center rounded
                h-full bg-purple hover:bg-violet-800 border border-white
                hover:cursor-pointer px-1.5 w-max" onClick={ editPost } >
                <span>Edit</span>
            </button>
        </div>
    )
}

export default EditButton