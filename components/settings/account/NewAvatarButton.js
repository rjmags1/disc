import { useState } from 'react'
import { useUser } from '../../../lib/hooks'

import ImageFailedUploadMessage from './ImageFailedUploadMessage'
import ButtonLoading from '../../lib/ButtonLoading'

function NewAvatarButton({ src }) {
    const [failedUploadMessage, setFailedUploadMessage] = useState(false)
    const [uploading, setUploading] = useState(false)

    const { 
        user, 
        mutateUser, 
        loading: loadingUser 
    } = useUser({ redirectTo: '/login' })

    const handleUpload = async function(event) {
        // early render button but only allow fxn when user is loaded
        if (loadingUser) return

        event.preventDefault()
        setUploading(true)
        // real app would upload new image to blob store then store url in db:
        // const newFile = event.target.files[0]
        // const newUrl = putInBlobStore(newFile) (in try-catch block)
        // for dev just flip flop /public avatar images to show frontend works
        const newUrl = src === '/cool-profile-img.jpg' ?
            '/profile-button-img.png' : '/cool-profile-img.jpg'
        const updated = await updateAvatarInDb(newUrl)
        if (updated) mutateUser()
        setUploading(false)
    }

    const updateAvatarInDb = async function(newAvatarUrl) {
        const { user_id: userId } = user
        let updated = false
        try {
            const body = {
                userId: userId,
                newAvatarUrl: newAvatarUrl
            }
            const resp = await fetch("/api/settings/updateAvatar", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            updated = resp.ok
            setFailedUploadMessage(!updated)
        }
        catch (error) {
            setFailedUploadMessage(true)
        }
        finally { 
            return updated
        }
    }

    const normalStyles = `bg-purple border border-white text-xs min-w-fit p-1
        rounded hover:bg-black hover:cursor-pointer flex items-center flex-row`
    
    const uploadingStyles = `bg-purple border border-white text-xs min-w-fit p-1
        rounded hover:cursor-not-allowed flex items-center flex-row`

    return (
        <div data-testid="new-avatar-btn-container"
            className="mt-2 flex flex-row items-center justify-center" >
            <label className={ uploading ? uploadingStyles : normalStyles }>
                <input type="file" accept="image/*" 
                    disabled={ uploading ? true : "" } className="hidden"
                    onChange={ handleUpload } data-testid="new-avatar-input" />
                New Avatar
                { uploading && <ButtonLoading /> }
            </label>
            { failedUploadMessage && <ImageFailedUploadMessage /> }
        </div>
    )
}

export default NewAvatarButton