CREATE DATABASE devlinks;

CREATE TABLE link (
    id VARCHAR(255) PRIMARY KEY,
    user_email VARCHAR(255),
    title VARCHAR(50),
    link VARCHAR(150),
    color VARCHAR(50),
    text_color VARCHAR(50)
);

CREATE TABLE profile (
    id VARCHAR(255) PRIMARY KEY,
    user_email VARCHAR(255),
    name VARCHAR(50),
    surname VARCHAR(50),
    new_email VARCHAR(255)
);

CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    hashed_password VARCHAR(255)

);
CREATE TABLE photos (
  user_email VARCHAR(255),
  path VARCHAR(255) NOT NULL
);