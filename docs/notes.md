# Notes

## Intro
This project is a clone of an academic discussion board web application, Ed, 
that I used while taking CS classes at Oregon State. I named it 'disc',
short for 'discussion.'


## Framework
It was built with NextJS (https://nextjs.org), 
a fullstack web framework that simplifies the process of building
a complete React web app from an empty project directory. Among other things,
it provides users smart code splitting via Webpack and a simple routing system 
built on Node that serves webviews as React 'pages' and REST API endpoints. 
It also provides an excellent developer experience thanks
to its Fast Refresh HMR component editing feedback mechanism. Going with 
NextJS was a no-brainer due to all of the React problems it solves
out of the box, and I have been quite pleased by how snappy
the app feels with minimal configuration on my part. Note that since this
app wouldn't require SEO as its content is only available
to registered students and staff, all data is fetched client side (never
saw a need to use of SSR/getServerSideProps).


## Security

### Authentication
Password based authentication was implemented by storing salted, hashed
passwords in a database. In basic terms, hashing is necessary to avoid storing plaintext 
passwords in the database (bad for obvious reasons), and salting helps prevent 
rainbow table attacks (reverse hash lookups) by adding dummy text next to the actual hash.
Bcrypt greatly streamlined this implementation, enabling me to securely hash and salt
plaintext passwords in one library call, as well as check a plaintext password against
a salted password hash in one library call.

### Sessions
Stateless sessions were implemented using iron-session,
a Node utility that stores session data in a signed and encrypted cookie.
All NextJS 'pages' (besides login) auth-guard by determining if there is a 
non-expired session cookie present before rendering their contents.

### User-Generated Rich-Text Content Sanitization
Since this is a school discussion board app, it involves user-generated
rich-text data, and so it was critical to sanitize this user input beyond
the base safeguards that modern frameworks like React provide. 
I did so using the DOMPurify sanitize method per OWASP cheatsheet recommendations 
(https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#html-sanitization). 
The rich text editor itself was implemented using Quilljs, which is utilized by 
LinkedIn and Slack (https://quilljs.com).


## Database
I chose to use PostgresQL for data persistence, with which 
api endpoints interact directly via SQL queries and the node-postgres  
package (npm install pg). I chose to forego the use of an ORM to 
improve my SQL skills (this is a personal project after all). 


## Testing
For testing, I initially planned on using Jest/React Testing Library 
for unit tests in addition to playwright for end to end testing.
As I progressed in the project I got the sense that a lot of my
unit tests were not adding value commensurate with the time I spent
writing them, and so I decided it would be OK to write just e2e tests, 
especially given the number of features I wanted to implement.


## Template data
I generated template data for development and testing using a combination of
Faker.js library calls and data from the Oregon State CS department website.
In the db folder of the project, you can see the scripts used for generating
template data and inserting it into the database.


## Other notes
- Overall I tried to keep use of external dependencies to a minimum. 
    At this time, there are only 7 dev dependencies for the project
    and 11 build dependencies.
- I used Tailwind CSS and inline classes for frontend styling because
    I like the idea of having all implementation details for a given
    component in the same file. The NextJS support for Tailwind made its 
    integration into the project very simple. I decided to forego the use 
    of prebuilt components (MUI etc.) to improve my CSS skills and limit dependencies.
- I used Nodemailer to implement email based login and email
    notifications. Folks running the project locally
    will have to plug in their own AWS SES account in the .env.local
    file or alter source to include their own alternate email provider
    details if they want to tinker with any email functionality.
- I chose to use the SWR data fetching library to add an extra caching layer 
    on the client and perform api requests with data hooks. This library 
    improved the snappiness of the application and optimized my api calls. 
    Data hooks not only feel like the React way to perform network requests,
    but querying my REST endpoints in this way really helped cut down on the number
    of lines of code in my component files.