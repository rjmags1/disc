function EndorseButton() {
    return (
        <div data-testid="endorse-button-container"
            className="w-full h-[40px]">
            <button className="w-full h-full bg-blue-600 rounded border 
                border-white hover:bg-blue-700 hover:cursor-pointer">
                Endorse
            </button>
        </div>
    )
}

export default EndorseButton