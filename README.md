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

## Screenshots

### Public Experience

<p align="center">
  <img src="docs/screenshots/public-home.png" alt="Asilo Vicentino public homepage" width="49%" />
  <img src="docs/screenshots/public-history.png" alt="Asilo Vicentino institutional history section" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/public-routine.png" alt="Asilo Vicentino daily routine section" width="49%" />
  <img src="docs/screenshots/public-transparency.png" alt="Asilo Vicentino transparency document area" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/public-news.png" alt="Asilo Vicentino public news area" width="49%" />
  <img src="docs/screenshots/login.png" alt="Asilo Vicentino protected login page" width="49%" />
</p>

### Internal Management

<p align="center">
  <img src="docs/screenshots/coordinator-dashboard.png" alt="Coordinator dashboard with shift tracking" width="49%" />
  <img src="docs/screenshots/schedule-management.png" alt="Weekly caregiver schedule management" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/occurrence-report.png" alt="Occurrence report dashboard" width="49%" />
  <img src="docs/screenshots/occurrence-charts.png" alt="Occurrence report charts" width="49%" />
</p>
<p align="center">
  <img src="docs/screenshots/caregiver-dashboard.png" alt="Caregiver shift control dashboard" width="49%" />
</p>

## Highlights

- Public institutional website with news, transparency documents and donation flow.
- Protected administrative area with role-based access for secretary, coordinator and caregiver users.
- Resident, room, employee, activity, donation, expense and medication management.
- Medication box workflow by resident, including dose schedules and caregiver usage records.
- Weekly caregiver schedule templates with reusable models and manual exceptions.
- Coordinator dashboard for shift tracking, occurrences and medication records.
- Reports for donations, expenses, employees and occurrences, with PDF export support.
- Production deployment on Railway with PostgreSQL, persistent uploads and custom domain.
- Continuous deployment from GitHub, with more than 100 commits documenting the product evolution.
- Public discoverability through Google Search Console, XML sitemap, structured data and indexed HTTPS pages.

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
