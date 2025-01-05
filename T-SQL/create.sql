DROP TABLE iF EXISTS "template"."user";

CREATE TABLE "template"."user" (
    user_uid UNIQUEIDENTIFIER NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    user_created_dt DATETIME NOT NULL,
    user_updated_dt DATETIME NOT NULL,

    CONSTRAINT pk_user_uid PRIMARY KEY CLUSTERED (user_uid)
)

CREATE TABLE "template"."type" (
    type_uid UNIQUEIDENTIFIER NOT NULL,
    type VARCHAR(50) NOT NULL,
    type_created_dt DATETIME NOT NULL,
    type_updated_dt DATETIME NOT NULL,

    CONSTRAINT pk_type_uid PRIMARY KEY CLUSTERED (type_uid)
);