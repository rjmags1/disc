import DeselectCategoryButton from './DeselectCategoryButton'
import React, { useRef, useEffect, useState } from 'react'

const Category = React.memo(function({ name, bulletColor, changeFilter }) {
    const [selected, setSelected] = useState(null)
    const containerRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return

        changeFilter(selected, name)
        containerRef.current.style.backgroundColor = selected ?
            "#18181b" : ""
    }, [selected, containerRef])

    return (
        <div data-testid="category-header-container" ref={ containerRef }
            className="w-full py-1 font-mono text-sm flex items-center 
                hover:cursor-pointer px-4"
            onClick={ () => setSelected(!selected) }>
            <div data-testid="category-bullet" className="w-[6px] h-[6px] ml-1
                mr-2 shrink-0" style={{ backgroundColor: bulletColor }} />
            <h4 className="shrink-1 grow whitespace-nowrap 
                    overflow-hidden mr-2 text-ellipsis select-none">
                { name }
            </h4>
            { selected && <DeselectCategoryButton /> }
        </div>
    )
})

export default Category