# Sistema Asilo Vicentino

![Java](https://img.shields.io/badge/Java-21-red)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Maven](https://img.shields.io/badge/Maven-Wrapper-orange)
![Security](https://img.shields.io/badge/Security-BCrypt%20%2B%20Access%20Filters-darkgreen)
![Status](https://img.shields.io/badge/status-deployment%20in%20progress-yellow)

Sistema Asilo Vicentino is a full-stack web platform developed for a real charitable elderly care institution. The project combines a public institutional website with a protected internal management system, helping the organization present its mission online while supporting daily administrative and care-related workflows.

The system includes public pages for news, transparency and donations, plus private dashboards for secretaries, coordinators and caregivers. It is currently in the deployment phase with Railway cloud hosting, a managed PostgreSQL database, environment-based configuration and the official domain `asilovicentino.com.br` registered through Registro.br.

## Purpose

The goal of this project is to centralize the main digital processes of Asilo Vicentino in a single application.

The public area focuses on visibility, trust and community engagement. The internal area focuses on operational management, including residents, staff, rooms, medication boxes, schedules, occurrences, donations, expenses and reports.

This project demonstrates practical full-stack development with Java, Spring Boot, PostgreSQL, authentication, role-based access control, file uploads, relational data modeling, administrative dashboards and a real deployment workflow for a charitable institution.

## Main Features

### Public Website

- Institutional landing page for the elderly care home.
- Public news section managed by the internal team.
- Transparency area for accountability documents.
- Donation section prepared for real-world fundraising.
- Responsive public experience for desktop and mobile visitors.

### Administrative System

- Protected login area with session-based authentication.
- Separate workflows for secretary, coordinator and caregiver profiles.
- Administrative dashboards focused on daily institutional routines.
- Access validation for protected pages.
- Unauthorized access page for blocked resources.

### Resident and Room Management

- Resident registration, editing and listing.
- Responsible contact linked to each resident.
- Room registration with capacity and availability control.
- Gender-aware room assignment validation.
- Cleaner resident list focused on useful operational information.

### Medication Box Workflow

- Medication catalog management.
- Medication boxes organized by resident.
- Multiple medicines inside the same resident medication box.
- Custom frequency configuration, such as every 8 or 12 hours.
- Dose quantity, first schedule time, start date and end date.
- Integration with caregiver medication usage records.

### Staff, Schedules and Shifts

- Employee registration and management.
- Staff categories for secretary, coordinator and caregiver workflows.
- Weekly schedule management.
- Reusable weekly schedule templates.
- Support for multiple schedule models.
- Manual exceptions after applying a schedule template.
- Shift tracking with clear status indicators.

### Occurrences and Care Records

- Occurrence type registration.
- Occurrence registration by caregivers.
- Residents linked to each occurrence.
- Shift-based operational history.
- Coordinator view for monitoring staff activity and care records.

### Finance, Donations and Transparency

- Donation registration and tracking.
- Expense registration and categorization.
- Transparency document upload and download.
- Analytical reports for donations, expenses, employees and occurrences.
- PDF export support for administrative reports.

## Security Highlights

Security was one of the most important improvement areas of the project.

- Password hashing with BCrypt through Spring Security Crypto.
- Session-based authentication for private areas.
- Custom access control filter for protected pages.
- Role-based authorization by employee category.
- Public and private page separation.
- Unauthorized access handling for restricted resources.
- Sensitive configuration moved to environment variables.
- `.env` ignored by Git to avoid exposing local credentials.
- Prepared statements used in critical database operations.
- Safer dynamic ordering with whitelisted fields.
- Legacy plaintext password migration support.
- Upload directory configurable outside the source code.

## Technology Stack

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Security Crypto
- PostgreSQL
- JDBC
- Maven Wrapper
- HTML
- CSS
- JavaScript
- Bootstrap
- Tailwind CDN
- ApexCharts
- jsPDF
- Dotenv Java
- pgAdmin

## Architecture

The backend follows a layered structure, separating controllers, DAOs, entities, database utilities, security configuration and static frontend assets.

```text
src/
  main/
    java/
      unoeste/
        projetoasilo/
          control/
          dao/
          db/
            util/
          entities/
          security/
          util/
          ProjetoAsiloApplication.java
    resources/
      static/
        assets/
        css/
        js/
        *.html
      application.properties
      abrigovicentinodb.sql
      atualizacao-producao.sql
```

## System Areas

### Public Area

Designed for visitors, family members, donors and the local community. It presents the institution, its work, news, transparency documents and donation information.

### Secretary Area

Focused on administrative records such as residents, employees, rooms, medicines, medication boxes, activities, donations and expenses.

### Coordinator Area

Focused on supervision, schedules, transparency documents, reports and shift monitoring.

### Caregiver Area

Focused on daily care routines, including shift activity, occurrences and medication usage registration.

## Database Highlights

The system uses PostgreSQL as its relational database and JDBC for persistence.

The database supports:

- Users and employees.
- Residents and responsible contacts.
- Rooms and occupancy control.
- Medication catalog.
- Medication boxes and scheduled doses.
- Medication usage records.
- Occurrences and occurrence types.
- Donations and expenses.
- Activities and transparency documents.
- Staff schedules and shift history.

The project includes SQL scripts for initial database creation and production updates for existing databases.

## Deployment Status

This project has moved from local development into a real deployment workflow.

- GitHub repository cleaned and updated for deployment.
- Official domain purchased: `asilovicentino.com.br`.
- Railway project created for cloud hosting.
- Railway PostgreSQL service created.
- Initial PostgreSQL schema executed in the Railway database.
- Environment variables configured for production behavior.
- Temporary Railway public URL generated for validation.
- HTTPS-ready session configuration with secure cookies.
- Persistent upload strategy documented for images and transparency files.
- Production SQL scripts documented for clean databases and future updates.

The official domain is not the final public entry point yet. The current deployment is being validated through Railway before DNS configuration and public release.

## Technical Strengths

- Full-stack Java web application built around a real institution.
- Public website and internal administrative system in the same project.
- Role-based workflows for different staff responsibilities.
- BCrypt password encryption and custom access filters.
- PostgreSQL relational database integration.
- File upload support for images and transparency documents.
- Medication box workflow adapted to the institution's real routine.
- Weekly schedule templates to reduce repetitive coordinator work.
- Dashboard and report screens for operational decision-making.
- Repository prepared for production deployment and continuous improvement.

## Repository Hygiene

The repository is configured to avoid committing sensitive or generated files.

Ignored files include:

- `.env`
- `.env.local`
- IDE folders
- build output
- uploaded files
- logs
- temporary files

The `.env.example` file is kept only as a safe configuration model, without real credentials.

## Status

The project is currently in deployment validation. The domain has been purchased, Railway hosting is active, PostgreSQL has been provisioned and the initial schema has been created. The next steps are validating the temporary Railway URL, creating real administrative users, testing uploads and protected workflows, rotating exposed database credentials and then pointing `asilovicentino.com.br` to the Railway deployment.
