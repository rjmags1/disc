import { useRef, useEffect } from 'react'

function Category({ info, bulletColor }) {
    const bulletRef = useRef(null)

    useEffect(() => {
        if (!bulletRef.current) return

        bulletRef.current.style.backgroundColor = bulletColor
    }, [bulletRef])

    return (
        <div data-testid="category-header-container" 
            className="w-full py-1 font-mono
                whitespace-nowrap text-sm flex items-center">
            <div data-testid="category-bullet" ref={ bulletRef }
                className="w-[6px] h-[6px] ml-1 mr-2 flex-none" />
            <h4>{ info.category }</h4>
        </div>
    )
}

export default Category