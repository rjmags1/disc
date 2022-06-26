export const filterTest = (postInfo, user, filters) => {
    const [categoryFilter, filterText, attributeFilter] = filters
    const re = new RegExp(filterText, "i")
    const { author, category, title, deleted, anonymous } = postInfo
    const textFields = [author, category, title]
    
    return (
        !deleted &&
        (!categoryFilter.size || categoryFilter.has(postInfo.category)) &&
        (!filterText || textFields.some((textField, i) => {
            if (i === 0 && anonymous) return false
            return re.test(textField)
        })) &&
        (attributeFilter === "All" || (checkAttributes(postInfo, user, attributeFilter))) 
    )
}

export const checkAttributes = (postInfo, user, attributeFilter) => {
    if (attributeFilter === "Unread") {
        return !postInfo.lastViewedAt || (
            Date.parse(postInfo.mostRecentCommentTime) > 
            Date.parse(postInfo.lastViewedAt))
    }
    else if (attributeFilter === "Unanswered") {
        return postInfo.isQuestion && !postInfo.answered && !postInfo.resolved
    }
    else if (attributeFilter === "Unresolved") {
        return !postInfo.isQuestion && !postInfo.resolved && !postInfo.answered
    }
    else if (attributeFilter === "Endorsed") {
        return postInfo.endorsed
    }
    else if (attributeFilter === "Watching") {
        return postInfo.watched
    }
    else if (attributeFilter === "Starred") {
        return postInfo.starred
    }
    else if (attributeFilter === "Private") {
        return postInfo.private
    }
    else if (attributeFilter === "Public") {
        return !postInfo.private
    }
    else if (attributeFilter === "Staff") {
        return postInfo.authorIsStaffOrInstructor && !postInfo.anonymous
    }
    else if (attributeFilter === "Mine") {
        return postInfo.author === `${ user.f_name } ${ user.l_name }` && !postInfo.anonymous
    }
}