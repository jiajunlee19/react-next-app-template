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

CREATE TABLE "jiajunleeWeb"."widget" (
    widget_uid UNIQUEIDENTIFIER NOT NULL,
    widget_name VARCHAR(100) NOT NULL,
    widget_description VARCHAR(100) NOT NULL,
    widget_group VARCHAR(100) NOT NULL,
    widget_href VARCHAR(100) NOT NULL,
    widget_tabs NVARCHAR(MAX),
    widget_owners TEXT,
    widget_viewers TEXT,
    widget_created_dt DATETIME NOT NULL,
    widget_updated_dt DATETIME NOT NULL,
    widget_updated_by UNIQUEIDENTIFIER NOT NULL,

    CONSTRAINT pk_widget_uid PRIMARY KEY (widget_uid),
    CONSTRAINT fk_widget_updated_by FOREIGN KEY (widget_updated_by)
        REFERENCES "jiajunleeWeb"."user"(user_uid)
        ON UPDATE CASCADE
        ON DELETE NO ACTION,
    CONSTRAINT chk_widget_tabs CHECK (ISJSON(widget_tabs) = 1 OR widget_tabs IS NULL)
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