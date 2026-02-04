DROP TABLE iF EXISTS "jiajunleeWeb"."example";
DROP TABLE iF EXISTS "jiajunleeWeb"."user";

CREATE TABLE "jiajunleeWeb"."user" (
    user_uid UUID NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    user_created_dt TIMESTAMP NOT NULL,
    user_updated_dt TIMESTAMP NOT NULL,
    user_updated_by UUID NULL,

    CONSTRAINT pk_user_uid PRIMARY KEY (user_uid),
    CONSTRAINT fk_user_updated_by FOREIGN KEY (user_updated_by)
        REFERENCES "jiajunleeWeb"."user"(user_uid)
)

CREATE TABLE "jiajunleeWeb"."example" (
    example_uid UUID NOT NULL,
    example VARCHAR(100) NOT NULL,
    example_created_dt TIMESTAMP NOT NULL,
    example_updated_dt TIMESTAMP NOT NULL,
    example_updated_by UUID NOT NULL,

    CONSTRAINT pk_example_uid PRIMARY KEY (example_uid),
    CONSTRAINT fk_example_updated_by FOREIGN KEY (example_updated_by)
        REFERENCES "jiajunleeWeb"."user"(user_uid)
        ON UPDATE CASCADE
        ON DELETE NO ACTION
)