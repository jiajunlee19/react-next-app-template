DROP TABLE iF EXISTS "jiajunleeWeb"."example";
DROP TABLE iF EXISTS "jiajunleeWeb"."user";

CREATE TABLE "jiajunleeWeb"."user" (
    user_uid UNIQUEIDENTIFIER NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    user_created_dt DATETIME NOT NULL,
    user_updated_dt DATETIME NOT NULL,
    user_updated_by UNIQUEIDENTIFIER NULL,

    CONSTRAINT pk_user_uid PRIMARY KEY CLUSTERED (user_uid),
    CONSTRAINT fk_user_updated_by FOREIGN KEY (user_updated_by)
        REFERENCES "jiajunleeWeb"."user"(user_uid)
)

CREATE TABLE "jiajunleeWeb"."example" (
    example_uid UNIQUEIDENTIFIER NOT NULL,
    example VARCHAR(100) NOT NULL,
    example_created_dt DATETIME NOT NULL,
    example_updated_dt DATETIME NOT NULL,
    example_updated_by UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT pk_example_uid PRIMARY KEY CLUSTERED (example_uid),
    CONSTRAINT fk_example_updated_by FOREIGN KEY (example_updated_by)
        REFERENCES "jiajunleeWeb"."user"(user_uid)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
)