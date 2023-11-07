DROP TABLE iF EXISTS "packing"."user";
DROP TABLE IF EXISTS "packing"."shipdoc";
DROP TABLE IF EXISTS "packing"."lot";
DROP TABLE IF EXISTS "packing"."tray";
DROP TABLE IF EXISTS "packing"."box";
DROP TABLE IF EXISTS "packing"."tray_type";
DROP TABLE IF EXISTS "packing"."box_type";


CREATE TABLE "packing"."box_type" (
    box_type_uid UNIQUEIDENTIFIER NOT NULL,
    box_part_number VARCHAR(50) NOT NULL,
    box_max_tray INT NOT NULL,
    box_type_createdAt DATETIME NOT NULL,
    box_type_updatedAt DATETIME NOT NULL,

    CONSTRAINT pk_box_type_uid PRIMARY KEY CLUSTERED (box_type_uid)
);

CREATE TABLE "packing"."tray_type" (
    tray_type_uid UNIQUEIDENTIFIER NOT NULL,
    tray_part_number VARCHAR(50) NOT NULL,
    tray_max_drive INT NOT NULL,
    tray_type_createdAt DATETIME NOT NULL,
    tray_type_updatedAt DATETIME NOT NULL,

    CONSTRAINT pk_tray_type_uid PRIMARY KEY CLUSTERED (tray_type_uid)
);

CREATE TABLE "packing"."shipdoc" (
    shipdoc_uid UNIQUEIDENTIFIER NOT NULL,
    shipdoc_number INT NOT NULL,
    shipdoc_contact VARCHAR(50) NOT NULL,
    shipdoc_createdAt DATETIME NOT NULL,
    shipdoc_updatedAt DATETIME NOT NULL,

    CONSTRAINT pk_shipdoc_uid PRIMARY KEY CLUSTERED (shipdoc_uid)
);

CREATE TABLE "packing"."box" (
    box_uid UNIQUEIDENTIFIER NOT NULL,
    box_type_uid UNIQUEIDENTIFIER NOT NULL,
    shipdoc_uid UNIQUEIDENTIFIER NOT NULL,
    box_status VARCHAR(50) NOT NULL,
    box_createdAt DATETIME NOT NULL,
    box_updatedAt DATETIME NOT NULL,

    CONSTRAINT pk_box_uid PRIMARY KEY CLUSTERED (box_uid),
    CONSTRAINT fk_box_type_uid FOREIGN KEY (box_type_uid)
        REFERENCES "packing"."box_type" (box_type_uid)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
    CONSTRAINT fk_shipdoc_uid FOREIGN KEY (shipdoc_uid)
        REFERENCES "packing"."shipdoc" (shipdoc_uid)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

CREATE TABLE "packing"."tray" (
    tray_uid UNIQUEIDENTIFIER NOT NULL,
    box_uid UNIQUEIDENTIFIER NOT NULL,
    tray_type_uid UNIQUEIDENTIFIER NOT NULL,
    tray_createdAt DATETIME NOT NULL,
    tray_updatedAt DATETIME NOT NULL,

    CONSTRAINT pk_tray_uid PRIMARY KEY CLUSTERED (tray_uid),
    CONSTRAINT fk_box_uid FOREIGN KEY (box_uid)
        REFERENCES "packing"."box" (box_uid)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    CONSTRAINT fk_tray_type_uid FOREIGN KEY (tray_type_uid)
        REFERENCES "packing"."tray_type" (tray_type_uid)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

CREATE TABLE "packing"."lot" (
    lot_uid UNIQUEIDENTIFIER NOT NULL,
    tray_uid UNIQUEIDENTIFIER NOT NULL,
    lot_id VARCHAR(50) NOT NULL,
    lot_qty INT NOT NULL,
    lot_createdAt DATETIME NOT NULL,
    lot_updatedAt DATETIME NOT NULL,

    CONSTRAINT pk_lot_uid PRIMARY KEY CLUSTERED (lot_uid),
    CONSTRAINT fk_tray_uid FOREIGN KEY (tray_uid)
        REFERENCES "packing"."tray" (tray_uid)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
);

CREATE TABLE "packing"."user" (
    user_uid UNIQUEIDENTIFIER NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    user_createdAt DATETIME NOT NULL,
    user_updatedAt DATETIME NOT NULL
)