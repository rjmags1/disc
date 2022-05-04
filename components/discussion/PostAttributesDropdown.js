import OutsideClickHandler from "react-outside-click-handler"
import PostAttribute from "./PostAttribute"

const ATTRIBUTES = [
    "All", "Unread", "Unanswered", "Unresolved", "Endorsed", "Watching",
    "Starred", "Private", "Public", "Staff", "Mine"
]


function PostAttributesDropdown(props) {
    const { 
        handleOutsideClick, 
        attributeFilter, 
        hideDropdown, 
        changeAttribute 
    } = props

    const attributes = ATTRIBUTES.map(attr => (
        <PostAttribute attribute={ attr } hideDropdown={ hideDropdown }
            selected={ attributeFilter === attr } key={ attr }
            changeAttribute={ changeAttribute } />
    ))

    return (
        <OutsideClickHandler onOutsideClick={ handleOutsideClick } >
            <div className="absolute w-[160px] text-right pb-1 
                bg-zinc-900 right-1 top-12 rounded-b-lg shadow-2xl border 
                border-zinc-600 border-t-0 border-r-0" onClick={ hideDropdown }>
                { attributes }
            </div>
        </OutsideClickHandler>
    )
}

export default PostAttributesDropdown