# Produktions-Checkliste: reservierung.rileg.de

Diese Checkliste dient als Leitfaden für den sicheren und stabilen Betrieb des Reservierungssystems für Räume und Fahrzeuge der Raiffeisenbank Isar-Loisachtal eG unter der internen Subdomain `reservierung.rileg.de`.

## 1. Infrastruktur & Hosting
- [ ] **Hosting-Umgebung:** Bereitstellung eines dedizierten Linux-Servers oder Containers. Empfohlen: Node.js 20+ Umgebung (z. B. Docker).
- [ ] **Ressourcen:** Mindestens 2 vCores, 4 GB RAM. Ausreichend dimensionierter, persistenter SSD-Speicher für die Datenbank (PostgreSQL) und Logs.
- [ ] **Webserver/Reverse Proxy:** Nginx oder Traefik als Reverse Proxy vor dem Node.js-Dienst (Port 3000) zur Handhabung von SSL/TLS und statischen Ressourcen.
- [ ] **Isolierung:** Betrieb ausschließlich im internen Netzwerk (Intranet). Die Anwendung darf nicht aus dem öffentlichen Internet erreichbar sein.

## 2. Sicherheit & Netzwerk
- [ ] **HTTPS/TLS:** Zertifikat für `reservierung.rileg.de` ausstellen (z.B. über unternehmensinterne CA). Die Kommunikation muss ausschließlich via TLS 1.2 / 1.3 verschlüsselt erfolgen. HTTP-Traffic auf HTTPS umleiten.
- [ ] **Sichere HTTP-Header (Helmet Configuration):** Konfigurieren relevanter Security Header am Reverse Proxy oder über eine Express Middleware (z.B. `helmet`).
  - HSTS (Strict-Transport-Security)
  - Content-Security-Policy (CSP)
  - X-Frame-Options (DENY)
  - X-Content-Type-Options (nosniff)
  - Referrer-Policy
- [ ] **Suchmaschinenschutz:** Sicherstellen, dass die Applikation nicht von Suchmaschinen indexiert wird:
  - Header: `X-Robots-Tag: noindex, nofollow`
  - HTML Meta-Tag ist implementiert (`<meta name="robots" content="noindex, nofollow">`)
- [ ] **robots.txt:** Vorhalten einer sperrenden `robots.txt` Datei im statischen Root-Verzeichnis (`/dist/robots.txt` in Vite, über Express augeliefert):
  ```
  User-agent: *
  Disallow: /
  ```
- [ ] **Sicheres Session Management:** `SESSION_SECRET` in der Produktionsumgebung durch einen starken, kryptografisch sicheren Zufallswert (mind. 64 Zeichen) ersetzen. Cookies in Produktion mit den Flags `HttpOnly`, `Secure` und `SameSite=Strict` versehen.

## 3. Datenbank & Backups
- [ ] **Datenbankmigration auf PostgreSQL:** Die aktuelle SQLite-Datenbank muss für den Produktionsbetrieb aus Gründen der Skalierbarkeit und Nebenläufigkeit (verhindert Locks bei parallelen Buchungen) auf PostgreSQL migriert werden.
  - Anpassen des Datenbank-Treibers (`pg` anstelle von `sqlite3`).
  - Schema und SQL-Statements (`?` Parameter) an PostgreSQL (`$1` Parameter, Datentypen wie `SERIAL`) anpassen.
- [ ] **Backup-Konzept:**
  - Tägliche automatisierte Backups (SQL-Dumps) auf einen separaten, revisionssicheren und verschlüsselten Speicherserver.
  - Backups mindestens 30 Tage aufbewahren.
  - Regelmäßige Wiederherstellungstests (Restores) durchführen, um die Intaktheit der Backups zu gewährleisten.

## 4. Betrieb, Logging & Monitoring
- [ ] **Logging:**
  - Konfiguration strukturierter Logs für die Standardausgabe (stdout/stderr).
  - Logs sammeln in einem zentralen Log-Management-System (z. B. ELK, Splunk, Graylog).
  - Die Anwendungslogs in der Tabelle `audit_logs` müssen unmanipulierbar sein.
- [ ] **Monitoring / Alerting:**
  - Überwachung der Server-Ressourcen (CPU, RAM, I/O).
  - Uptime- und Fehler-Alerting (Benachrichtigung der IT/Admins bei 5xx Fehlern oder Downtime).
- [ ] **Notfallzugang:** Dokumentierten und gesicherten Prozess (z.B. SSH Auth / Jumpserver / PAM) für direkten Datenbank- / Serverzugriff bereithalten, falls die Web-UI komplett ausfällt.

## 5. Administration & Benutzerverwaltung
- [ ] **Admin-Passwortwechsel:** Das Passwort für den initialen Administrationsbenutzer (yhadmin) sofort nach Systemübergabe bzw. Live-Deployment ändern und sicher im unternehmensinternen Passwort-Safe hinterlegen.
- [ ] **Berechtigungskonzept:** 
  - Admin-Rolle streng limitieren auf wenige IT-/Inhouse-Verwalter der Raiffeisenbank.
  - Manager-Rolle (falls implementiert) nur exakt definieren.
  - Prüfung der Minimalen Rechtevergabe (Least Privilege).
- [ ] **Regelmäßige Prüfung der berechtigten User:** Implementieren eines z.B. monatlichen Prozesses, in welchem ausgeschiedene Mitarbeiter aus dem System entfernt oder deren Konten deaktiviert werden (z. B. CSV-Abgleich mit dem HR-System).
- [ ] **Update- und Patch-Prozess:** 
  - Node.js Patches und NPM-Dependencies (insb. Express, SQLite3/PG, Vite) regelmäßig auf CVEs prüfen (`npm audit`).
  - Definieren eines Wartungsfensters für reguläre Updates.

## 6. Datenschutz & Compliance
- [ ] **Datenschutzprüfung (DSGVO):**
  - Internes Verfahrensverzeichnis (VVT) für Raumbuchung & Fahrtenbuch anlegen/aktualisieren.
  - Löschkonzept erarbeiten: Abgelaufene Reservierungen und alte Audit-Logs nach einem definierten Zeitraum (z.B. 1 Jahr) automatisch löschen (Datensparsamkeit gemäß Art. 5c DSGVO).
  - Datenschutzerklärung (Link im Footer) auf aktuelle Vorgaben des Datenschutzbeauftragten abstimmen.
- [ ] **Unnötige Daten:** Keine unnötigen Profilfelder für User speichern (derzeit auf Name, Email, Kennung beschränkt ✅).

## 7. Tests vor Livegang
- [ ] **Sicherheits-Check:** Prüfung der Applikation auf Verhinderung doppelter Buchungen durch Parallel-Requests (Race Condition/Transaction Check).
- [ ] **Rate Limiter:** Test des integrierten Rate Limitings auf `/api/auth/login`, indem absichtlich übermäßig fehlerhaft eingeloggt wird.
- [ ] **CSV-Upload Analyse:** Upload von modifizierten (XSS) und fälschlich formattierten CSVs testen.
- [ ] **Endgeräte-Kompatibilität:** Bestätigen der Usability auf Bank-PCs in Standardbrowsern sowie mobilen Geräten der Außendienstmitarbeiter.
- [ ] **Pen & Vulnerability Scan:** Vor Freigabe ggf. internen Web App Scan anordnen.
