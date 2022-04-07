import { useState } from 'react'
import { useUser } from '../../../lib/hooks'

import ImageFailedUploadMessage from './ImageFailedUploadMessage'

function NewAvatarButton({ src }) {
    const [failedUploadMessage, setFailedUploadMessage] = useState(false)

    const { user, mutateUser } = useUser()

    const updateAvatar = async function(newAvatarUrl) {
        try {
            const body = {
                userId: user.user_id,
                newAvatarUrl: newAvatarUrl
            }
            await fetch("/api/settings/updateAvatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            mutateUser()
            setFailedUploadMessage(false)
        }
        catch (error) {
            setFailedUploadMessage(true)
        }
    }

    const handleUpload = async function(event) {
        event.preventDefault()
        // in real app would upload new image to blob store
        // for dev just flip flop /public avatar images
        if (src === '/cool-profile-img.jpg') {
            const uploaded = await updateAvatar('/profile-button-img.png')
            if (!uploaded) return
            mutateUser()
        }
        else {
            const uploaded = await updateAvatar('/cool-profile-img.jpg')
            if (!uploaded) return
            mutateUser()
        }
    }

    return (
        <div data-testid="new-avatar-btn-container"
            className="mt-2" >
            <label className="text-xs bg-purple border border-white 
                p-1 rounded hover:bg-black hover:cursor-pointer">
                <input type="file" accept="image/*" 
                    onChange={ handleUpload } data-testid="new-avatar-input"
                    className="hidden"/>
                New Avatar
            </label>
            { failedUploadMessage && <ImageFailedUploadMessage /> }
        </div>
    )
}

export default NewAvatarButton