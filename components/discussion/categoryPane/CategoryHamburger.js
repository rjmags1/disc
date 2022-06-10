import OutsideClickHandler from "react-outside-click-handler"

function CategoryHamburger({ toggleCatPane, showHiddenPane }) {
    const outsideClickHandler = (e) => {
        if (!showHiddenPane) return
        if (e.target.nodeName === 'H4' &&
            e.target.parentElement.nodeName === 'LI' &&
            (e.target.parentElement.attributes['data-testid'].value 
                === 'category-header-container')) {
            return
        }

        toggleCatPane()
    }

    return (
        <OutsideClickHandler onOutsideClick={ outsideClickHandler } >
            <button data-testid="category-menu-hamburger" 
                onClick={ toggleCatPane }
                className="ml-2 mr-1 w-[24px] h-[12px] hover:cursor-pointer
                    flex flex-col justify-between md:hidden">
                <div className="w-full bg-zinc-500 h-[2px] rounded" />
                <div className="w-full bg-zinc-500 h-[2px] rounded" />
                <div className="w-full bg-zinc-500 h-[2px] rounded" />
            </button>
        </ OutsideClickHandler>
    )
}

export default CategoryHamburger