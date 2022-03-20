CREATE TABLE Person (
    userId SERIAL PRIMARY KEY,
    fname varchar(20) NOT NULL,
    lname varchar(20) NOT NULL,
    email varchar(320) UNIQUE NOT NULL,
    avatarUrl varchar(2048),
    passwordHash varchar(60) NOT NULL
);

INSERT INTO Person (fname, lname, email, avatarUrl, passwordHash) 
    VALUES 
        (
            'testfn1',
            'testln1',
            'test1@test-domain.com',
            'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png',
            '$2b$10$nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa'
        ),
        (
            'testfn2',
            'testln2',
            'test2@test-domain.com',
            'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png',
            '$2b$10$nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa'
        ),
        (
            'testfn3',
            'testln3',
            'test3@test-domain.com',
            'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png',
            '$2b$10$nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa'
        );

CREATE TABLE Orgs (
    orgId SERIAL PRIMARY KEY,
    name varchar(60) NOT NULL
)

INSERT INTO Orgs (name) VALUES 
    (
        "Hogwarts",
        "Northwestern university",
        "Oregon state university"
    );
