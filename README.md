# Sistema Asilo Vicentino

![Java](https://img.shields.io/badge/Java-21-red)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Railway-blue)
![Security](https://img.shields.io/badge/Security-BCrypt%20%2B%20RBAC-darkgreen)
![Deploy](https://img.shields.io/badge/Deploy-Railway-purple)
![Status](https://img.shields.io/badge/Status-live-brightgreen)

Full-stack institutional and administrative platform built for **Asilo Vicentino Nossa Senhora da Penha**, a charitable elderly care institution in Pirapozinho, SP.

The project combines a public website for community visibility with a protected internal system for the institution's daily operations.

**Live website:** [www.asilovicentino.com.br](https://www.asilovicentino.com.br)

## Highlights

- Public institutional website with news, transparency documents and donation flow.
- Protected administrative area with role-based access for secretary, coordinator and caregiver users.
- Resident, room, employee, activity, donation, expense and medication management.
- Medication box workflow by resident, including dose schedules and caregiver usage records.
- Weekly caregiver schedule templates with reusable models and manual exceptions.
- Coordinator dashboard for shift tracking, occurrences and medication records.
- Reports for donations, expenses, employees and occurrences, with PDF export support.
- Production deployment on Railway with PostgreSQL, persistent uploads and custom domain.

## Screenshots

Screenshots will be added soon.

## User Roles

| Role | Main Responsibilities |
| --- | --- |
| Secretary | Manages residents, employees, rooms, donations, expenses, medicines, medication boxes, activities and news. |
| Coordinator | Manages caregiver schedules, transparency documents, reports and shift supervision. |
| Caregiver | Starts and closes shifts, records occurrences and registers medication usage. |

## Security

The system was prepared with production security in mind:

- Password hashing with **BCrypt**.
- Session-based authentication.
- Role-based access control through custom filters.
- Protected private HTML pages.
- Unauthorized-access screen for blocked routes.
- Environment-based configuration for database and uploads.
- `.env` ignored by Git.
- Safe `.env.example` kept only as a configuration template.
- Prepared statements in critical DAO operations.
- Security headers for production, including CSP, HSTS, `nosniff`, frame protection and referrer policy.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot 4, Spring Web MVC, JDBC |
| Security | Spring Security Crypto, BCrypt, custom servlet filters |
| Database | PostgreSQL |
| Frontend | HTML, CSS, JavaScript, Bootstrap, Tailwind CDN |
| Charts/PDF | ApexCharts, jsPDF |
| Deploy | Railway, Railway PostgreSQL, Registro.br custom domain |

## Architecture

```text
src/main/java/unoeste/projetoasilo
  control/      HTTP controllers
  dao/          JDBC persistence layer
  db/util/      database connection utilities
  entities/     domain entities
  security/     authentication, authorization and headers
  util/         shared helpers

src/main/resources/static
  assets/       images and visual assets
  css/          page styles
  js/           page controllers
  *.html        public and private screens
```

## Production Status

The project is already running in a real deployment workflow:

- Domain purchased through Registro.br.
- Application deployed on Railway.
- PostgreSQL provisioned on Railway.
- Production schema created.
- Persistent upload volume configured for images and transparency PDFs.
- `www.asilovicentino.com.br` connected and validated.
- Root-domain redirect without `www` is still pending.

## Repository Hygiene

The repository keeps only source code and safe documentation. Local credentials, uploaded files, build artifacts, logs, backups and temporary exports are ignored by Git.

The `.env.example` file is intentionally public because it documents the required environment variables without exposing real credentials.

## Next Improvements

- Add polished screenshots and short demo GIFs.
- Finish root-domain redirect from `asilovicentino.com.br` to `www.asilovicentino.com.br`.
- Improve public donation integration with the institution's official PIX details.
- Continue replacing legacy SQL code with prepared statements across the remaining DAOs.
- Expand automated tests for authentication, authorization and core workflows.
