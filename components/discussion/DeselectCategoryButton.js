function DeselectCategoryButton() {
    return (
        <button className="text-xs text-white h-min w-min px-1 border
            rounded bg-zinc-600 pb-0.5 ml-auto shrink-0 border-white"
            data-testid="deselect-button-container">
            x
        </button>
    )
}

export default DeselectCategoryButton