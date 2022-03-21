CREATE TABLE Person (
    userId SERIAL PRIMARY KEY,
    fname varchar(20) NOT NULL,
    lname varchar(20) NOT NULL,
    email varchar(320) UNIQUE NOT NULL,
    avatarUrl varchar(2048),
    passwordHash varchar(60) NOT NULL,
    isAdmin boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE Orgs (
    orgId SERIAL PRIMARY KEY,
    name varchar(60) UNIQUE NOT NULL
);

INSERT INTO Orgs (name) VALUES 
    ('Hogwarts'),
    ('Northwestern university'),
    ('Oregon state university');