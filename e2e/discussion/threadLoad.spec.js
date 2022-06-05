const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const {
    TEST_POST_INFO, 
    getAllDbTopLevelThreadCommentsDisplayOrder, 
    lazyLoadAllTopLevelPageComments,
    getDbAncestorsLte2Replies,
    stripTagsNewLine,
    getDbAncestorsGt2Replies,
    getAllAncestorReplyCounts,
    getDbAllReplies
} = require('../lib/post')

test.beforeEach(async ({ page, isMobile }) => {
    await login(page, TESTUSER_REGISTERED)

    await expect(page.locator('nav').
        locator('text=/dashboard/i')).toBeVisible()

    const { term, code, section, name: testCourseName } = TEST_COURSE_INFO
    await Promise.all([
        page.locator(`text=/^${ testCourseName }$/i`).click(),
        page.waitForSelector(`text=/${ testCourseName } - ${ term }/i`)
    ])

    const title = await page.title()
    expect(title).toMatch(new RegExp(
        `${ term } ${ code }-${ section } - Discussion`, "i"))
    
    
    if (!isMobile) await expect(
        page.locator("[data-testid=no-post-selected-icon]")).toBeVisible()

    await Promise.all([
        page.locator(
            `#post-info-container-${ TEST_POST_INFO.id }`).click(),
        expect(page.locator(
            "[data-testid=no-post-selected-icon]")).not.toBeVisible(),
        expect(page.locator(
            "[data-testid=thread-container]").nth(0)).toBeVisible()
    ])
})

test.describe('top level thread comment loading', async () => {
    test.setTimeout(120000)

    test('all top level thread comments loaded in correct order', 
    async ({ page, browserName }) => {
        const dbTopLevelComments = (
            await getAllDbTopLevelThreadCommentsDisplayOrder(TEST_POST_INFO.id))

        const numTopLevelPageComments = (
            await lazyLoadAllTopLevelPageComments(page))
    
        expect(dbTopLevelComments.length).toBe(numTopLevelPageComments)

        const commentLocator = page.locator('[data-testid=comment-container]')
        for (let i = 0; i < numTopLevelPageComments; i++) {
            let pageComment = await commentLocator.nth(i).innerText()
            const dbInfo = dbTopLevelComments[i]
            const dbComment = dbInfo.deleted ? 'deleted' : dbInfo.display_content
            if (browserName === 'webkit' &&  // account for safari newline insertion
                dbComment.indexOf('\n', dbComment.length - 1) === -1 &&
                pageComment.indexOf('\n', pageComment.length - 1) !== -1) {
                pageComment = pageComment.slice(0, pageComment.length - 1)
            }

            const match = new RegExp(pageComment).test(dbComment)
            expect(match).toBe(true)
        }
    })

    test('no view more button for threads with <= 3 comments', 
    async ({ page }) => {
        await lazyLoadAllTopLevelPageComments(page)

        const dbLte2Replies = await getDbAncestorsLte2Replies()
    
        for (const noViewMoreAncestorComment of dbLte2Replies) {
            const { display_content, deleted } = noViewMoreAncestorComment
             if (deleted) continue
            const pageSearchDisplayContent = stripTagsNewLine(display_content)
            const noViewMoreThreadContainerLocator = page.locator(
                '[data-testid=thread-container]', { 
                    hasText: pageSearchDisplayContent 
                })
            
            const viewMoreBtnPresent = (
                await noViewMoreThreadContainerLocator.locator(
                    '[data-testid=view-more-replies-btn]').count() > 0)

            expect(viewMoreBtnPresent).toBe(false)
        }
    })

    test('view more button present for threads with > 3 comments',
    async ({ page }) => {
        await lazyLoadAllTopLevelPageComments(page)

        const dbGt2Replies = await getDbAncestorsGt2Replies()
        
        for (const viewMoreAncestorComment of dbGt2Replies) {
            const { display_content, deleted } = viewMoreAncestorComment
            if (deleted) continue
            const pageSearchDisplayContent = stripTagsNewLine(display_content)
            const viewMoreThreadContainerLocator = page.locator(
                '[data-testid=thread-container]', { 
                    hasText: pageSearchDisplayContent 
                })
            
            const viewMoreBtnPresent = (
                await viewMoreThreadContainerLocator.locator(
                    '[data-testid=view-more-replies-btn]').count() > 0)

            if (!viewMoreBtnPresent) {
                console.log(display_content, pageSearchDisplayContent)
                const asdf = await viewMoreThreadContainerLocator.count()
                console.log(asdf)
                console.log(viewMoreAncestorComment)
            }
            expect(viewMoreBtnPresent).toBe(true)
        }
    })

    test('view more click reliably loads more comments', async ({ page }) => {
        await lazyLoadAllTopLevelPageComments(page)
        const dbGt2Replies = await getDbAncestorsGt2Replies()
        
        let testedThreads = 0
        for (const ancestorInfo of dbGt2Replies) {
            if (ancestorInfo.deleted || Math.random() > 0.50) continue
            if (++testedThreads > 15) break

            const {
                comment_id: ancestor_id,
                display_content: ancestor_display_content,
                replies
            } = ancestorInfo
            const dbReplies = await getDbAllReplies(ancestor_id)
            
            const threadContainerLocator = page.locator(
                '[data-testid=thread-container]', {
                    hasText: stripTagsNewLine(ancestor_display_content)
                })
                
            const viewMoreLocator = threadContainerLocator.locator(
                '[data-testid=view-more-replies-btn]')
            const commentBoxLocator = threadContainerLocator.locator(
                "[data-testid=comment-box-container]")
            await expect(viewMoreLocator).toBeVisible()
            let loading = true
            let loadedComments = 3
            while (loading) {
                await viewMoreLocator.click()
                let newLoaded = await commentBoxLocator.count()
                while (newLoaded === loadedComments) {
                    newLoaded = await commentBoxLocator.count()
                }
                loadedComments = newLoaded
                loading = loadedComments !== replies + 1
            }
            
            expect(loadedComments).toBe(replies + 1)

            for (let i = 1; i < loadedComments; i++) {
                const pageComment = await commentBoxLocator.nth(i).locator(
                    "[data-testid=comment-container]").innerText()
                const dbComment = dbReplies[i - 1].display_content
                const match = new RegExp(pageComment).test(dbComment)
                expect(match).toBe(true)
            }

        }
    })
})