function DeleteButton() {
    return (
        <div data-testid="delete-button-container"
            className="w-full h-[40px]">
            <button className="w-full h-full bg-red-600 rounded border 
                border-white hover:cursor-pointer hover:bg-red-700">
                Delete
            </button>
        </div>
    )
}

export default DeleteButton