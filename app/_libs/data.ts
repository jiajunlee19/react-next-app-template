import React from "react";
import { ArchiveBoxXMarkIcon } from "@heroicons/react/24/outline";

export const links = [
  {
    name: "Home",
    hash: "#home",
  },
  {
    name: "About",
    hash: "#about",
  },
  {
    name: "Projects",
    hash: "#projects",
  },
  {
    name: "Skills",
    hash: "#skills",
  },
  {
    name: "Experiences",
    hash: "#experiences",
  },
  {
    name: "Contacts",
    hash: "#contacts",
  },
] as const;

export const experiences = [
  {
    title: "Electrical & Electronic Engineering",
    location: "Universiti Sains Malaysia (USM), Penang, Malaysia",
    description:
      "I graduated as Bachelor Degree of Electrical & Electronic Engineering from USM with a CFGPA grade of 3.96/4.00 after 4 years of study.",
    icon: React.createElement(ArchiveBoxXMarkIcon, { className: "dark:fill-white" }),
    date: "2018 - 2020",
  },
  {
    title: "SSD NPI Engineer",
    location: "Micron Technology, Penang, Malaysia",
    description:
      "I worked as Solid State Drive (SSD) New Product Introduction (NPI) Engineer in Micron for 4 years.",
    icon: React.createElement(ArchiveBoxXMarkIcon, { className: "dark:fill-white" }),
    date: "2020 - 2024",
  },
  {
    title: "Senior SSD NPI Engineer",
    location: "Micron Technology, Penang, Malaysia",
    description:
      "I was promoted into Senior SSD NPI Engineer and currently present working in Micron for more than 4 years.",
    icon: React.createElement(ArchiveBoxXMarkIcon, { className: "dark:fill-white" }),
    date: "2024 - Present",
  },
];

export const skills = [
  "UiPath RPA",
  "Python",
  "SQL",
  "Snowflake",
  "Tableau",
  "PowerBI",
  "React",
  "Next.js",
  "Tailwind",
  "TypeScript",
  "JavaScript",
  "HTML",
  "CSS",
  "Prisma",
  "Docker",
  "Jenkins",
  "Git",
  "JIRA",
  "Confluence",
] as const;

export const projects = [
  {
      title: "react-next-app-template",
      location: "Hobby Project",
      description: "A developer template of react-next-app, with best practices and methods to ease app development, built on top of Next.js by jiajunlee.",
      link: "https://github.com/jiajunlee19/react-next-app-template",
      tags: ["React", "Next.js", "PostgreSQL", "Tailwind", "Prisma", "Docker", "Jenkins"],
      imageUrl: "/react-next-app-template.png",
  },
  {
      title: "PortFolio | Jia Jun Lee",
      location: "Hobby Project",
      description: "A Web Application to show case Jia Jun Lee's Portfolio, built on top of Next.js by jiajunlee.",
      link: "https://react-next-app-jiajunlee.vercel.app/portfolio",
      tags: ["React", "Next.js", "Tailwind"],
      imageUrl: "/portfolio.png",
  },
  {
    title: "Low Temp Solder Paste Enablement and Integration",
    location: "Micron Technology, Penang, Malaysia",
    description: "Develop, qualify and enable Low-Temp Solder Paste (LTS) to be integrated on SSD product. Project details are highly Micron Confidential, the image or link below is for reference only.",
    link: "https://www.optimatech.net/knowledge-center/low-temperature-solder-paste.aspx#:~:text=Tin%2Fbismuth%2C%20tin%2Findium,tin%20%2F%20lead%2037%25%20solder.",
    tags: ["SMT", "Solder Paste", "Characterization", "Reliability"],
    imageUrl: "/Solder Paste.png",
  },
  {
    title: "Script-Automated non-Proto BOM Recipe Creation",
    location: "Micron Technology, Penang, Malaysia",
    description: "Improved SMT Pick & Place recipe preparation time to align with increased NPI Demand Loading, by introducing Script-Automated non-Proto BOM recipe creation. Project details are Micron Confidential, the link below might be access-restricted.",
    link: "https://github.com/jiajunlee19/bom-program-create",
    tags: ["Python", "SQL", "SMT Pick & Place"],
    imageUrl: "/bom-program-create.png",
  },
  {
    title: "Script-Automated SWR Recipe Creation",
    location: "Micron Technology, Penang, Malaysia",
    description: "Improved SMT Pick & Place recipe preparation time to align with increased NPI Demand Loading, by introducing Script-Automated SWR recipe creation. Project details are Micron Confidential, the link below might be access-restricted.",
    link: "https://github.com/jiajunlee19/swr-program-create",
    tags: ["Python", "SQL", "SMT Pick & Place"],
    imageUrl: "/swr-program-create.png",
  },
  {
    title: "Automated Recipe vs BOM Checking Algorithm",
    location: "Micron Technology, Penang, Malaysia",
    description: "Minimized quality events & scrap cost reduction by introducing Automated Recipe vs BOM Checking Algorithm, to ensure components mounted are correct on its corresponding designators. Project details are Micron Confidential, the link below might be access-restricted.",
    link: "https://github.com/jiajunlee19/pnp-program-checker",
    tags: ["Python", "Snowflake", "SMT Pick & Place"],
    imageUrl: "/pnp-program-checker.png",
  },
  {
    title: "RPA Automated BOM Creation",
    location: "Micron Technology, Penang, Malaysia",
    description: "Significantly improve engineering productivity (>56 engineering hrs saved per week) and minimize potential manual execution errors by introducing RPA Automated BOM Creation, developed with UiPath. Project details are Micron Confidential, the link below might be access-restricted.",
    link: "https://github.com/jiajunlee19/hidden_magician/blob/master/PortFolio/Automated%20MAM%20BOM%20Creation/README.md",
    tags: ["Robotic Process Automation", "UiPath", "Snowflake"],
    imageUrl: "/Automated_MAM_BOM_Creation.png",
  },
  {
    title: "Data Ingestion Pipeline Design",
    location: "Micron Technology, Penang, Malaysia",
    description: "Designed Continuous full/incremental data ingestion ETL pipelines, integrated with Snowflake, to ease and automate reporting/analytical purposes.Project details are Micron Confidential, the link below might be access-restricted.",
    link: "https://github.com/jiajunlee19/hidden_magician/blob/master/PortFolio/Continous%20Data%20Ingestion%20Pipeline%20Concept%20and%20Testing/README.md",
    tags: ["Python", "Snowflake"],
    imageUrl: "/Data_Ingestion_Pipeline.png",
  },
  {
    title: "Script-Automated JIRA Issue Creation for Reject Investigation",
    location: "Micron Technology, Penang, Malaysia",
    description: "Smoothen Engineer Investigation Workflow by script automating JIRA issue creation for every drive rejected with details populated, connected to Machine Data for 1st-level story-telling of the issue. Project details are Micron Confidential, the link below might be access-restricted.",
    link: "https://github.com/jiajunlee19/hidden_magician/blob/master/PortFolio/Automated%20JIRA%20Issue%20Creation%20for%20each%20drive%20rejected/README.md",
    tags: ["Python", "JIRA"],
    imageUrl: "/Automated_JIRA_Issue_Creation.png",
  },
  {
    title: "Packing and Shipment Traceability Web App",
    location: "Micron Technology, Penang, Malaysia",
    description: "Developed full-stack web app (MSSQL-React-NextJS) for SSD packing & shipment traceability, managing the creation and association of box UID - tray UID - lot UID - drive UID with its corresponding label generated. Project details are Micron Confidential, the link below might be access-restricted.",
    link: "https://github.com/jiajunlee19/react-next-app-packing",
    tags: ["React", "Next.js", "Tailwind", "MSSQL"],
    imageUrl: "/react-next-app-packing.png",
  },
] as const;