import { useEffect, useState } from 'react'

import EmailSetting from './EmailSetting'

function NotificationsMenu() {
    const [threadActivity, setThreadActivity] = useState(false)
    const [threadReply, setThreadReply] = useState(false)
    const [commentReply, setCommentReply] = useState(false)
    const [mention, setMention] = useState(false)

    const [dThreadActivity, setDThreadActivity] = useState(false)
    const [dThreadReply, setDThreadReply] = useState(false)
    const [dCommentReply, setDCommentReply] = useState(false)
    const [dMention, setDMention] = useState(false)

    const [showSavedAlert, setShowSavedAlert] = useState(false)
    const [showSaveFailedAlert, setSaveFailedAlert] = useState(false)

    useEffect(() => {
        // fetch user settings
        // dummy for now
        const fetched = {
            watchedThreadActivity: true,
            myThreadReply: false,
            myCommentReply: true,
            mention: false,
        }
        const { 
            watchedThreadActivity,
            myThreadReply,
            myCommentReply,
            mention } = fetched

        setThreadActivity(watchedThreadActivity)
        setThreadReply(myThreadReply)
        setCommentReply(myCommentReply)
        setMention(mention)

        setDThreadActivity(watchedThreadActivity)
        setDThreadReply(myThreadReply)
        setDCommentReply(myCommentReply)
        setDMention(mention)
    }, [])

    const alertSaveSuccess = function() {
        setShowSavedAlert(true)
        setTimeout(() => setShowSavedAlert(false), 2000)
    }

    const alertSaveFailed = function() {
        setSaveFailedAlert(true)
        setTimeout(() => setSaveFailedAlert(false), 2000)
    }

    const handleSave = function() {
        // collect settings
        // api call to write new settings to database

        // if api call failed alertSaveFailed() and return. otherwise:
        setThreadActivity(dThreadActivity)
        setCommentReply(dCommentReply)
        setMention(dMention)
        setThreadReply(dThreadReply)

        alertSaveSuccess()
    }

    return (
        <div data-testid="notifications-menu-container"
            className="bg-zinc-900 text-white h-full p-6 flex-auto w-3/4">
            <h2 className="text-2xl mb-3 ml-4">Manage Notifications</h2>
            <div className="min-w-max w-[850px] border-2 border-light-gray rounded p-4 pr-8">
                <EmailSetting
                    label="Email me when there is activity in a thread I'm watching"
                    status={ threadActivity }
                    dStatus={ dThreadActivity }
                    handleChange={ () => setDThreadActivity(!dThreadActivity) } />
                <EmailSetting
                    label="Email me when someone replies to my thread"
                    status={ threadReply }
                    dStatus={ dThreadReply }
                    handleChange={ () => setDThreadReply(!dThreadReply) } />
                <EmailSetting
                    label="Email me when someone replies to my comment"
                    status={ commentReply }
                    dStatus={ dCommentReply }
                    handleChange={ () => setDCommentReply(!dCommentReply) } />
                <EmailSetting
                    label="Email me when someone mentions me"
                    status={ mention }
                    dStatus={ dMention }
                    handleChange={ () => setDMention(!dMention) } />
                <button onClick={ handleSave }
                    className="border border-white rounded bg-purple py-3 w-full
                        mt-6 hover:bg-violet-800">
                    Save
                </button>
                { showSavedAlert && <span>Saved!</span>}
                { showSaveFailedAlert && 
                <span> Couldn't save your settings. Please check your connection. </span>}
            </div>
        </div>
    )
}

export default NotificationsMenu