## ADDED Requirements — Personal (1-on-1) Classes

---

### Requirement: Personal classes dashboard
The system SHALL provide the coach with a dedicated Personal Classes view showing upcoming private sessions, session history per student, and a quick-book action — distinct from group class management.

#### Scenario: Coach opens Personal Classes view
- **WHEN** the coach navigates to "Personal Classes"
- **THEN** the page shows two sections: "Upcoming Sessions" (chronological list of all scheduled private sessions) and "Recent Sessions" (last 10 logged private sessions across all students)

#### Scenario: Coach quick-books a private session
- **WHEN** the coach clicks "Book Session" and selects a student, date, time, and duration
- **THEN** a `ScheduledSession` record is created and the session appears in the upcoming list and on the calendar

#### Scenario: Coach views session history for a student
- **WHEN** the coach opens a student's personal session history tab
- **THEN** all past `CoachSession` records for that student are listed in reverse chronological order with date, duration, topics, and a link to session notes

---

### Requirement: Personal session logging
The system SHALL allow the coach to log a completed private session directly from the Personal Classes view or the student's profile, capturing notes, topics, homework, and wellness data.

#### Scenario: Coach logs a private session
- **WHEN** the coach selects "Log Session" from the Personal Classes view, picks a student (or selects from today's scheduled sessions), and fills in notes and topics
- **THEN** a `CoachSession` record is saved, homework (if set) is created for that student, and the student's AI context is updated

#### Scenario: Coach converts a scheduled session to a logged session
- **WHEN** the coach marks a `ScheduledSession` as completed and adds notes
- **THEN** the `ScheduledSession` status is updated to COMPLETED and a linked `CoachSession` record is created

---

### Requirement: Personal vs group session distinction in billing
The system SHALL display private lesson billing and group class billing on separate tabs so the coach can clearly see what each student owes for 1-on-1 work vs. group classes.

#### Scenario: Private billing tab
- **WHEN** the coach views the Billing page "Private Lessons" tab
- **THEN** rows show: student name, sessions count (private only), hours, rate (User.hourlyRate), and total owed — group sessions are excluded

---

### Requirement: Upcoming personal sessions widget on coach home
The system SHALL show the coach their next 3 upcoming private sessions as a widget on the main coach dashboard, separate from group class slots.

#### Scenario: Coach opens the dashboard
- **WHEN** the coach logs in
- **THEN** a "Today / Upcoming" section shows the next 3 private sessions with student name, time, and a "Start Brief" quick action link

---

### Requirement: Personal class scheduling rules
The system SHALL prevent double-booking of the coach's time when creating or editing private sessions.

#### Scenario: Coach tries to book overlapping private sessions
- **WHEN** the coach books a private session that overlaps in time with an existing private session or a group class slot
- **THEN** the system shows a conflict warning with the conflicting booking details and blocks the save

#### Scenario: Coach reschedules a session
- **WHEN** the coach edits the date/time of an existing `ScheduledSession`
- **THEN** the same conflict check runs against the new proposed time before saving
