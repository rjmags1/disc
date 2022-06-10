import Quill from "quill"
import { sanitize } from 'dompurify'
import { useRef, useEffect, useState } from 'react'


function Editor({ hideEditor, handleSubmit, editContent, isPost, editingPost }) {
    const [tick, setTick] = useState(0)
    const [anonymous, setAnonymous] = useState(false)
    const [quill, setQuill] = useState(null)

    const editorRef = useRef(null)


    useEffect(() => { // init quill once its container is rendered
        if (!editorRef.current || tick > 0) return

        const newQuill = new Quill(editorRef.current, { theme: 'snow' })
        if (!!editContent) newQuill.setContents(editContent)
        setQuill(newQuill)
        setTick(prev => prev + 1)
        
    }, [editorRef.current])

    useEffect(() => { // once quill is init style the toolbar icons
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
        const sanitizedUserHtmlFromQuill = sanitize(
            editorRef.current.firstElementChild.innerHTML)
        const submitted = await handleSubmit({ 
            editContent: quill.getContents(),
            displayContent: sanitizedUserHtmlFromQuill,
            anonymous
        })
        if (submitted) removeToolbarAndEditor()
    }

    return (
        <>
            <div id="quill-editor-container" ref={ editorRef } 
                className="text-white rounded-b-[10px]" 
                style={ isPost ? { fontSize: '1rem', fontWeight: 200 } : {} } />
            <div className="flex mb-2 items-center mt-3 gap-3">
                <button className="h-full bg-purple rounded border py-0.5 px-2
                    border-white hover:bg-violet-800" onClick={ handleSubmitClick }
                    style={ isPost ? { paddingLeft: '2rem', paddingRight: '2rem' } : {} }
                    data-testid="editor-submit-button">
                    { isPost && !editingPost ? "Post" : "Submit" }
                </button>
                { !isPost && 
                <button className="h-full opacity-60 underline 
                    hover:opacity-30 font-thin text-sm" 
                    onClick={ () => setAnonymous(prev => !prev) }>
                    { anonymous ? "Unmark anonymous" : "Mark anonymous" }
                </button> }
                { (!isPost || editingPost) && 
                <button className="h-full opacity-60 underline 
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