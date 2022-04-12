import { useEffect, useState } from 'react'
import { useNotificationSettings, useUser } from '../../../lib/hooks'

import ButtonLoading from '../../lib/ButtonLoading'
import Loading from '../../../components/lib/Loading'
import EmailSetting from './EmailSetting'

function NotificationsMenu() {
    const [watch, setWatch] = useState(false)
    const [myPostActivity, setMyPostActivity] = useState(false)
    const [commentReply, setCommentReply] = useState(false)
    const [mention, setMention] = useState(false)

    const [displayedWatch, setDisplayedWatch] = useState(false)
    const [displayedMyPostActivity, setDisplayedMyPostActivity] = useState(false)
    const [displayedCommentReply, setDisplayedCommentReply] = useState(false)
    const [displayedMention, setDisplayedMention] = useState(false)

    const [showSavedAlert, setShowSavedAlert] = useState(false)
    const [showSaveFailedAlert, setSaveFailedAlert] = useState(false)
    const [saving, setSaving] = useState(false)

    const { 
        user, 
        loading: loadingUser 
    } = useUser({ redirectTo: '/login' })

    const { 
        notificationSettings,
        mutateNotificationSettings,
        loading: loadingNotificationSettings
    } = useNotificationSettings(user?.user_id)


    useEffect(() => {
        if (!notificationSettings) return

        const {
            settingStatuses: {
                comment_reply_email_setting: replyStatus,
                mention_email_setting: mentionStatus,
                post_activity_email_setting: myPostActivityStatus,
                watch_email_setting: watchStatus
            }
        } = notificationSettings
        setWatch(watchStatus)
        setDisplayedWatch(watchStatus)
        setMyPostActivity(myPostActivityStatus)
        setDisplayedMyPostActivity(myPostActivityStatus)
        setCommentReply(replyStatus)
        setDisplayedCommentReply(replyStatus)
        setMention(mentionStatus)
        setDisplayedMention(mentionStatus)
    }, [notificationSettings])


    const alertSaveSuccess = function() {
        setShowSavedAlert(true)
        setTimeout(() => setShowSavedAlert(false), 2 * 1000)
    }

    const alertSaveFailed = function() {
        setSaveFailedAlert(true)
        setTimeout(() => setSaveFailedAlert(false), 2 * 1000)
    }

    const handleSave = async function() {
        if (loadingNotificationSettings || loadingUser) return

        const newSettings = {
            comment_reply_email_setting: displayedCommentReply,
            mention_email_setting: displayedMention,
            post_activity_email_setting: displayedMyPostActivity,
            watch_email_setting: displayedWatch
        }
        const updateUrl = '/api/settings/email/notifications/update'

        setSaving(true)
        try {
            const resp = await fetch(updateUrl, {
                method: 'PUT',
                headers: { "Content-Type" : "application/json" },
                body: JSON.stringify({ newSettings })
            })
            if (!resp.ok) alertSaveFailed()
            else {
                alertSaveSuccess()
                mutateNotificationSettings()
            }
        }
        catch (error) {
            alertSaveFailed()
            console.error(error.message)
        }
        finally {
            setSaving(false)
        }
    }


    const watchActivityMsg = `
        Email me when there is activity in a thread I'm watching`
    const myPostActivityMsg = `
        Email me when someone replies to my thread`
    const myCommentReplyMsg = `
        Email me when someone replies to my comment`
    const mentionMsg = `
        Email me when someone mentions me`
    const couldntSaveMsg = `
        Couldn't save your settings. Please check your connection.`
    const normalButtonStyles = `border border-white rounded bg-purple 
        py-3 w-full mt-6 hover:bg-violet-800`
    const savingButtonStyles = `border border-white rounded bg-purple 
        py-3 w-full mt-6 hover:cursor-not-allowed
        flex flex-row items-center justify-center`

    if (loadingNotificationSettings || loadingUser) return <Loading />
    return (
        <div data-testid="notifications-menu-container"
            className="bg-zinc-900 text-white h-full p-6 flex-auto w-3/4">
            <h2 className="text-2xl mb-3 ml-4">Manage Notifications</h2>
            <div className="min-w-max w-[850px] border-2 
                border-light-gray rounded p-4 pr-8">
                <EmailSetting label={ watchActivityMsg }
                    status={ watch } dStatus={ displayedWatch }
                    handleChange={ () => 
                        setDisplayedWatch(!displayedWatch) } />
                <EmailSetting label={ myPostActivityMsg }
                    status={ myPostActivity }
                    dStatus={ displayedMyPostActivity }
                    handleChange={ () => 
                        setDisplayedMyPostActivity(
                            !displayedMyPostActivity) } />
                <EmailSetting label={ myCommentReplyMsg }
                    status={ commentReply } dStatus={ displayedCommentReply }
                    handleChange={ () => 
                        setDisplayedCommentReply(!displayedCommentReply) } />
                <EmailSetting label={ mentionMsg }
                    status={ mention } dStatus={ displayedMention }
                    handleChange={ () => 
                        setDisplayedMention(!displayedMention) } />
                <button onClick={ handleSave }
                    disabled={ saving ? true : "" }
                    className={ saving ? 
                        savingButtonStyles : normalButtonStyles} >
                    { saving ? "Saving..." : "Save" }
                    { saving && <ButtonLoading /> }
                </button>
                { showSavedAlert && <span>Saved!</span> }
                { showSaveFailedAlert && 
                <span> { couldntSaveMsg } </span> }
            </div>
        </div>
    )
}

export default NotificationsMenu