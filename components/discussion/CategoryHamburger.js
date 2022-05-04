function CategoryHamburger({ toggleCatPane }) {
    return (
        <div data-testid="category-menu-hamburger" onClick={ toggleCatPane }
            className="ml-2 mr-1 w-[24px] h-[12px] hover:cursor-pointer
                flex flex-col justify-between lg:hidden">
            <div className="w-full bg-zinc-500 h-[2px] rounded" />
            <div className="w-full bg-zinc-500 h-[2px] rounded" />
            <div className="w-full bg-zinc-500 h-[2px] rounded" />
        </div>
    )
}

export default CategoryHamburger