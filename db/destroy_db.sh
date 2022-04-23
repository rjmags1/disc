#!/bin/zsh
psql -U postgres -d disc -b -w -f ./ddl.drop.sql