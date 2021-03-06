export const syncListingWithBoolInteraction = (
    (interaction, listings, listingsContextSetter, currentPost, newStatus) => {
    if (currentPost.pinned || currentPost.isAnnouncement) {
        const specialListings = currentPost.pinned ? 
            listings.pinned : listings.announcements
        const needsUpdateIdx = specialListings.findIndex(
            l => l.postId === currentPost.postId)
        const needsUpdate = specialListings[needsUpdateIdx]
        const updated = interactionUpdatedReducer(
            interaction, needsUpdate, true, newStatus)
        listingsContextSetter({ 
            announcements: currentPost.pinned ?
                listings.announcements : [
                    ...specialListings.slice(0, needsUpdateIdx),
                    updated,
                    ...specialListings.slice(needsUpdateIdx + 1) ], 
            pinned: currentPost.isAnnouncement ? 
                listings.pinned : [
                ...specialListings.slice(0, needsUpdateIdx),
                updated,
                ...specialListings.slice(needsUpdateIdx + 1) ] 
        })

        return
    }

    const needsUpdateIdx = listings.findIndex(
        l => l.postInfo.postId === currentPost.postId)
    const needsUpdate = listings[needsUpdateIdx]
    const updated = interactionUpdatedReducer(
        interaction, needsUpdate, false, newStatus)
    listingsContextSetter([
        ...listings.slice(0, needsUpdateIdx),
        updated,
        ...listings.slice(needsUpdateIdx + 1)
    ])
})

const interactionUpdatedReducer = (
    (interaction, needsUpdate, special, newStatus) => {
    
    if (interaction === "like") {
        return special ? {
            ...needsUpdate, 
            liked: !needsUpdate.liked, 
            likes:  needsUpdate.likes + (newStatus ? 1 : -1)
        } : {
            ...needsUpdate,
            postInfo: {
                ...needsUpdate.postInfo,
                liked: !needsUpdate.postInfo.liked,
                likes: needsUpdate.postInfo.likes + (newStatus ? 1 : -1)
            }
            
        }
    }
    else if (interaction === "star") {
        return special ? {
            ...needsUpdate, 
            starred: !needsUpdate.starred
        } : {
            ...needsUpdate,
            postInfo: {
                ...needsUpdate.postInfo,
                starred: !needsUpdate.postInfo.starred
            }
        }
    }
    else if (interaction === "watch") {
        return special ? {
            ...needsUpdate, 
            watched: !needsUpdate.watched
        } : {
            ...needsUpdate,
            postInfo: {
                ...needsUpdate.postInfo,
                watched: !needsUpdate.postInfo.watched
            }
        }
    }
    else if (interaction === "endorse") {
        return special ? {
            ...needsUpdate, 
            endorsed: !needsUpdate.endorsed
        } : {
            ...needsUpdate,
            postInfo: {
                ...needsUpdate.postInfo,
                endorsed: !needsUpdate.postInfo.endorsed
            }
        }
    }
    else if (interaction === "delete") {
        return special ? {
            ...needsUpdate, 
            deleted: true
        } : {
            ...needsUpdate,
            postInfo: {
                ...needsUpdate.postInfo,
                deleted: true
            }
        }
    }

    else if (interaction === "resolve") {
        return special ? {
            ...needsUpdate, 
            resolved: !needsUpdate.resolved
        } : {
            ...needsUpdate,
            postInfo: {
                ...needsUpdate.postInfo,
                resolved: !needsUpdate.postInfo.resolved
            }
        }
    }

    else if (interaction === "answer") {
        return special ? {
            ...needsUpdate, 
            answered: !needsUpdate.answered
        } : {
            ...needsUpdate,
            postInfo: {
                ...needsUpdate.postInfo,
                answered: !needsUpdate.postInfo.answered
            }
        }
    }
})