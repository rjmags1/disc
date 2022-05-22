function EditButton({ editPost }) {
    return (
        <div data-testid="edit-button-container" className="h-[25px] text-sm" >
            <button className="flex items-center justify-center rounded
                h-full bg-purple hover:bg-violet-800 border border-white
                hover:cursor-pointer px-1.5 w-max" onClick={ editPost } >
                <span>Edit</span>
            </button>
        </div>
    )
}

export default EditButton