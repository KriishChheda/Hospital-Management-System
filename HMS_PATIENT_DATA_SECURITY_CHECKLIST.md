# HMS Patient Data Security Requirements Checklist

This document tracks implementation and verification of enterprise patient data security, role-based access control, encryption, compliance, and infrastructure isolation for the Hospital Management System.

---

## Progress Overview

| Category | Status | Total Items | Completed |
| :--- | :--- | :---: | :---: |
| 1. Data Encryption (Rest & Transit) | Pending | 4 | 0 |
| 2. Strict Role-Based Access Control (RBAC) | Completed | 4 | 4 |
| 3. Patient-Level Authorization | In Progress | 4 | 2 |
| 4. Secure Authentication & Sessions | Pending | 4 | 0 |
| 5. Comprehensive Audit Logging | Pending | 4 | 0 |
| 6. Patient Documents & Storage Security | Zero-Storage Design | 5 | 5 |
| 7. AI Service Security & Privacy | Pending | 6 | 0 |
| 8. Database Security | Pending | 5 | 0 |
| 9. Attack Surface Protection | Pending | 8 | 0 |
| 10. Backup & Disaster Recovery | Pending | 5 | 0 |
| 11. Hospital-Wise Multi-Tenant Isolation | Pending | 4 | 0 |
| 12. Deployment & Infrastructure Hardening | Pending | 6 | 0 |
| 13. Data Privacy & Legal Compliance | Pending | 5 | 0 |
| 14. Pre-Deployment Security Testing | Pending | 6 | 0 |
| **Total** | **Pending** | **70** | **0** |

---

## 1. Encrypt Patient Data at Rest and in Transit

- [ ] **1.1 Database, Storage, File, and Backup Encryption at Rest**
  - Implement full volume/disk encryption (AES-256) on database clusters, file storage drives, and cold backup stores.
  - Encrypt database tablespaces and sensitive columns (e.g., Aadhaar number, medical history, clinical notes).
- [ ] **1.2 Enforce HTTPS / TLS 1.3 for All Communication in Transit**
  - Enforce TLS 1.3 across all incoming client requests, API endpoints, microservices, and internal database connections.
  - Configure HTTP Strict Transport Security (HSTS) headers with long max-age and preload directives.
- [ ] **1.3 Secure Key Management (KMS / HSM Separation)**
  - Keep encryption keys strictly separated from database volumes and application code repositories.
  - Utilize dedicated Key Management Services (e.g., AWS KMS, HashiCorp Vault, or Cloud KMS) with key rotation policies.
- [ ] **1.4 Zero-Secret GitHub & Source Control Policy**
  - Ensure `.env`, certificates, API keys, database credentials, and signing secrets are never committed to git.
  - Enforce pre-commit hooks (e.g., git-secrets, gitleaks) and automated secret-scanning CI pipelines.

---

## 2. Implement Strict Role-Based Access Control (RBAC)

- [x] **2.1 Role-Specific Permission Boundaries**
  - Enforce least-privilege boundaries for all system roles (`ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PHARMACIST`, `LAB_TECHNICIAN`).
  - Restrict navigation, UI elements, and API routing so users can only access views required for their explicit operational duty.
- [x] **2.2 Minimum Necessary Information Principle**
  - Pharmacists access only medicine dispensing, batch numbers, and prescription fulfillment data.
  - Lab technicians access only requested lab orders and sample entry fields.
  - Receptionists access only scheduling, demographics, and billing invoice generation without unrestricted EMR access.
- [x] **2.3 Server-Side / Backend Permission Enforcement**
  - Validate role permissions directly inside API route handlers, middleware, and database access layers (never rely on frontend UI gating).
  - Reject unauthorized requests with standardized HTTP `403 Forbidden` responses and security audit logs.
- [x] **2.4 Administrative Access Segmentation**
  - Ensure system `ADMIN` privileges do not automatically grant open access to view, edit, or export confidential clinical consultation notes or diagnostic history.
  - Separate clinical data viewing privileges from user management, role assignment, and IT infrastructure controls.

---

## 3. Implement Patient-Level Authorization

- [ ] **3.1 Contextual Care Authorization Verification**
  - Verify whether the authenticated doctor or nurse is assigned to the specific patient, active visit, or department before granting access.
- [ ] **3.2 Scope Doctors and Staff to Relevant Clinical Contexts**
  - Prevent doctors from querying patient files outside their active consultation roster, assigned clinic, or explicit referral handover.
  - Restrict front-desk staff to patients currently booked or registered within their designated facility unit.
- [ ] **3.3 IDOR (Insecure Direct Object Reference) Protection**
  - Prevent unauthorized record access via patient ID, visit ID, or prescription ID manipulation in URL parameters or request payloads.
  - Validate ownership and authorization dynamically against database relationships on every lookup.
- [ ] **3.4 Per-Endpoint Permission Validation**
  - Enforce authorization checks across every single protected API route (`/api/patients/*`, `/api/emr/*`, `/api/prescriptions/*`, `/api/lab/*`).

---

## 4. Secure Authentication and Sessions

- [ ] **4.1 Multi-Factor Authentication (MFA)**
  - Implement mandatory Time-Based One-Time Password (TOTP) or hardware MFA for all privileged roles (`ADMIN`, `DOCTOR`, department heads).
- [ ] **4.2 Memory-Hard Password Hashing (Argon2id)**
  - Upgrade password hashing from legacy schemes to Argon2id with recommended memory, iterations, and parallelism parameters.
  - Enforce minimum entropy and password complexity rules (length, character variety, breached password dictionary checks).
- [ ] **4.3 Secure Session Lifecycle Management**
  - Implement short-lived access tokens, refresh token rotation (RTR), and absolute session timeouts.
  - Store tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
  - Provide immediate server-side session revocation on logout or credential change.
- [ ] **4.4 Brute-Force & Rate-Limiting Defenses**
  - Implement IP and account-based rate limiting on authentication routes (`/api/auth/login`, `/api/auth/signup`).
  - Introduce progressive delays, CAPTCHA gating on repeated failures, and account lockouts after consecutive invalid attempts.

---

## 5. Maintain Comprehensive Audit Logs

- [ ] **5.1 Clinical Record Access & Export Logging**
  - Log every view, read, query, edit, PDF generation, and export of patient demographic and clinical records.
- [ ] **5.2 Clinical, Diagnostic, and Medication Activity Logs**
  - Track every prescription creation, dosage update, lab order dispatch, lab result entry, and vital check.
  - Maintain change logs for patient status, admission, and queue movements.
- [ ] **5.3 Structured Audit Metadata Standards**
  - Record: Actor ID, Actor Role, Client IP Address, User Agent, Action Type, Timestamp (UTC), Target Entity/Patient ID, and Operation Outcome (`SUCCESS` / `FAILURE`).
- [ ] **5.4 Sanitized Audit Storage (No Sensitive Data Leakage)**
  - Ensure passwords, session tokens, cryptographic keys, and full clinical diagnostic narratives are never serialized into audit log bodies.

---

## 6. Secure Patient Documents and File Storage (Zero-Storage by Design)

> **Architectural Decision**: The system enforces a strict Zero-File-Storage architecture. No patient documents, scans, or attachments are uploaded to or stored on backend servers or cloud buckets. Aadhaar intake is executed purely client-side via in-browser OCR (Tesseract.js in RAM) and immediately discarded.

- [x] **6.1 Elimination of Server-Side File Storage Risk**
  - Completely disallow storage of patient files on public or private server volumes; zero disk exposure.
- [x] **6.2 Elimination of Permanent Public URLs**
  - Zero static file URLs exist for medical attachments; all document exports (registration cards, prescriptions) are generated dynamically in-memory.
- [x] **6.3 Ephemeral, In-Memory Client Document Generation**
  - Patient registration PDFs are compiled in-browser memory via `@react-pdf/renderer` blobs; prescriptions are printed via browser DOM print drivers without persistent cloud artifacts.
- [x] **6.4 Zero-File Upload Attack Surface**
  - Eliminate server-side file upload endpoints; Aadhaar documents are processed client-side in browser RAM without server network transmission.
- [x] **6.5 Authenticated Document Generation Scopes**
  - Restrict registration card compilation to authenticated receptionists and prescription printing to authenticated attending doctors.

---

## 7. Secure the AI Services

- [ ] **7.1 Internal Service Isolation for AI Workflows**
  - Restrict access to AI endpoints, triage assistants, and diagnostic support microservices to authenticated internal networks.
- [ ] **7.2 Patient Data Minimization for AI Processing**
  - Strip all direct identifiers (names, phone numbers, Aadhaar, full addresses) before forwarding symptoms or clinical text to AI models.
- [ ] **7.3 Third-Party AI Data Processing & Privacy Review**
  - Ensure zero data retention agreements (BAA / DPA) are in place if communicating with external model APIs.
  - Prohibit model training on hospital clinical payloads.
- [ ] **7.4 Zero Frontend AI Key Exposure**
  - Execute all AI prompts, inferences, and API orchestrations exclusively on secure backend servers; never expose API keys in browser bundles.
- [ ] **7.5 Ephemeral Prompt & Response Storage**
  - Discard raw AI prompt intermediates and temporary reasoning buffers immediately after generating clinical summaries.
- [ ] **7.6 Strict Input and Output Sanitization**
  - Validate and sanitize input prompts to prevent prompt injection attacks; validate and parse model outputs against rigid schemas before rendering.

---

## 8. Secure the Database

- [ ] **8.1 Private Subnet / No Public Exposure**
  - Bind PostgreSQL database instances exclusively to private internal VPC subnets with zero direct public internet IP accessibility.
- [ ] **8.2 Backend-Only Authorized Ingress**
  - Restrict database port access (default: 5432) strictly to authorized application server security groups.
- [ ] **8.3 Principle of Least Privilege Database Users**
  - Run database operations under dedicated service credentials with least privilege (separate schema migration credentials from operational runtime credentials).
- [ ] **8.4 Parameterized Queries & ORM Enforcement**
  - Enforce parameterized SQL queries and ORM query builders (Prisma) across all database interactions to eliminate SQL injection vulnerabilities.
- [ ] **8.5 Synthetic Test Data in Non-Production Environments**
  - Strictly prohibit copying production clinical databases into staging, QA, or local developer environments.
  - Use cryptographically generated synthetic datasets for development and demonstrations.

---

## 9. Protect Against Common Security Attacks

- [ ] **9.1 SQL Injection Defense**
  - Continuous validation of ORM queries, avoiding raw SQL string concatenation across all API routes.
- [ ] **9.2 Cross-Site Scripting (XSS) Prevention**
  - Sanitize all user inputs, escape HTML renders, and configure a strict Content Security Policy (CSP) header.
- [ ] **9.3 Cross-Site Request Forgery (CSRF) Protection**
  - Enforce `SameSite=Strict` or `SameSite=Lax` cookie flags, anti-CSRF request tokens for state-changing operations, and custom request header verification.
- [ ] **9.4 Insecure Direct Object Reference (IDOR) Hardening**
  - Implement tenant and user ownership assertions across all resource identifiers in route parameters.
- [ ] **9.5 Brute-Force Protection**
  - Enforce credential rate limiting, IP reputation filtering, and adaptive lockout controls.
- [ ] **9.6 Session Hijacking Countermeasures**
  - Enforce TLS, bind sessions to security fingerprints, regenerate session tokens upon privilege escalation, and enforce strict timeouts.
- [ ] **9.7 Unauthorized API Route Audits**
  - Ensure no API endpoints are left unauthenticated by middleware defaults; audit public endpoints to confirm only intended guest routes are accessible.
- [ ] **9.8 Malicious File Upload Prevention**
  - Store files outside web root, randomize stored file names, strip executable permissions, and validate file magic bytes.

---

## 10. Secure Backups and Recovery

- [ ] **10.1 Automated, Encrypted Backups**
  - Configure daily automated full database snapshots and transactional log archives encrypted with AES-256.
- [ ] **10.2 Isolated Offsite Backup Storage**
  - Store secondary backups in a physically and logically isolated cloud region/account with immutable object lock (WORM storage).
- [ ] **10.3 Restricted Backup Access Privileges**
  - Restrict backup retrieval and deletion permissions to senior infrastructure administrators with multi-party approval requirements.
- [ ] **10.4 Defined Retention Policies**
  - Establish automated lifecycle rules matching regulatory compliance (e.g., retain daily backups for 30 days, monthly for 1 year, annual archives per healthcare statute).
- [ ] **10.5 Routine Restoration Drills**
  - Conduct scheduled quarterly backup restoration drills to verify data integrity and measure Recovery Time Objective (RTO) / Recovery Point Objective (RPO).

---

## 11. Maintain Hospital-Wise Data Isolation

- [ ] **11.1 Dedicated Multi-Tenant Instance Architecture**
  - Maintain architectural isolation so each hospital deployment runs as an independent tenant or standalone containerized instance.
- [ ] **11.2 Isolated Databases & Credentials**
  - Provide dedicated database schemas, connection strings, and credential stores for each hospital deployment.
- [ ] **11.3 Zero Cross-Tenant Data Leakage**
  - Verify that no patient query, lookup, prescription, or billing record can cross hospital boundaries under any condition.
- [ ] **11.4 Independent Tenant Encryption Keys and Backups**
  - Maintain separate encryption keys, KMS aliases, and backup archives per hospital client.

---

## 12. Secure Deployment and Infrastructure

- [ ] **12.1 Hardened Server Configurations**
  - Disable unnecessary server ports, remove unused system utilities, and apply CIS (Center for Internet Security) hardening benchmarks.
- [ ] **12.2 Restricted SSH and Host Access**
  - Disable password-based SSH access; require hardware-backed SSH keys or bastion zero-trust access tunnels (e.g., AWS SSM / Cloudflare Tunnels).
- [ ] **12.3 Firewalls, Security Groups, and Private Networking**
  - Configure stateful firewalls, private VPC subnets, and strict ingress/egress security group rules.
- [ ] **12.4 Dependency & OS Patch Management**
  - Automate vulnerability scanning for packages and container base images (e.g., Dependabot, Snyk, Trivy); maintain zero unpatched critical CVEs.
- [ ] **12.5 Continuous Monitoring & Anomaly Detection**
  - Implement real-time monitoring of failed logins, unusual outbound network traffic, elevated error rates, and security telemetry alerts.
- [ ] **12.6 Principle of Least Privilege for Infrastructure Operations**
  - Restrict cloud console and server administrative access using role-based identity federations and audit-logged jump hosts.

---

## 13. Ensure Data Privacy and Compliance

- [ ] **13.1 Indian Healthcare & Digital Personal Data Protection Compliance**
  - Align data handling and consent workflows with the Digital Personal Data Protection (DPDP) Act and Ayushman Bharat Digital Mission (ABDM) standards.
- [ ] **13.2 Patient Privacy Notices and Explicit Consent Management**
  - Maintain explicit patient consent records (`privacyAccepted: true`, `detailsAccurate: true`) at registration and pre-booking onboarding.
- [ ] **13.3 Data Retention and Right-to-Erasure Policies**
  - Define clear schedules for active clinical record retention, legal preservation, and verified data anonymization/erasure protocols.
- [ ] **13.4 Incident Response & Data Breach Protocols**
  - Establish a formalized Incident Response Plan (IRP) with defined containment, technical investigation, and statutory regulatory breach notification timelines.
- [ ] **13.5 Third-Party Vendor Security Reviews**
  - Conduct formal security, privacy, and architecture reviews for all integrated third-party SDKs, payment gateways, and cloud service providers.

---

## 14. Mandatory Security Testing Before Deployment

- [ ] **14.1 Dynamic Application Security Testing (DAST) & Penetration Testing**
  - Perform automated and manual web application penetration testing against OWASP Top 10 vulnerabilities.
- [ ] **14.2 Role Permission and Patient Boundary Verification**
  - Execute automated permission matrix test suites verifying every role is blocked from unauthorized cross-role and cross-patient resources.
- [ ] **14.3 API Security & Fuzz Testing**
  - Test all REST endpoints with malformed payloads, oversized buffers, parameter tampering, and negative authorization tests.
- [ ] **14.4 Disaster Recovery & Restoration Verification**
  - Validate end-to-end data restoration from cold backup archives on an isolated staging server prior to production rollout.
- [ ] **14.5 Formal Release Security Gate**
  - Enforce mandatory peer review and sign-off on security architecture prior to every major release deployment.
- [ ] **14.6 Exclusive Use of Synthetic Data for Demos and Staging**
  - Verify that staging systems, automated CI test suites, and product demonstration databases use 100% synthetically generated patient records.

---

## Verification Notes & Implementation Log

| Date | Item ID | Implemented By | Verified By | Implementation / Commit Reference |
| :--- | :--- | :--- | :--- | :--- |
| *YYYY-MM-DD* | *e.g., 2.3* | *Developer Name* | *Reviewer Name* | *Commit SHA / PR link* |
| | | | | |
| | | | | |
| | | | | |
