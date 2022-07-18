# disc
Clone of popular school discussion board application, ed. See the
docs folder for a list of features, implementation notes, and the
database schema.



## Video demo
https://youtu.be/wQ6hk__xTK0



## Run it locally
1. Clone the project onto your machine using:
```git clone https://github.com/rjmags1/disc.git``` . 



2. Make sure you have Node, PostgresQL and the psql client installed on your 
machine. If you don't have Node, visit https://nodejs.org/en/download/ to download the appropriate installer. If you don't have Postgres or the psql client, visit https://www.postgresql.org/download/ and download the appropriate installer. The latter installer will install both PostgresQL and the psql client for you. You can check for successful downloads and installations by running 
`node -v`, `psql -V`, and `postgres -V`.
If you are familiar with Docker you may prefer to setup a Postgres instance in a Docker container.  



3. Create an empty Postgres database named 'disc'. 
    - If this is your first time working with postgres, or you went the Docker route and are running a fresh Postgres container, you can sign into the default user account by running 
    ```psql -U postgres```
    and entering the default password, 'postgres'. 
    - Once logged into the psql client,
    you can create the database for disc with the SQL command:
    ```CREATE DATABASE disc;``` . 



4. Setup the .env.local file for running disc on your localhost in the root of your cloned project. It should
look something like this:
```
PGHOST=localhost
PGUSER=postgres
PGDATABASE=disc
PGPASSWORD=postgres
PGPORT=5432
SECRET_COOKIE_PASSWORD=(random 32 char string)
DOMAIN_URL=http://localhost:3000
ADMIN_F_NAME=(your first name)
ADMIN_L_NAME=(your last name)
ADMIN_EMAIL=(your email)
```
- To use any of the email functionality in disc, you will need to
add any relevant smtp provider environment variables here as well, and alter
transporter details in the sendEmail function in lib/email.js. It will probably
help to consult the nodemailer docs (https://nodemailer.com/smtp/).  



5. If you are on Linux or MacOS, you can fill the empty database you created
with sample data by navigating to the db folder from the root of the project 
and running the init script.
```
cd db
./init_db.sh
```
- Note that I use zsh, if you are using bash or another shell you may need to 
change the shebang at the top of the init_db script. You can remove all sample
data by running the destroy_db script. This is useful in case any unforeseen
errors occur while attempting to get the project running and sample data gen
fails before completing. If you are on Windows, you will need to manually run the Windows equivalent of
all of the commands in the init_db script to populate the database.  



6. If all previous steps went ok, you're ready to fire up the localhost server. Navigate to the root of the project on the command line and run
```npm run dev```.
Visit http://localhost:3000 in your browser and you'll be redirected to the login
page, where you can sign in with the following credentials:
    - Organization: Hogwarts
    - Email: harry-potter@hogwarts.edu
    - Password: harryspassword

    - All other accounts, including 'yours' (the admin account) can be used to sign in
    as well, using the same organization but different emails and passwords. All student emails have the format {firstName}-{lastName}@hogwarts.edu and passwords
    are {firstName}spassword. Instructor emails are just firstName@hogwarts.edu.
    For certain accounts you may need to capitalize the first letter of the password.
    You can take a look at the genPersonEmail script in the db folder if you want
    to see exactly how sample user credentials get created.