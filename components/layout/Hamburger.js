import DropdownMenu from "./DropdownMenu"

import { useState } from 'react'
import OutsideClickHandler from "react-outside-click-handler"

function Hamburger() {
    const [displayDropdown, setDisplayDropdown] = useState(false)

    return (
        <div className="ml-auto">
        <OutsideClickHandler onOutsideClick={ () => setDisplayDropdown(false) } >
            <div data-testid="hamburger-container"
                className="sm:hidden w-[25px] h-[20px] mr-1 flex 
                    flex-col items-center justify-between hover:cursor-pointer"
                onClick={ () => { setDisplayDropdown(!displayDropdown) }}>
                <div className="w-full h-[4px] bg-white rounded"/>
                <div className="w-full h-[4px] bg-white rounded"/>
                <div className="w-full h-[4px] bg-white rounded"/>
            </div>
            { displayDropdown && <DropdownMenu /> }
        </ OutsideClickHandler></div>
    )
}

export default Hamburger