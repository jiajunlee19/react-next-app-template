DROP TABLE iF EXISTS "jiajunleeWeb"."user";

CREATE TABLE "jiajunleeWeb"."user" (
    user_uid UNIQUEIDENTIFIER NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    user_created_dt DATETIME NOT NULL,
    user_updated_dt DATETIME NOT NULL,

    CONSTRAINT pk_user_uid PRIMARY KEY CLUSTERED (user_uid)
)