import { useRouter } from "next/router"

function Notification({ info, last }) {
    const router = useRouter()
    const handleClick = () => {
        router.push(`/${ info.courseId }/discussion`)
    }

    return (
        <li data-testid="notification" className="w-full h-fit text-sm
            border-b border-white text-white py-2 px-2 text-left 
            leading-relaxed font-semibold hover:bg-zinc-900" 
            style={ last ? { borderStyle: 'none' } : {}}
            onClick={ handleClick } >
            <p>{ genNotifText(info) }</p>
        </li>
    )
}

export default Notification

const genNotifText = (info) => {
    const { type } = info
    if (type === 'mention') {
        const {
            courseName, mentionedInPost, notifGenAuthor, postTitle 
        } = info
        const ellTitle = ellipsize(postTitle)
        const ellCourse = ellipsize(courseName)
        const inSection = ((mentionedInPost ?
            `post ${ ellTitle }` : `comment on post ${ ellTitle }`) +
                ` in ${ ellCourse }`)
        return `${ notifGenAuthor } mentioned you in their ${ inSection }.`
    }
    else if (type === 'watch') {
        const { courseName, notifGenAuthor, postTitle } = info
        const ellTitle = ellipsize(postTitle)
        const ellCourse = ellipsize(courseName)
        const whatWatching = `${ ellTitle } in ${ ellCourse }`
        return `${ notifGenAuthor } commented on a post you're watching: ${ whatWatching }.`
    }
    else if (type === 'announcement') {
        const { courseName, notifGenAuthor } = info
        const ellCourse = ellipsize(courseName)
        return `${ notifGenAuthor } made an announcement in ${ ellCourse }.`
    }
    else if (type === 'userCommentReply') {
        const { courseName, notifGenAuthor, postTitle } = info
        const ellTitle = ellipsize(postTitle)
        const ellCourse = ellipsize(courseName)
        const postSpace = `${ ellTitle } in ${ ellCourse }`
        return `${ notifGenAuthor } replied to your comment on ${ postSpace }.`
    }
    else if (type === 'userPostActivity') {
        const { courseName, notifGenAuthor, postTitle } = info
        const ellTitle = ellipsize(postTitle)
        const ellCourse = ellipsize(courseName)
        const postSpace = `${ ellTitle } in ${ ellCourse }`
        return `${ notifGenAuthor } commented on your post ${ postSpace }.`
    }
}

const ellipsize = s => s.length < 20 ? 
    `'${ s }'` : `'${ s.slice(0, 18) + '...' }'`