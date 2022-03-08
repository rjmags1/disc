import { useEffect, useState } from 'react'

import EmailSetting from './EmailSetting'

function NotificationsMenu() {
    const [watchedThreadActivity, setWatchedThreadActivity] = useState(false)
    const [myThreadReply, setMyThreadReply] = useState(false)
    const [myCommentReply, setMyCommentReply] = useState(false)
    const [mention, setMention] = useState(false)
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

        setWatchedThreadActivity(watchedThreadActivity)
        setMyThreadReply(myThreadReply)
        setMyCommentReply(myCommentReply)
        setMention(mention)
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

        // if api call failed alertSaveFailed()
        alertSaveSuccess()
    }

    return (
        <div data-testid="notifications-menu-container"
            className="bg-zinc-900 text-white h-full p-6 flex-auto w-3/4">
            <h2 className="text-2xl mb-3 ml-4">Manage Notifications</h2>
            <div className="min-w-max w-[700px] border-2 border-light-gray rounded p-4 pr-8">
                <EmailSetting
                    label="Email me when there is activity in a thread I'm watching"
                    status={ watchedThreadActivity } 
                    handleChange={ () => setWatchedThreadActivity(!watchedThreadActivity) } />
                <EmailSetting
                    label="Email me when someone replies to my thread"
                    status={ myThreadReply } 
                    handleChange={ () => setMyThreadReply(!myThreadReply) } />
                <EmailSetting
                    label="Email me when someone replies to my comment"
                    status={ myCommentReply } 
                    handleChange={ () => setMyCommentReply(!myCommentReply) } />
                <EmailSetting
                    label="Email me when someone mentions me"
                    status={ mention } 
                    handleChange={ () => setMention(!mention) } />
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