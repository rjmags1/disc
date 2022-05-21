import Quill from "quill"
import { useRef, useEffect, useState } from 'react'

let quill

function Editor({ hideEditor, handleSubmit, editContent, isPost }) {
    const [tick, setTick] = useState(0)
    const [anonymous, setAnonymous] = useState(false)
    const editorRef = useRef(null)
    useEffect(() => {
        if (!editorRef.current || tick > 0) return
        quill = new Quill(editorRef.current, {
            theme: 'snow'
        })
        if (!!editContent) quill.setContents(editContent)
        setTick(prev => prev + 1)
        
    }, [editorRef.current])

    useEffect(() => {
        if (!editorRef.current) return

        const svgs = document.getElementsByTagName("svg")
        for (let i = 0; i < svgs.length; i++) {
            setStrokeWhiteOnSVG(svgs[i])
        }
    }, [tick])

    const removeToolbarAndEditor = () => {
        removeToolbar(editorRef.current)
        if (!!hideEditor) hideEditor()
    }

    const handleSubmitClick = async () => {
        const submitted = await handleSubmit({ 
            editContent: quill.getContents(),
            displayContent: editorRef.current.firstElementChild.innerHTML,
            anonymous
        })
        console.log(submitted)
        if (submitted) removeToolbarAndEditor()
    }

    return (
        <>
            <div id="quill-editor-container" ref={ editorRef } 
                className="text-white rounded-b-[10px]" 
                style={ isPost ? { fontSize: '1rem', fontWeight: 200 } : {} } />
            <div className="flex mb-2">
                <button className="mt-4 bg-purple py-0.5 px-2 rounded border
                    border-white hover:bg-violet-800" onClick={ handleSubmitClick }
                    style={ isPost ? { paddingLeft: '2rem', paddingRight: '2rem' } : {} }>
                    { isPost ? "Post" : "Submit" }
                </button>
                { !isPost && 
                <button className="mx-2 mt-2 py-0.5 opacity-60 underline 
                    hover:opacity-30 font-thin text-sm" 
                    onClick={ () => setAnonymous(prev => !prev) }>
                    { anonymous ? "Unmark anonymous" : "Mark anonymous" }
                </button> }
                { !isPost && 
                <button className="mt-2 py-0.5 opacity-60 underline 
                    hover:opacity-30 font-thin text-sm" 
                    onClick={ removeToolbarAndEditor }>
                    Cancel
                </button> }
            </div>
        </>
        
    )
}

const setStrokeWhiteOnSVG = (elem) => {
    if (!elem.children.length) return

    const children = elem.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        child.style.stroke = "white"
        setStrokeWhiteOnSVG(child)
    }
}

const removeToolbar = (editorElem) => {
    if (!editorElem) return
    editorElem.previousElementSibling.remove()
}

export default Editor