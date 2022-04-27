CREATE TABLE orgs (
    org_id SERIAL PRIMARY KEY,
    name varchar(60) UNIQUE NOT NULL
);
INSERT INTO orgs (name) VALUES ('Hogwarts');





CREATE TABLE avatar_url (
    avatar_url_id SERIAL PRIMARY KEY,
    avatar_url varchar(2048) NOT NULL
);
INSERT INTO avatar_url (avatar_url) VALUES ('/cool-profile-img.jpg');
CREATE TABLE person (
    user_id SERIAL PRIMARY KEY,
    avatar_url integer REFERENCES avatar_url (avatar_url_id) DEFAULT 1,
    f_name varchar(20) NOT NULL,
    l_name varchar(20) NOT NULL,
    is_admin boolean DEFAULT FALSE,
    is_staff boolean DEFAULT FALSE,
    is_instructor boolean DEFAULT FALSE,
    password_hash varchar(60) NOT NULL
);
CREATE TABLE email (
    email_id SERIAL PRIMARY KEY,
    person integer REFERENCES person (user_id) DEFAULT NULL,
    email varchar(320) NOT NULL UNIQUE
);
ALTER TABLE person
    ADD COLUMN primary_email integer REFERENCES email (email_id) NOT NULL;
ALTER TABLE person
    ADD CONSTRAINT no_shared_primary_email UNIQUE (user_id, primary_email);

CREATE INDEX person_lookup_by_user_id ON person (user_id);
CREATE INDEX person_lookup_by_primary_email ON person (primary_email);
CREATE INDEX email_lookup_by_person ON email (person);
CREATE INDEX email_lookup_by_email ON email (email);





CREATE TABLE term (
    term_id SERIAL PRIMARY KEY,
    year integer NOT NULL,
    name varchar(20) NOT NULL,
    UNIQUE (year, name)
);
CREATE TABLE course (
    course_id SERIAL PRIMARY KEY,
    term integer REFERENCES term (term_id) NOT NULL,
    name varchar(60) NOT NULL,
    code varchar(10) NOT NULL,
    section integer DEFAULT 1,
    UNIQUE (code, section, term)
);
CREATE TABLE person_course (
    enrollment_id SERIAL PRIMARY KEY,
    person integer REFERENCES person (user_id) NOT NULL,
    course integer REFERENCES course (course_id) NOT NULL,
    is_instructor boolean DEFAULT FALSE,
    is_staff boolean DEFAULT FALSE,
    UNIQUE (person, course),
    CHECK (NOT (is_staff = TRUE AND is_instructor = TRUE))
);
CREATE INDEX course_lookup_by_code ON course (code);
CREATE INDEX course_lookup_by_term ON course (term);
CREATE INDEX enrollment_lookup_by_person ON person_course (person);
CREATE INDEX enrollment_lookup_by_course ON person_course (course);





CREATE TABLE post_category (
    category_id SERIAL PRIMARY KEY,
    course integer REFERENCES course (course_id) NOT NULL,
    name varchar(20) NOT NULL,
    UNIQUE (course, name)
);
CREATE TABLE post (
    post_id SERIAL PRIMARY KEY,
    category integer REFERENCES post_category (category_id) NOT NULL,
    author integer REFERENCES person (user_id) NOT NULL,
    created_at timestamp NOT NULL,
    title varchar(100) NOT NULL,
    edit_content jsonb NOT NULL,
    display_content text NOT NULL,
    pinned boolean DEFAULT FALSE,
    endorsed boolean DEFAULT FALSE,
    is_question boolean DEFAULT FALSE,
    is_announcement boolean DEFAULT FALSE,
    answered boolean DEFAULT FALSE,
    resolved boolean DEFAULT FALSE,
    private boolean DEFAULT FALSE,
    deleted boolean DEFAULT FALSE,
    anonymous boolean DEFAULT FALSE,
    CHECK (NOT (resolved = TRUE AND is_question = TRUE)),
    CHECK (NOT (answered = TRUE AND is_question = FALSE)),
    CHECK (NOT (endorsed = TRUE AND private = TRUE)),
    CHECK (NOT (pinned = TRUE AND private = TRUE))
);
CREATE INDEX category_lookup_by_course ON post_category (course);
CREATE INDEX post_lookup_by_post_id ON post (post_id);
CREATE INDEX post_lookup_by_category ON post (category);
CREATE INDEX post_lookup_by_author ON post (author);
CREATE INDEX post_lookup_by_deleted ON post (deleted);
CREATE INDEX post_lookup_by_pinned ON post (pinned);





CREATE TABLE comment (
    comment_id SERIAL PRIMARY KEY,
    author integer REFERENCES person (user_id) NOT NULL,
    post integer REFERENCES post (post_id) NOT NULL,
    parent_comment integer REFERENCES comment (comment_id) DEFAULT NULL,
    edit_content jsonb NOT NULL,
    display_content text NOT NULL,
    created_at timestamp NOT NULL,
    is_resolving boolean DEFAULT FALSE,
    is_answer boolean DEFAULT FALSE,
    endorsed boolean DEFAULT FALSE,
    deleted boolean DEFAULT FALSE,
    anonymous boolean DEFAULT FALSE,
    CHECK (NOT (is_resolving = TRUE AND is_answer = TRUE))
);
CREATE INDEX comment_lookup_by_post ON comment (post);
CREATE INDEX comment_lookup_by_deleted ON comment (deleted);





CREATE TABLE notification (
    notification_id SERIAL PRIMARY KEY,
    person integer REFERENCES person (user_id),
    gen_comment integer REFERENCES comment (comment_id) DEFAULT NULL,
    gen_post integer REFERENCES post (post_id) DEFAULT NULL,
    deleted boolean DEFAULT FALSE,
    is_watch_noti boolean DEFAULT FALSE,
    is_user_post_activity_noti boolean DEFAULT FALSE,
    is_user_comment_reply_noti boolean DEFAULT FALSE,
    is_mention_noti boolean DEFAULT FALSE,
    is_announcement_noti boolean DEFAULT FALSE,
    CHECK ( --can only be one kind of notification
        (is_watch_noti::integer) +
        (is_user_post_activity_noti::integer) + 
        (is_user_comment_reply_noti::integer) +
        (is_mention_noti::integer) +
        (is_announcement_noti::integer) = 1
    ),
    CHECK ( --can only be generated by a comment or a post
        (gen_comment != NULL OR gen_post != NULL) AND
        (NOT (gen_comment != NULL AND gen_post != NULL))
    ),
    CHECK (NOT (is_watch_noti = TRUE AND gen_comment = NULL)),
    CHECK (NOT (is_user_post_activity_noti = TRUE AND gen_comment = NULL)),
    CHECK (NOT (is_user_comment_reply_noti = TRUE AND gen_comment = NULL)),
    CHECK (NOT (is_announcement_noti = TRUE AND gen_post = NULL))
);
CREATE INDEX notification_lookup_by_person ON notification (person);
CREATE INDEX notification_lookup_by_deleted ON notification (deleted);





CREATE TABLE post_watch (
    watch_id SERIAL PRIMARY KEY,
    watcher integer REFERENCES person (user_id) NOT NULL,
    post integer REFERENCES post (post_id) NOT NULL,
    UNIQUE (watcher, post)
);
CREATE INDEX watch_lookup_by_watcher ON post_watch (watcher);
CREATE INDEX watch_lookup_by_watched ON post_watch (post);





CREATE TABLE comment_like (
    comment_like_id SERIAL PRIMARY KEY,
    comment integer REFERENCES comment (comment_id) NOT NULL,
    liker integer REFERENCES person (user_id) NOT NULL,
    UNIQUE (comment, liker)
);
CREATE INDEX comment_like_lookup_by_comment ON comment_like (comment);
CREATE INDEX comment_like_lookup_by_liker ON comment_like (liker);





CREATE TABLE post_like (
    comment_like_id SERIAL PRIMARY KEY,
    post integer REFERENCES post (post_id) NOT NULL,
    liker integer REFERENCES person (user_id) NOT NULL,
    UNIQUE (post, liker)
);
CREATE INDEX post_like_lookup_by_post ON post_like (post);
CREATE INDEX post_like_lookup_by_liker ON post_like (liker);





CREATE TABLE post_star (
    star_id SERIAL PRIMARY KEY,
    starrer integer REFERENCES person (user_id) NOT NULL,
    post integer REFERENCES post (post_id) NOT NULL,
    UNIQUE (starrer, post)
);
CREATE INDEX post_star_lookup_by_starrer ON post_star (starrer);
CREATE INDEX post_star_lookup_by_post ON post_star (post);





CREATE TABLE post_view (
    post_view_id SERIAL PRIMARY KEY,
    post integer REFERENCES post (post_id) NOT NULL,
    viewer integer REFERENCES person (user_id) NOT NULL,
    viewed_at timestamp NOT NULL,
    UNIQUE (post, viewer)
);
CREATE INDEX post_view_lookup_by_post ON post_view (post);
CREATE INDEX post_view_lookup_by_viewer ON post_view (viewer);





CREATE TABLE mention (
    mention_id SERIAL PRIMARY KEY,
    mentioned integer REFERENCES person (user_id) NOT NULL,
    comment integer REFERENCES comment (comment_id) DEFAULT NULL,
    post integer REFERENCES post (post_id) DEFAULT NULL,
    deleted boolean DEFAULT FALSE,
    UNIQUE (mentioned, comment, post),
    CHECK (
        (comment != NULL OR post != NULL) AND
        (NOT (comment != NULL AND post != NULL))
    )
);
CREATE INDEX mention_lookup_by_mentioned ON mention (mentioned);
CREATE INDEX mention_lookup_by_deleted ON mention (deleted);





CREATE TABLE comment_reply_email_setting (
    setting_id SERIAL PRIMARY KEY,
    person integer REFERENCES person (user_id) NOT NULL,
    is_on boolean DEFAULT FALSE,
    UNIQUE(setting_id, person)
);
CREATE INDEX comment_reply_email_setting_lookup_by_person ON comment_reply_email_setting (person);





CREATE TABLE watch_email_setting (
    setting_id SERIAL PRIMARY KEY,
    person integer REFERENCES person (user_id) NOT NULL,
    is_on boolean DEFAULT TRUE,
    UNIQUE(setting_id, person)
);
CREATE INDEX watch_email_setting_lookup_by_person ON watch_email_setting (person);





CREATE TABLE mention_email_setting (
    setting_id SERIAL PRIMARY KEY,
    person integer REFERENCES person (user_id) NOT NULL,
    is_on boolean DEFAULT TRUE,
    UNIQUE(setting_id, person)
);
CREATE INDEX mention_email_setting_lookup_by_person ON mention_email_setting (person);





CREATE TABLE post_activity_email_setting (
    setting_id SERIAL PRIMARY KEY,
    person integer REFERENCES person (user_id) NOT NULL,
    is_on boolean DEFAULT FALSE,
    UNIQUE(setting_id, person)
);
CREATE INDEX post_activity_email_setting_lookup_by_person ON post_activity_email_setting (person);