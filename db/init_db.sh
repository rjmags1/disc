#!/bin/zsh
psql -U postgres -d disc -b -w -f ./ddl.dump.sql

node genPersonEmail.js
node notificationSettings.js
# uncomment below if first time running on a particular machine
# python3 genCourseTermSqlScript.py
psql -U postgres -d disc -b -w -f ./dml.sample.term.sql
psql -U postgres -d disc -b -w -f ./dml.sample.course.sql
node enroll.js
node postCategory.js
node posts.js
node comment.js